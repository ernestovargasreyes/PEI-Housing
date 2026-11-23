# Platform Options

**Status:** Draft v0.3 — **recommendation firm**

> **v0.2 change:** external vendor access was the hardest requirement and the one that made
> this a genuine three-way decision. With vendors out of scope, **every user is an internal
> Sterling identity**, and the choice resolves.

Requirements that constrain the choice:

1. **Automation is the product** — rule engine, scheduled generation, task templates,
   assignment, escalation (`02-workflows.md` §3).
2. **Templates editable as data** by a housing manager, with versioning.
3. **Email intake** into the queue, with threaded replies.
4. **Mostly internal users**; site managers see only their site and their own tasks. The
   resident intake form (`05-resident-intake.md`) is submit-only and may or may not need an
   anonymous surface — see the tier decision below.
5. **Mobile** for "my tasks" and "update a ticket", with photo upload.
6. **Grow without rewrite.**

---

## Option A — Microsoft 365 (SharePoint / Dataverse + Power Automate + Power Apps) ← **recommended**

Lists or Dataverse for data, Power Automate for the §3 rule engine, Power Apps for the
coordinator and site-manager screens, Power BI for §3 reporting.

| Pros | Cons |
|---|---|
| **Every user already has an identity and a license** — requirement #4 costs nothing | SharePoint list view threshold (5,000 items) needs indexing discipline; Dataverse avoids it at licensing cost |
| Power Automate maps directly onto the §3 rules, including the daily scheduled generators | Complex flows get hard to debug and version — keep rules small and named after the table in §3 |
| Email intake is native | Power Apps mobile is adequate, not delightful |
| Power BI already licensed for §3 reporting | Premium connectors / Dataverse may add per-user cost |
| Templates as list rows is straightforward | |
| IT can support it; no new security review, no new vendor | |

**Verdict: this is the answer.** The thing that would have made M365 painful — external
users — is gone. What remains is an internal ops tool over internal identities, which is
exactly the Power Platform's strongest case.

## Option B — Purpose-built property/facility management SaaS

| Pros | Cons |
|---|---|
| Work-order, inspection, and PM modules already solved | Corporate housing ≠ standard property mgmt; `housing_request` typically doesn't exist |
| Vendor was the module worth buying — **and it's now out of scope** | Per-unit or per-user pricing grows with you |
| | Custom task templates limited to what the product allows |
| | Data outside Sterling; export dependency |

**Verdict:** weakened considerably by the vendor decision. The strongest reason to buy was
a working vendor portal. Worth a brief look, no longer worth a procurement cycle.

## Option C — Custom web application

| Pros | Cons |
|---|---|
| Exact fit to every rule and template | Months of build, then permanent ownership |
| No per-seat cost | Hosting, auth, backups, on-call |
| | Bus factor — who maintains it in two years? |

**Verdict:** no. Nothing in the requirements now justifies it.

## Option D — Generic work-management SaaS (Jira / ServiceNow / Monday / Asana class)

| Pros | Cons |
|---|---|
| Strong automation, SLA, queue, reporting out of the box | Housing entities (Unit, Lease, Occupancy) must be faked in custom fields |
| Task templates and dependencies are native | Cost-per-unit reporting needs data the tool doesn't hold |
| Fast to stand up | Scheduled generation from lease/occupancy dates needs an external trigger |

**Verdict:** viable fallback if Power Platform licensing becomes an obstacle, and genuinely
good at the task/template/SLA half. It is weak at exactly the half that makes this a
*housing* system rather than a generic tracker: §3's cost-per-unit and lease-exposure
reports need Unit and Lease to be real objects.

---

## Recommendation

**Build on Option A (Microsoft 365 / Power Platform).**

Two decisions to make inside that:

1. **SharePoint Lists vs. Dataverse. → Dataverse.** The usual objection to Dataverse is
   per-user licensing, and at this team size that objection evaporates: **2 coordinators +
   a housing manager + a handful of site managers**. A per-user license for under ten named
   people is a rounding error against the cost of migrating off Lists later. Lists would
   strain past ~5,000 items — a threshold a growing ticket table crosses on *tickets*, not
   on users, so a small team does not protect you from it. Take the relational model and
   the referential integrity.
2. **Resident form tier — test before choosing.** If occupants can sign in with a Sterling
   account on a phone, build the authenticated form only: it is internal, needs no security
   review, and Microsoft Forms gives photo upload for free. If they cannot, the QR-token
   anonymous path needs Power Pages and an external surface. **Microsoft Forms supports file
   upload only for signed-in organizational responders** — and photos are the biggest triage
   saver — so this one constraint decides the build. Details in `05-resident-intake.md` §6, §8.
3. **Rule engine hygiene.** Build one Power Automate flow per rule *group* in §3 (intake,
   task generation, chase, SLA, cost, scheduled), named to match. Resist one giant flow —
   that is how Power Automate projects become unmaintainable.

## Phasing (platform-independent)

| Phase | Scope | Proves |
|---|---|---|
| **0 — Data** | Seed Market, Property, Unit, Landlord, Person, Lease, Occupancy | Nothing works without a clean unit list |
| **1 — Queue** | Ticket CRUD, manual + email intake, states, ownership, comments, attachments | Everything in one place |
| **2 — Tasks** | Task entity, templates for maintenance + move-out, auto-generation and auto-assignment on triage | **The core automation loop** |
| **3 — Automation** | SLA clocks, chase, escalation, dependency unblocking, scheduled generation | The system drives work, not people |
| **4 — Money** | CostEntry, approval thresholds, `chargeable_to`, finance export | Cost reporting |
| **3.5 — Resident intake** | Resident form, emergency screen, B9 step-1 auto-completion, resident notifications | Moves typing off two coordinators |
| **5 — Reporting** | Coordinator task queue, manager dashboard, exec cost views | Decisions from data |

Ship Phase 1–2 before building any of Phase 5. A dashboard over incomplete data teaches
people to distrust the system.

**Phase 2 is the one that matters.** Phase 1 alone is a shared spreadsheet with better
manners. Phase 2 is where the system starts controlling the workflow — which is the thing
that was actually asked for.
