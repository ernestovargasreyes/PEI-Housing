# Workflows & Automation

**Status:** Draft v0.3 · Companion to `00-requirements.md`, `01-data-model.md`

> **v0.2:** vendor assignment, accept/decline, and chase automation removed. All tasks are
> owned by PEI people. Where outside work is involved, the task is "arrange it" or "confirm
> it was done" — owned, dated, and chased internally.
> **v0.3:** coordinator team is 2. Routing is a shared queue with load-based assignment
> (§5), and the after-hours rotation is two-deep with the housing manager as fallback (§7).
> Resident-form intake rules A7–A12 and B9–B10 live in `05-resident-intake.md` §9.

This is the heart of the system. The ticket is a container; **automation generates and
assigns the work**, and humans intervene by exception.

---

## 1. Ticket state machine

```
                   ┌───────────────────────────────────────────┐
                   │                                           │
  new ──► triaged ──► in_progress ──► pending_* ──► resolved ──► closed
   │          │            │              │            │
   │          │            └──────────────┘            │
   │          │         (pending clears, returns)      │
   │          ▼                                        ▼
   └────► cancelled                                reopened ──► in_progress
```

| Status | Meaning | Exit condition |
|---|---|---|
| `new` | Created, not yet reviewed | Coordinator sets category, priority, owner → tasks generate |
| `triaged` | Categorized, owned, tasks generated and assigned | First task started |
| `in_progress` | Work underway | All required tasks done, or blocked externally |
| `pending_external` | Waiting on an outside party the coordinator is chasing (contractor, utility, supplier) | They act |
| `pending_approval` | Waiting on cost approval above threshold | Manager approves/rejects |
| `pending_occupant` | Waiting on occupant access or response | Occupant responds |
| `pending_landlord` | Landlord responsibility, awaiting their action | Landlord acts |
| `resolved` | Work complete, resolution code + notes set, required tasks done | Verification window elapses or coordinator closes |
| `closed` | Final. Costs reconciled. | — (reopen creates `reopened`) |
| `reopened` | Same issue recurred within 30 days | Returns to `in_progress` |
| `cancelled` | Not needed / duplicate | — |

**Rules**

- `resolved` is blocked while any `required` task is not `done` or `skipped`.
- `closed` is blocked while any CostEntry is `pending` approval.
- `pending_occupant` and `pending_landlord` **pause** the SLA clock. `pending_external`
  **does not** — chasing an outside party is PEI's job, not an excuse for the clock.
- Reopen within 30 days links to the original and flags it for quality review.
- Every status change writes an AuditEvent with actor and timestamp.

---

## 2. Priority & SLA

| Priority | Definition | First response | Target resolution | Clock |
|---|---|---|---|---|
| `emergency` | Habitability or safety: no heat/AC in extreme weather, no water, gas smell, flooding, no power, lockout, break-in | 1 hour | 24 hours | 24×7 |
| `high` | Major function impaired: single appliance down, partial power, pest infestation, no hot water | 4 business hours | 3 business days | Business hours |
| `normal` | Routine repair or request | 1 business day | 7 business days | Business hours |
| `low` | Cosmetic, deferrable | 2 business days | 30 days | Business hours |

Lease/billing and housing-request families use `normal` unless tied to a move date, in which
case `due_at` is driven by the move date, not the SLA table.

**Auto-priority on intake** — keyword match on subject/description *proposes* a priority:
`flood|leak|no heat|no water|gas|smoke|electrical|lockout` → propose `emergency`. Never
applied silently; it highlights the field for the coordinator.

**Downgrading priority requires a reason** (written to AuditEvent). Upgrading does not.

---

## 3. Automation rules

Rules are data, not code — a housing manager can add one. Each is
`WHEN <trigger> [IF <condition>] THEN <actions>`.

### 3.1 Intake automation

| # | Rule |
|---|---|
| A1 | WHEN email arrives in `housing@` THEN create ticket `status=new`, `intake_channel=email`, attach body + files, parse unit number from subject if present |
| A2 | WHEN email arrives AND subject contains an existing `HT-` id THEN append as a comment to that ticket instead of creating a new one |
| A3 | WHEN ticket created THEN propose priority by keyword (§2) and notify **both coordinators** — at this team size the queue is shared, not partitioned |
| A4 | WHEN ticket created AND `priority=emergency` THEN alert the on-duty coordinator immediately (SMS + email), regardless of hour |
| A5 | WHEN ticket created AND an open ticket exists for the same unit + category created < 7 days ago THEN flag as possible duplicate and link |
| A6 | WHEN ticket created with no `owner_coordinator_id` THEN assign via `coordinator_by_load` |
| A7–A12 | **Resident form intake** — creation, emergency keyword alerting, duplicate handling, stale-token holds, and resident confirmation/status notifications. Defined in `05-resident-intake.md` §9 |

