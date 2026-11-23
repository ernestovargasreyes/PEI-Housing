# v1 Scope — What Tonya Actually Asked For

**Status:** v1 definition · **Date:** 2026-11-20
**Source:** Tonya Reaves (Housing Coordinator, Plateau Excavation), 2026-11-20

> **Read this document first.** Docs `00`–`05` describe a complete housing operations
> platform. That is a reasonable eventual target and a poor v1. This document is the
> subset Tonya asked for, in her words, and it is substantially smaller.

---

## 1. What she said

> "We were looking at either a QR code or a link so everyone can submit their maintenance
> requests to, so between the two of us (Jordan and I) we can get it submitted. We have
> soooooo many maintenance requests. We also thought of it for other things but for now,
> maintenance requests — so we can just go in daily and get submitted to the correct
> location vs them calling and texting us constantly."

Five facts in that paragraph:

| What she said | What it means for the build |
|---|---|
| "a QR code or a link" | **Intake is the product.** Not a tracker that happens to have a form |
| "maintenance requests… for now" | **One family, not four.** No leases, no turnovers, no housing requests in v1 |
| "between the two of us (Jordan and I)" | Coordinators are **Tonya Reaves and Jordan**. Two people, confirmed |
| "go in daily and get submitted to the correct location" | **The core loop is routing**, not task management. Request comes in → coordinator forwards it to the right hotel or apartment office |
| "vs them calling and texting us constantly" | **The problem is the interruption channel.** Success is fewer calls, not better dashboards |

## 2. What this changes from docs 00–05

| Previously specced | v1 reality |
|---|---|
| Resident form at **Phase 3.5**, after the automation engine | The form **is** Phase 1. It is the whole point |
| 4 request families, 5 task templates | **Maintenance only.** One simple flow |
| 11 ticket statuses, task engine, dependencies, evidence gates | **4 statuses.** No task entity in v1 |
| SLA ladder with 3-rung escalation | A daily review habit. Add SLA once there is data to set it from |
| Cost tracking, approvals, chargeable_to, finance export | Not in v1. Nobody asked |
| "Outside parties are not users" | Still true — but **forwarding to the property is the main job**, which docs 00–05 treated as a side note |

**What docs 00–05 are still good for:** the data model's shape, the category list, the
emergency-screen design, and the form fields in `05-resident-intake.md` §4 — those were
built around exactly this problem and survive unchanged. Treat the rest as a backlog, not
a plan.

## 3. The thing I under-specified: "the correct location"

This is the actual core loop and docs 00–05 barely cover it. Plateau does not fix anything.
A worker reports a problem; a coordinator forwards it to whoever maintains that building —
a hotel front desk, an apartment leasing office, a landlord, a property manager — and then
has to find out whether it ever got fixed.

**The live list now exists** as a Notion database on the project page:
<https://app.notion.com/p/41e5dc0bf9c380e08ef1ca9ac08f06a2> — "Properties & Maintenance Contacts".
Tonya and Jordan can start filling it today; it depends on no build decision and nothing from Matt.

So the system's real job is:

```
worker submits  →  lands in one queue  →  coordinator reviews daily
                                               │
                                               ▼
                               forwards to the correct property contact
                                               │
                                               ▼
                           tracks whether it actually got fixed
```

That makes **Property → maintenance contact** the most important reference data in v1, more
than units, more than people:

| Field | Type | Why |
|---|---|---|
| Property | title | The name a worker recognizes off the building or their reservation — not the legal entity on the invoice |
| Type | select | `Hotel` · `Extended Stay` · `Apartment` · `Other`. Hotels and apartments route completely differently |
| City / State | text / select | `GA` · `FL` · `AL` · `TN` |
| Contact Name | text | Who to address. "Front desk" is a valid answer; "the hotel" is not |
| How to Submit | select | `Email` · `Phone` · `Online Portal` · `Front Desk in Person` · `Text` — the method that *actually works*, often not the one on their website |
| Submit To | text | The real destination: email address, direct phone, or portal URL |
| Backup Phone | phone | When the primary method goes unanswered |
| After-Hours Contact | text | Who a worker reaches at 2am. Blank if it's just the front desk |
| Typical Response | select | `Same day` · `1-2 days` · `3+ days` · `Have to chase` · `Unknown` |
| Notes | text | The tribal knowledge — "Ask for Maria", "portal only takes one photo", "won't accept requests from anyone but the coordinator" |
| Active | checkbox | Uncheck instead of deleting, so old requests keep pointing at something real |

