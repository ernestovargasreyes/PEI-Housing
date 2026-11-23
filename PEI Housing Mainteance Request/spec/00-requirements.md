# PEI Corporate Housing Ticket System — Requirements

**Status:** Draft v0.3 · **Date:** 2026-11-20 · **Owner:** Ernest Vargas Reyes

> **v0.2:** vendors removed as system users. See §3.
> **v0.3:** coordinator team sized at 2 (§4). Resident intake form moved **into** scope —
> see §5.5 and `05-resident-intake.md`.

---

## 1. Purpose

A system to **control housing workflows through automation, and track and assign the key
tasks** inside each one. Every housing-related request — maintenance, unit turnover,
lease/billing, new housing need — becomes a ticket that the system drives forward: it
generates the required tasks, assigns each to an owner, sets due dates, enforces
dependencies, and escalates when something stalls.

Today this work is assumed to live in email, phone calls, and spreadsheets, where nothing
has an owner or a deadline that anything checks.

## 2. In scope

Four request families, one queue, different task templates per family:

| Family | Examples |
|---|---|
| **Maintenance & repairs** | Plumbing, HVAC, electrical, appliance failure, pest, locks, damage |
| **Move-in / move-out** | Unit turnover, inspection, keys/access, furniture, cleaning, utilities transfer |
| **Lease & billing** | Lease start/extend/terminate, rent discrepancy, utility bill, invoice dispute |
| **Housing request** | New housing needed for a crew/employee, room assignment, transfer between units |

## 3. Out of scope (v1)

- **Vendor / contractor access.** Outside parties are not users of this system. Coordinators
  arrange and chase outside work by phone and email as they do today, and record the
  outcome on the ticket. No vendor portal, no vendor logins, no vendor-facing notifications.
- **Resident *portal*.** There is a resident intake *form* (§5.5), but no resident
  dashboard, ticket history, or login-to-check-status. Residents submit and receive
  notifications; they do not browse. See `05-resident-intake.md` §1.
- Payment processing. The system records billing *issues* and invoice references; it does
  not move money.
- Lease document authoring or e-signature.
- Full property-accounting / GL integration. (Export only — see §7.)

> **Consequence of removing vendors:** every task in the system is owned by a PEI person.
> That makes the design markedly simpler — no external identity, no row-level security
> against outsiders, no insurance tracking, no accept/decline loop. The trade-off is that
> work happening *outside* PEI is only as visible as the coordinator's last update. The
> templates in `02-workflows.md` compensate by making "confirm work completed" an explicit,
> dated, assigned task rather than something that depends on a vendor reporting in.
>
> **Capacity, stated plainly.** With no resident portal and no vendor portal, every piece of
> data in this system is typed by one of **two** coordinators. They are the intake channel,
> the dispatcher, and the status reporter for the entire housing operation. That is workable,
> and it is also the binding constraint on everything here:
>
> - Automation is not a nice-to-have. Two people cannot manually chase deadlines across a
>   growing unit count; the rules in `02-workflows.md` §3 are what make this headcount viable.
> - Template steps have a real cost. Every required task is a thing one of two people must do
>   and mark done. Keep templates short and make `required` earn its place — a checklist
>   nobody can finish gets ignored, and an ignored checklist is worse than none.
> - Task completion is the metric to watch after launch. If on-time task completion drops as
>   volume grows, the first lever is the resident intake form (§5.5), which moves typing off
>   the coordinators — not more coordinators, and not more automation.
>
> The resident form is the planned release valve for this constraint. It is scoped in, but
> deliberately sequenced *after* the automation engine: a form that invites residents into a
> queue with no working alerting is worse than no form at all.

## 4. Actors

| Actor | Count (est.) | What they do | Access |
|---|---|---|---|
| **Housing Coordinator** | **2** | Create, triage, prioritize, assign, work, and close tickets and tasks. Primary users. | Full read/write on all tickets |
| **Project / Site Manager** | many | Submit requests on behalf of crews; complete tasks assigned to them (keys, site access, confirmations); see status of their site's tickets | Submit + read own site + act on own tasks |
| **Housing Manager** | 1–3 | Everything a coordinator can do, plus reassignment, SLA override, cost approval, template editing | Full + admin |
| **Executive / Finance** | few | Read dashboards and cost reports | Read-only reporting |
| **Occupant / Resident** | many | Submit an issue via the intake form; receive status notifications. **Submit-only — no account, no queue access** | Form submission only |
| **System** | — | Generates tickets on schedule, generates tasks from templates, assigns, escalates, alerts | — |