### 3.2 Triage → task generation — **the core loop**

| # | Rule |
|---|---|
| B1 | WHEN `status` → `triaged` THEN instantiate the active TaskTemplate for (`family`,`category`), creating one Task per step whose `condition` passes, and record `template_version_used` on the ticket |
| B2 | WHEN tasks are generated THEN set each `due_at` from `due_offset_hours`, and set `blocked` on any task whose predecessor is unfinished |
| B3 | WHEN a task is generated THEN resolve `default_assignee_rule` (§5) to a person; if it resolves to nobody, assign to the owner coordinator and flag `assignment_failed` |
| B4 | WHEN a task's predecessor is marked `done` THEN move the dependent `blocked` → `not_started` and notify its assignee |
| B5 | WHEN all `required` tasks are `done`/`skipped` THEN prompt the owner coordinator to resolve. Never auto-resolve — a human confirms the outcome |
| B6 | WHEN a task is marked `done` AND `evidence_required` is set AND no matching attachment exists THEN reject the completion with the reason |
| B7 | WHEN a task is `skipped` without a `skip_reason` THEN reject |
| B8 | WHEN a ticket is reopened THEN regenerate only the unfinished required tasks, preserving the original task history |
| **B9** | WHEN tasks generate for `intake_channel=resident_form` AND access permission, windows, and pets are all populated THEN **auto-complete step 1 of the maintenance template** ("Contact occupant, confirm issue + access window") with a system note and start at step 2. This is the rule that makes the resident form reduce coordinator workload rather than relocate it — see `05-resident-intake.md` §9 |
| B10 | WHEN a coordinator calls a resident for information the form should have captured THEN set `required_callback` with a reason code |

### 3.3 Task chase automation

| # | Rule |
|---|---|
| C1 | WHEN a task is assigned THEN notify the assignee with ticket context, unit address, and due date |
| C2 | WHEN a task reaches 50% of its time-to-due with status `not_started` THEN nudge the assignee |
| C3 | WHEN a task passes `due_at` THEN notify the assignee; at +24h notify the owner coordinator; at +48h notify the housing manager |
| C4 | WHEN a task is reassigned THEN notify both the old and new assignee and log the reason |
| C5 | WHEN an assignee is marked inactive THEN reassign all their open tasks via the original rule and alert the housing manager |
| C6 | WHEN a task sits `blocked` > 5 business days THEN surface it — a stuck predecessor is the usual cause of a silently dead ticket |

### 3.4 SLA & escalation

| # | Rule |
|---|---|
| D1 | WHEN 50% of ticket time-to-due has elapsed with no status change THEN nudge the owner coordinator |
| D2 | WHEN `due_at` passes THEN mark `sla_breached`, notify owner + housing manager |
| D3 | WHEN `priority=emergency` and no first response within 1 hour THEN escalate to the housing manager directly |
| D4 | WHEN a ticket sits in `new` > 4 business hours THEN escalate — untriaged work is the failure mode this system exists to kill |
| D5 | WHEN a ticket sits in any `pending_*` > 5 business days THEN force a coordinator review |
| D6 | WHEN a move-in is 72 hours away AND required prep tasks are incomplete THEN alert the owner coordinator and the housing manager |

### 3.5 Cost control

| # | Rule |
|---|---|
| E1 | WHEN a CostEntry exceeds the threshold (suggest $500) THEN set ticket `pending_approval` and route to the housing manager |
| E2 | WHEN total actual cost exceeds estimated by > 25% THEN flag for manager review |
| E3 | WHEN a cost is approved THEN return the ticket to its prior status and notify the owner |
| E4 | WHEN a maintenance ticket → `resolved` with no CostEntry THEN prompt "no cost recorded — confirm" |
| E5 | WHEN `chargeable_to = landlord` THEN generate a landlord-recovery task on resolution |

### 3.6 Scheduled generation

| # | Rule |
|---|---|
| F1 | DAILY: for each Lease with `end_date` in 60 days and no open renewal ticket THEN create `lease_billing / renewal` |
| F2 | DAILY: for each Occupancy with `move_out_date` in 14 days THEN create `turnover / move_out_inspection` (parent) |
| F3 | DAILY: for each Occupancy with `move_in_date` in 7 days THEN create `turnover / move_in_prep` |
| F4 | QUARTERLY: for each active Unit THEN create an inspection ticket |
| F5 | DAILY: for each Asset where `last_pm_date + pm_interval_days` ≤ today THEN create a PM ticket |