Two fields carry more weight than they look:

- **Typical Response** is the only column that cannot be gathered by calling around — it comes from
  experience. `Have to chase` is what tells you which properties need following up *before* they go
  quiet, and it is the seed of any future SLA logic.
- **Notes** is the reason this list cannot be outsourced or scraped. It is what currently lives only in
  Tonya's and Jordan's heads, and it is the difference between a request that lands and one that
  bounces.

**Seed this list before anything else gets built.** It is small, Tonya and Jordan already
know it, and nothing works without it.

## 4. QR code *or* link — the answer is both

They are not alternatives. A QR code is just a link in a form a camera can read. The real
question is **what the link already knows when it opens.**

| Option | Worker experience | Risk |
|---|---|---|
| **One generic link** | Opens form, picks their property from a dropdown, types room number | Picks the wrong property. Fixable at daily review |
| **QR per property** | Scans a code posted in the lobby or crew area; property is pre-filled, types room number | Stickers go missing; needs placement the hotel allows |
| **QR per room** | Scans in the room; property *and* room pre-filled | Hotels will not let you sticker rooms, and crews change rooms constantly. **Not viable** |

**The sign is drafted and print-ready:**
<https://claude.ai/code/artifact/281a39b1-0f6c-4013-9203-209fde3cb9be> — one sign per
property, bilingual, plus a sheet of wallet cards. Generated by `tools/make_signs.py`, which
stamps one sign per property with that property pre-filled:

```
python3 tools/make_signs.py --out signs.html \
    --base-url "https://<form url>" \
    --emergency "(555) 010-0100" \
    --property "Hampton Inn Valdosta=hamp-vald" \
    --property "Riverbend Apartments=river-pc"
```

Without `--base-url` it emits a sample QR encoding a self-describing placeholder, so a sheet
printed by mistake tells the reader it isn't live.

Practical notes on posting:

- **Ask the hotel first.** Posting without asking gets it removed and sours a relationship
  Tonya needs. GMs usually say yes to the breakfast or laundry room, almost never the lobby.
- **The wallet cards matter more than the poster.** A card in a truck works at 9pm from a job
  site; a wall sign only works while standing in front of it — and that is rarely the moment
  the problem is annoying someone.
- **Confirm the Spanish with a native speaker** before printing at scale.
- **Black-and-white safe.** The emergency block is framed in heavy black rule rather than
  relying on red, so a photocopy still reads correctly.

**Recommendation: build one form, reach it two ways.** A single link that Tonya and Jordan
can text or email to any crew, plus printed QR codes for the same link with the property
pre-filled, posted where the hotel permits. Same form, same queue, no second build.

Start with the plain link — it works for every worker on day one and needs no printing,
no placement permission, and no hotel's cooperation. Add property QR codes for the
highest-volume hotels once the form is proven.

## 5. v1 feature list

### The form (worker-facing)

**Full draft copy, question by question, is on the Notion page** —
<https://app.notion.com/p/41e5dc0bf9c380e08ef1ca9ac08f06a2> § "The form, question by question".
Six screens, target 90 seconds:

1. **Emergency gate.** No heat/AC, no water, flooding, gas smell, smoke, no power, lockout →
   *stop, tap to call.* Refuses to continue rather than submitting and warning.
2. **Where are you?** Property picker (pre-filled by QR) + room/unit number.
3. **Who are you?** Name + cell. Job site optional — free to collect now, it's the hook for
   cost-by-job later.
4. **What's wrong?** Plain-language picker, location in the unit, description, how long,
   getting worse, photos.
5. **Getting in.** Entry permission, availability windows, pets, anything else to know.
6. **Confirmation** with a request number.

**Design rule applied throughout:** every question has to be defensible as preventing a
specific phone call. If it can't be, it's cut. Screen 5 is the one that actually saves the
coordinators time — entry permission, availability, and pets each independently force a
callback when missing.

> **Open: does the form need to be bilingual?** Plateau runs excavation crews across four
> southeastern states, and a good share of that workforce likely speaks Spanish first. A form
> only works if its users can read it fast. Cheap to decide now, expensive to retrofit — the
> Spanish copy needs writing alongside the English, not translating after. Ask Tonya and Matt.

### The queue (Tonya and Jordan)

