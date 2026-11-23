# Reporting & Dashboards

**Status:** Draft v0.3

> **v0.2 change:** vendor performance reporting removed. Spend is reported by free-text
> payee and by category instead.

Three audiences, three views. Every metric is computable from the model in
`01-data-model.md` with no extra data capture.

---

## 1. Coordinator view — "what do I do next"

Not a dashboard; a work queue, and the screen coordinators live in. Default sort: breach
risk descending. **Tasks, not tickets, are the unit here.**

| Panel | Contents |
|---|---|
| **My tasks due today** | Assigned to me, `not_started`/`in_progress`, due ≤ today |
| **My overdue tasks** | Past `due_at` |
| **Needs triage** | Tickets `status=new`, oldest first. Target: empty by end of day |
| **At risk** | Tickets > 50% of SLA elapsed with no status change |
| **Stalled** | Any `pending_*` > 5 business days, or tasks `blocked` > 5 business days |
| **Assignment failed** | Auto-assignment found nobody — needs a human |
| **Upcoming moves** | Move-in/move-out in next 14 days with incomplete required tasks |

## 2. Housing manager view — "is the operation healthy"

| Metric | Definition | Watch for |
|---|---|---|
| Open tickets by status | Count | Pile-up in `new` or `pending_external` |
| SLA attainment | % resolved within `due_at`, by priority | Below 90% on emergency = staffing problem |
| First-response time | `triaged_at − created_at`, median and p90 | p90 is the honest number |
| Aging buckets | Open by 0–3, 4–7, 8–14, 15–30, 30+ days | Anything in 30+ |
| **Task completion on time** | % tasks completed by `due_at` | The automation's own scorecard |
| **Overdue tasks by assignee** | Count + oldest | With two coordinators, a lopsided split means `coordinator_by_load` is not working, or one is absent |
| **Task cycle time by template step** | Median hours per `template_task_key` | Finds the one slow step in a turnover |
| **Skipped-task rate by step** | % `skipped` per `template_task_key` | A step skipped 80% of the time is a bad template, not bad behavior |
| Reopen rate | Reopened within 30 days ÷ resolved | > 5% = quality problem, not a volume problem |
| Tickets per coordinator | Open + closed-this-month by owner | Should run near 50/50. Sustained drift is the earliest signal that the team has outgrown two people |
| Breach causes | Breached tickets grouped by last status before breach | Tells you *where* time is lost |

### Resident intake form — is it paying off

Live once the form ships (Phase 3.5). Full definitions in `05-resident-intake.md` §10.

| Metric | Watch for |
|---|---|
| **Callback rate** — % of resident tickets with `required_callback` | **The headline.** Above ~25% the form is missing a field |
| Callback reasons | Tells you precisely which field to add |
| Step-1 auto-completion (B9 fire rate) | Direct measure of coordinator time saved |
| Self-service rate | Adoption; low means residents don't know it exists |
| Volume change, before vs. after launch | The cost side — self-service raises reported volume |
| Triage time, form vs. coordinator-entered | Form tickets should triage *faster*. Slower means low-quality submissions |
| Emergency misroutes (`possible_emergency` set) | Every one is a resident who should have called |

> The template-step metrics are the payoff from storing `template_task_key`. They turn
> "turnovers feel slow" into "step 6, arrange deep clean, averages 4.2 days."

## 3. Executive / finance view — "what does it cost"

| Report | Cut by | Notes |
|---|---|---|
| Total maintenance spend | Month, market, property, category | |
| Cost per unit per month | Unit, property, market | The headline operating number |
| Cost per occupied night | Market | Normalizes for vacancy |
| Spend by `chargeable_to` | `pei` / `landlord` / `occupant` / `project` / `warranty` | Recovery leakage shows up here |
| Landlord recovery | Billed vs. collected on `chargeable_to=landlord` | Money PEI is owed |
| Spend by payee | `payee_name` | Free text, so expect spelling variance — directional only |
| Turnover cost & days | Property | Days from move-out to `available`, and cost to get there |
| Top cost drivers | Category, asset type | Repeat failures justify replacement |
| Repeat-offender units | Unit | > 3 maintenance tickets in 90 days — a unit problem or a lease to exit |
| Lease exposure | Market | Active leases, monthly commitment, expirations in next 90 days |

## 4. Operational alerts (pushed, not pulled)

- Any emergency ticket open > 12 hours
- Any ticket in `new` > 4 business hours
- Any task overdue > 48 hours
- Any task `blocked` > 5 business days
- Any cost approval pending > 48 hours
- Any move-in within 72 hours with incomplete required tasks ← the one that prevents a crew
  arriving at an unready unit
- Any lease expiring in 90 days with no renewal ticket
- Any resident submission flagged `possible_emergency` — immediate, never batched

## 5. Export

Monthly CSV/Excel to finance: one row per CostEntry with ticket, unit, property, market,
category, payee, amount, `chargeable_to`, `project_code`, approval status, and dates. That
single flat export supports every cost report above without finance needing system access.