---

## 4. Task templates (starting set)

Every assignee below is a PEI person. "Arrange" means the coordinator contacts an outside
company by phone or email — the system tracks that *the coordinator did it*, not the
company's response.

### 4.1 Move-out turnover — `turnover / move_out_inspection`

| Seq | Task | Assignee rule | Req | Blocked by | Due | Evidence |
|---|---|---|---|---|---|---|
| 1 | Confirm move-out date with occupant | `owner_coordinator` | ✓ | — | +1 d | — |
| 2 | Collect keys / access devices | `site_manager_on_project` | ✓ | — | move-out date | — |
| 3 | Conduct move-out inspection, photograph condition | `owner_coordinator` | ✓ | 1 | move-out +1 d | photo |
| 4 | Assess damage vs. normal wear | `owner_coordinator` | ✓ | 3 | +1 d | — |
| 5 | Create repair child tickets for damage found | automation | — | 4 | +0 | — |
| 6 | Arrange deep clean | `owner_coordinator` | ✓ | 3 | +2 d | — |
| 7 | Confirm deep clean completed | `owner_coordinator` | ✓ | 6 | +5 d | photo |
| 8 | Arrange furniture removal / inventory *(if `unit.furnished`)* | `owner_coordinator` | — | 3 | +3 d | photo |
| 9 | Transfer / stop utilities | `owner_coordinator` | ✓ | — | move-out date | — |
| 10 | Final walkthrough, mark unit `available` | `owner_coordinator` | ✓ | 7 | +1 d | photo |
| 11 | Process deposit disposition | `owner_coordinator` | ✓ | 4 | +14 d | document |

### 4.2 Move-in prep — `turnover / move_in_prep`

Due offsets are relative to the move-in date — the one template where the deadline is an
external commitment rather than an SLA.

| Seq | Task | Assignee rule | Req | Due | Evidence |
|---|---|---|---|---|---|
| 1 | Confirm unit is `available` and clean | `owner_coordinator` | ✓ | −7 d | — |
| 2 | Verify utilities active in PEI name | `owner_coordinator` | ✓ | −5 d | — |
| 3 | Confirm furniture delivered & staged *(if furnished)* | `owner_coordinator` | — | −3 d | photo |
| 4 | Stock starter supplies | `site_manager_on_project` | — | −2 d | — |
| 5 | Prepare keys / access codes | `owner_coordinator` | ✓ | −2 d | — |
| 6 | Pre-move-in inspection + photos | `owner_coordinator` | ✓ | −1 d | photo |
| 7 | Send arrival instructions to occupant | `owner_coordinator` | ✓ | −1 d | — |
| 8 | Day-one check-in call | `owner_coordinator` | ✓ | +1 d | — |

### 4.3 Standard maintenance — `maintenance / *`

| Seq | Task | Assignee rule | Req | Due | Evidence |
|---|---|---|---|---|---|
| 1 | Contact occupant, confirm issue + access window | `owner_coordinator` | ✓ | per SLA first-response | — |
| 2 | Determine responsibility (PEI / landlord / occupant / warranty) | `owner_coordinator` | ✓ | +4 h | — |
| 3 | Arrange repair — notify landlord *or* schedule a contractor | `owner_coordinator` | ✓ | +8 h | — |
| 4 | Confirm scheduled date, inform occupant | `owner_coordinator` | ✓ | +1 d | — |
| 5 | Confirm work completed | `owner_coordinator` | ✓ | per SLA | photo_after |
| 6 | Verify with occupant that the issue is resolved | `owner_coordinator` | ✓ | +1 d after 5 | — |
| 7 | Record cost, set `chargeable_to` | `owner_coordinator` | ✓ | +5 d | document |

> **Step 1 auto-completes** for resident-submitted tickets that carry access permission,
> availability, and pets (rule B9). For a two-person team that is the single most valuable
> automation in this document — it removes one phone call from every self-served ticket.
>
> Steps 3 and 5 are where vendor automation used to live. Splitting "arrange" from "confirm
> completed" into two dated, owned tasks is what keeps outside work visible without making
> outsiders users of the system.

### 4.4 Housing request — `housing_request / new_housing_need`