**A working queue is live on the Notion page** —
<https://app.notion.com/p/41e5dc0bf9c380e08ef1ca9ac08f06a2> § "The queue". Requests relate to
rows in the property list, which is the routing mechanism: a request finds its destination
through its property, and the one-click forward reads the submit-to address from there.

| Status | Meaning | Waiting on |
|---|---|---|
| `New` | Submitted, not yet reviewed | Tonya or Jordan |
| `Needs Info` | Unroutable — missing room, no entry permission, unclear problem | The worker |
| `Sent to Property` | Forwarded, with date and method recorded | The hotel or apartment office |
| `Fixed` | Property or worker confirmed it's done | Coordinator, to verify and close |
| `Closed` | Done and verified. Terminal | Nobody |
| `Duplicate` | Merged into the original | Nobody |

**Six states, four of which are the real path. No task engine, no dependencies, no evidence
gates, no SLA clock.** Those were designed for a problem Plateau does not have yet.

### The daily pass — three views, worked in order

1. **Triage today** — everything `New`, oldest first. Confirm property and room, check entry
   permission is present, forward, stamp `Sent to Property` with the date and method.
   Missing something → `Needs Info` and text the worker.
2. **Waiting on property** — everything sent, sorted by **Days Since Sent**, highest first.
3. **Whole queue** — board by status with an owner filter, for a glance at everything.

> **`Days Since Sent` is the most important column in v1.** A forwarded request *feels*
> handled, but it is only somewhere else. The failure that actually happens is a property
> going quiet and nobody noticing until the worker calls again, angrier. That one number is
> the entire early-warning system — and the reason no SLA engine is needed yet.

> **The Notion queue is also a viable pilot.** Not the recommended end state — that is still
> M365, where both coordinators already have accounts — but if the goal is to test the
> *workflow* on one hotel and one crew before committing to a build, Notion plus a Notion
> form gets there in days rather than weeks. Given §9's two-week pilot, worth considering.

### The one piece of automation worth building in v1

**One-click forward.** From a request, generate a pre-written message to that property's
maintenance contact — room, problem, description, photos, access block, worker name and
callback number — and stamp the request `Sent to Property` when it goes. It reads the
destination from the linked property row, so nothing is typed twice.

**Full templates are on the Notion page** —
<https://app.notion.com/p/41e5dc0bf9c380e08ef1ca9ac08f06a2> § "The templates". Five of them,
because the property list has five submission methods:

| Template | For |
|---|---|
| Email — new request | The primary path. Room and problem in the first four lines; access block so nobody has to ask; closes by asking for one thing — a date |
| Email — follow-up | Replies in the original thread. Ends with "if someone already looked at it, just say so" — properties often *have* fixed it and never replied |
| Phone script | For phone-only properties. Ends by asking who to follow up with and for a work order number |
| Portal paste | One paragraph for character-limited portals |
| Texts to the worker | Sent / scheduled / is-it-fixed. The other half of why the calls stop |

**Three design points worth keeping:**

1. **Send from a shared `housing@` mailbox, not a personal address.** If Tonya emails a hotel
   from her own account, Jordan cannot see the reply, and when she is out the request is
   invisible. This is what makes "between the two of us" actually work.
2. **Request ID in every subject line.** It is what lets a reply be matched back to a row
   without anyone remembering which room it was.
3. **Write down who you spoke to on phone submissions.** A phone request with no name
   attached is the easiest thing in the system to lose — no thread, no record, nobody at the
   property who remembers. Name and work-order number into `Notes` before hanging up.

**Deliberately left out of the forward:** cost or who pays (invites a conversation nobody
wants), other open requests at the same property (bundling means one gets fixed and the rest
forgotten), the worker on CC (they would reply into the thread instead of using the form),
and urgency language (everything cannot be urgent — the emergency path is a phone call).

Everything else in `02-workflows.md` §3 can wait.

### Duplicate collapse

"Soooooo many requests" plus multiple workers in one hotel means four guys report the same
broken ice machine. Flag same property + same room (or same property + same category) within
7 days and let the coordinator merge in one click.

## 6. Explicitly not in v1

Leases · turnovers · move-in/move-out · housing requests · cost tracking and approvals ·
chargeable-to · finance export · task templates and dependencies · SLA clocks and escalation
ladders · preventive maintenance · inspections · vendor management · dashboards beyond a
simple queue count.

Each is specced in `00`–`05` and can be pulled forward when someone asks for it. **Nobody
has asked for any of them.**

## 7. Does this actually stop the calls and texts?

