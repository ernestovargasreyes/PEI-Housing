# Plateau Excavation — Housing Maintenance Request System

**PEI = Plateau Excavation, Inc.** (Sterling Infrastructure). Plateau pays for and manages
hotels and apartments for its crews working job sites across **Georgia, Florida, Alabama,
and Tennessee**. Plateau does not perform maintenance — the hotel or apartment office does.
The housing coordinators are a **routing desk**.

**Status:** The Plateau form is built and tested locally; not yet deployed. Code and deploy steps: [`app/README.md`](app/README.md). The emergency and housing numbers are still placeholders.

---

## Start here

| Doc | Read it for |
|---|---|
| **[`spec/v1-scope.md`](spec/v1-scope.md)** | **What Tonya actually asked for.** Read this first — it's much smaller than the rest |
| **[`spec/risks-and-blockers.md`](spec/risks-and-blockers.md)** | **Read this second.** Six launch blockers, six untested assumptions, and the holiday-timing problem |
| [Visual: the v1 flow](https://claude.ai/code/artifact/10a7daf6-6dc8-4381-91d3-f6ecfd6bb99a) | Before/after, the QR-vs-link answer, the four statuses |
| [Notion page](https://app.notion.com/p/41e5dc0bf9c380e08ef1ca9ac08f06a2) | Shareable summary, live property list + request queue — Sterling's Notebook / Projects |
| [QR sign + wallet cards](https://claude.ai/code/artifact/281a39b1-0f6c-4013-9203-209fde3cb9be) | Print-ready, bilingual. Regenerate with `tools/make_signs.py` |
| [`kickoff-message.md`](kickoff-message.md) | Ready-to-send message to Tonya — chat, text, and email versions |
| [`matt-message.md`](matt-message.md) | Message to Matt — call request with pre-read |
| [Matt — Requirements Call](https://app.notion.com/p/41e5dc0bf9c381b0b2b2e7f33a5735f4) | Live Notion agenda to open during the call |

### Background design (bigger than v1 — treat as backlog)

| Doc | Covers |
|---|---|
| [`spec/00-requirements.md`](spec/00-requirements.md) | Scope, actors, intake channels, non-functional requirements |
| [`spec/01-data-model.md`](spec/01-data-model.md) | Property, Unit, Lease, Occupancy, Ticket, Task, CostEntry, audit |
| [`spec/02-workflows.md`](spec/02-workflows.md) | State machine, SLA, automation rules, task templates, assignment |
| [`spec/03-reporting.md`](spec/03-reporting.md) | Coordinator queue, manager dashboard, cost views, alerts |
| [`spec/04-platform-options.md`](spec/04-platform-options.md) | Build vs. buy vs. M365, recommendation, phasing |
| [`spec/05-resident-intake.md`](spec/05-resident-intake.md) | Form fields, emergency screen, auth tiers, success metrics |

> **Honest note on docs 00–05.** They were written before Tonya's requirements landed and
> describe a full housing operations platform — leases, turnovers, task engines, SLA
> ladders, cost allocation. That is a reasonable eventual target and a poor v1. The parts
> that survive unchanged are the form design in `05` §3–§5 and the shape of the data model.
> Everything else is a backlog to pull from, not a plan to execute.

---

## The ask, in Tonya's words

> "We were looking at either a QR code or a link so everyone can submit their maintenance
> requests to, so between the two of us (Jordan and I) we can get it submitted. We have
> soooooo many maintenance requests… so we can just go in daily and get submitted to the
> correct location vs them calling and texting us constantly."
>
> — Tonya Reaves, Housing Coordinator, 2026-11-20

**v1 is one thing:** a link (also printable as a QR code) where a worker submits a
maintenance request, landing in one queue that Tonya and Jordan review daily and forward to
the correct hotel or apartment contact.

## The three decisions that follow from it

1. **QR code *or* link is a false choice.** A QR code is a link a camera reads. Build one
   form, reach it two ways — a plain link that works for every worker on day one, plus
   printed QR codes with the property pre-filled for high-volume hotels later. QR *per room*
   is not viable: hotels won't allow stickers and crews change rooms constantly.
2. **The property + maintenance-contact list is the critical path.** Routing to "the correct
   location" is the whole job, and it needs, per property: who to contact, and whether they
   take requests by email, phone, or their own portal. Nobody but Plateau can supply this.
3. **Volume will go up, not down.** Lowering the barrier means problems that went unreported
   now get reported. The relief Tonya is after comes from each request arriving complete and
   routable — not from fewer requests. Worth setting that expectation before launch.

## People

| Name | Role |
|---|---|
| Tonya Reaves | Housing Coordinator, Plateau Excavation |
| Jordan | Housing Coordinator (second of two) |
| Matt | Holds the detailed requirements — next conversation |
| Ernest Vargas Reyes | Building this |

## Next step

Get the property and contact list from Matt, build the form and the queue, and pilot on
**one hotel with one crew for two weeks**. Measure only two things: how many requests came
in by form vs. by text, and how many needed a follow-up call.

That's a week of work, not a quarter — and it tells you whether to roll out or redesign.
Open questions for Matt are listed in [`spec/v1-scope.md`](spec/v1-scope.md) §8.