| Seq | Task | Assignee rule | Req | Due |
|---|---|---|---|---|
| 1 | Confirm headcount, start date, duration, project code | `owner_coordinator` | ✓ | +1 d |
| 2 | Check existing inventory for availability | `owner_coordinator` | ✓ | +2 d |
| 3 | Source options if no inventory | `owner_coordinator` | ✓ | +5 d |
| 4 | Present options + cost to requesting manager | `owner_coordinator` | ✓ | +7 d |
| 5 | Approve spend | `housing_manager` | ✓ | +9 d |
| 6 | Execute lease | `owner_coordinator` | ✓ | +14 d |
| 7 | Spawn `move_in_prep` child ticket | automation | ✓ | on lease execution |

### 4.5 Lease renewal — `lease_billing / renewal`

Generated 60 days before lease end; offsets are from ticket creation.

| Seq | Task | Assignee rule | Req | Due |
|---|---|---|---|---|
| 1 | Confirm ongoing need with project/site manager | `site_manager_on_project` | ✓ | +5 d |
| 2 | Request renewal terms from landlord | `owner_coordinator` | ✓ | +10 d |
| 3 | Compare to market / current rate | `owner_coordinator` | ✓ | +15 d |
| 4 | Approve renewal or decide to terminate | `housing_manager` | ✓ | +25 d |
| 5a | Execute renewal | `owner_coordinator` | — | +35 d |
| 5b | Serve notice per `lease.notice_days`, spawn move-out ticket | `owner_coordinator` | — | end − notice_days − 5 d |

---

## 5. Assignment rules

Values the engine understands for `default_assignee_rule`:

| Rule | Resolves to |
|---|---|
| `owner_coordinator` | The ticket's owning coordinator |
| `coordinator_by_load` | The active coordinator with fewer open tasks; ties break to whoever least recently received one |
| `coordinator_on_duty` | The coordinator on the after-hours rotation. Emergency intake only |
| `housing_manager` | The housing manager |
| `site_manager_on_project` | Site manager for the occupancy's `project_code` |
| `requester` | Whoever submitted the ticket |
| `creator` | Whoever created the ticket (differs from requester on email intake) |

**Resolution order for `coordinator_by_load`:** active coordinator with the fewest open
tasks → if both are inactive (PTO, leave), the housing manager, flagged `assignment_failed`.
The system never leaves a task unowned.

**Why load, not market.** With two coordinators, splitting the queue by geography is
brittle: one person's vacation leaves a market uncovered, and volume rarely splits evenly
between two territories. A shared queue with load-based assignment keeps both coordinators
fungible and makes coverage a non-event.

If the two do specialize — by market, or by request family — add an optional `preference`
on Person and make `coordinator_by_load` prefer a match when one is available and not
overloaded. That is a configuration change, not a redesign; do not build it until the split
actually exists.

Manual reassignment is always allowed and always logged with a reason.

> With vendors gone and a two-person coordinator team, the entire assignment surface is a
> handful of rules over a roster you could list on one hand. Most tasks resolve to
> `owner_coordinator` — the person who triaged it keeps it. `coordinator_by_load` really only
> fires at intake. **This is the right amount of routing for this team size**; resist adding
> more until the team grows.

---

## 6. Notifications

| Audience | Gets | Channel |
|---|---|---|
| Coordinator | Task assigned, task due/overdue, new ticket in their market, SLA nudges, escalations, failed assignment | In-app + email digest; SMS for emergency |
| Site manager | Task assigned to them, status change on tickets they submitted, move-in/move-out milestones | Email |
| Housing manager | SLA breaches, cost approvals, emergency escalations, blocked tasks, weekly summary | In-app + email |
| Occupant / resident | Submission confirmation with ticket number, appointment scheduled, work completed | Automated email/SMS (rules A11–A12). **No account, no reply thread** — messages carry the coordinator's number |

Digest, not firehose: non-urgent coordinator notifications batch into a morning and an
afternoon digest. Emergency and escalation are always immediate.

---

## 7. Business hours & on-duty

- Business hours defined per market (default Mon–Fri 7:00–17:00 local).
- Non-emergency SLA clocks pause outside business hours.
- After-hours emergency rotation alternates between the two coordinators — realistically
  week-on / week-off. `coordinator_on_duty` resolves to whoever holds the current rotation.

> **Coverage risk, stated plainly.** A two-person rotation means each coordinator is on call
> every other week, and any absence collapses it to one person carrying 24×7. The housing
> manager must be a named fallback in the rotation, not an escalation afterthought — rule D3
> already routes unanswered emergencies there, and at this team size that path will be used,
> not just configured. (Open question #4.)