That is the stated goal, and the honest answer is: only if workers use the link instead of
texting. The form does not accomplish this on its own.

What makes it work:

- **The form must be faster than sending a text.** Under 90 seconds, no login, no app.
- **Tonya and Jordan have to redirect.** When a worker texts, reply with the link rather
  than taking the details. Painful for about two weeks.
- **Foremen and superintendents carry it.** A worker uses a link because their foreman told
  them to, not because it exists. Getting the link into toolbox talks and crew texts matters
  more than any feature.
- **Emergencies still phone in**, by design. That channel should never close.

**The honest risk:** a submission form lowers the barrier to reporting, so total reported
requests will likely *rise*. That is not failure — it is previously-unreported problems
becoming visible. But the volume relief Tonya is hoping for comes from each request arriving
complete and routable, not from fewer requests. Set that expectation before launch.

## 8. Open — needs Matt

Tonya said **Matt has the detail you discussed.** That conversation is the next input, and
these are the questions it should answer:

1. **How many properties, and where?** The property + contact list is the critical path.
2. **Hotels vs apartments — what's the split?** They route completely differently.
3. **Roughly how many maintenance requests a week?** Sizes everything.
4. **Who is Jordan**, and do Tonya and Jordan split by geography, property, or just
   whoever's free?
5. **Is there anything today** — a spreadsheet, a shared inbox, a group text?
6. **Do any properties have their own portals** the request has to be typed into, or is it
   email and phone?
7. **What happens today when a request is ignored** by a hotel? Who escalates, and to whom?
8. **Does anyone need to see cost**, or is that purely AP's problem right now?
9. **Which states are live** — GA, FL, AL, TN all at once, or pilot one?
10. **Who owns this after launch** if Tonya is at capacity?

## 9. The two-week pilot

One hotel, one crew, two weeks. The point is not to prove the form works — it is to find out
**whether workers use it** and **which questions are missing**, while changing it is cheap.

**Tracking is live on the Notion page** —
<https://app.notion.com/p/41e5dc0bf9c380e08ef1ca9ac08f06a2> § "The two-week pilot".

### Run a baseline week first

Tonya's goal is fewer calls and texts. You cannot measure "fewer" without knowing the
current number, and after launch nobody will remember it. Five days of counting before
go-live is what turns the result into an argument instead of an impression. One number a
day: how many requests came in by text or call. Count the ten-second ones.

### What's measured

Most of it falls out of working the queue normally — `Arrived By` on every request
(including texted ones, or the comparison is meaningless), plus `Needed Callback` and
`Callback Reason`. Two views do the analysis: **how it arrived** and **why we called back**,
the latter grouped by reason so each column names a field the form is missing.

The **Pilot Log** database holds only what the queue cannot capture: texts and calls per day
(a text you never logged leaves no trace), rough minutes, and what got in the way. One row a
day, under a minute. *If filling it in ever feels like work, cut a column rather than skip a
day* — a partial record kept daily beats a complete one kept for three days.

### Decision rules, agreed before the data arrives

**Did workers use it?** — share of requests arriving by form

| Result | Read | Do |
|---|---|---|
| 60%+ | Adoption works | Roll out to the next properties |
| 30–59% | A push problem, not a product problem | Don't touch the form — work the foremen, the redirect, the cards |
| Under 30% | Workers won't use it as built | Redesign how they reach it, or stop |

**Were the questions right?** — share of form requests needing a callback

| Result | Do |
|---|---|
| Under 25% | Ship as is |
| 25%+ | Add the field the biggest callback-reason column names, re-run a week |

**Did the calls drop?** — texts and calls per day vs. baseline

| Result | Read |
|---|---|
| Down | The thing Tonya asked for is happening |
| Flat, more total requests | Form is additive, not substitutive — expected early; the redirect habit fixes it |
| Flat, same total requests | Workers aren't switching — treat as adoption |

> **What would make this not worth continuing.** If after two weeks form share is under 30%
> *and* the coordinators are spending more total time than in the baseline week, the honest
> call is to stop and rethink — not to add features. A tool two busy people have to be nagged
> into using will not survive a rollout across four states.

### The readout

Three numbers against their rules, the top two callback reasons, and the three most common
entries in "what got in the way." Enough to decide: roll out, fix and re-run, or stop.

## 10. Actual next step

Get the property and contact list from Matt, fill it in, and run the baseline week. **The
form is a week of work — it is not the thing standing in the way.**