## 5. Intake channels

1. **Coordinator manual entry** — the default path. Must be fast: under 60 seconds for a
   routine ticket. Unit lookup autofills property, market, landlord, and current occupant.
2. **Shared email inbox** — `housing@…`. Mail lands in the queue as an *unprocessed* ticket
   with sender, subject, body, and attachments captured. A coordinator attaches it to a unit
   and categorizes it. Replies to a ticket thread append to that ticket rather than creating
   duplicates.
3. **Project / site manager submission** — a short structured form. Required: site/unit,
   category, description, urgency, contact.
4. **Recurring / scheduled generation** — system-created on a schedule. See §6.
5. **Resident intake form** — a short mobile form the occupant fills in directly, landing in
   the queue with enough detail to triage without a callback. Full design in
   `05-resident-intake.md`. Ships at Phase 3.5, after the alerting engine is real.

## 6. Recurring ticket rules

| Trigger | Generates | Lead time |
|---|---|---|
| Lease end date approaching | Lease renewal decision ticket | 60 days before |
| Scheduled move-out date | Move-out turnover ticket | 14 days before |
| Scheduled move-in date | Move-in readiness ticket | 7 days before |
| Quarterly unit inspection | Inspection ticket | On schedule |
| Preventive maintenance (HVAC filter, smoke detector, etc.) | PM ticket | Per asset interval |

## 7. Integration points (v1 = export, not live sync)

- **Export:** ticket + cost data to CSV/Excel for finance. Monthly cost-per-unit and
  cost-per-property rollups.
- **Email:** outbound notifications and inbound intake (§5.2).
- **Later candidates:** HR/employee roster, AP system, accounting GL. Explicitly deferred.

## 8. Non-functional requirements

- **Automation first.** The rule set in `02-workflows.md` §3 is the product, not a feature.
  A platform where automation is bolted on afterward is the wrong platform.
- **Templates as data.** A housing manager must be able to change a turnover checklist
  without a developer. Template versions are recorded on tickets so history stays auditable.
- **Scale:** design for growth without rewrite. Unit count may go from tens to high hundreds
  across multiple markets. No decision may assume one market or one coordinator.
- **Audit:** every status change, assignment, task completion, and cost entry is recorded
  with actor and timestamp, and is not editable afterward.
- **Mobile:** coordinators and site managers work from phones for two screens — "my tasks"
  and "update a ticket" — including photo upload.
- **Attachments:** photos before/after, invoices, inspection sheets. Up to ~20 files per ticket.
- **Retention:** tickets and audit trail retained 7 years (lease/billing records).
- **Access control:** all users are internal. Both coordinators see the full queue — at two
  people there is nothing to partition and shared visibility is the point. Site managers see
  their own site's tickets and their own tasks only. Occupant name and contact are PII,
  restricted to coordinators and managers.

## 9. Success criteria

| Measure | Target |
|---|---|
| Requests that exist as tickets rather than only in email | ~100% |
| Resident-submitted tickets needing a coordinator callback for missing info | < 25% |
| Open tickets with no owner | 0 |
| Open **tasks** with no owner or no due date | 0 |
| Time to first coordinator response (business hours) | < 4 hours |
| Emergency tickets acknowledged | < 1 hour |
| Tickets past SLA without escalation | 0 |
| Move-ins reached with required prep tasks incomplete | 0 |
| Monthly cost-per-unit report | Produced without manual spreadsheet work |

## 10. Open questions

1. Who owns the system after launch — housing team or IT?
2. Is there an existing unit/property list to seed from, and where does it live?
3. Does finance already have a cost-per-unit report this must match?
4. What is the after-hours emergency path, and does it stay phone-based?
5. ~~How many coordinators, and how are they split?~~ **Answered: 2.** Routing is now a
   shared queue with load-based assignment (`02-workflows.md` §5), not a market split.
   Follow-on: do the two specialize informally today — by market, or by request type?
   If so it becomes a preference hint, not a partition.
