# Resident Intake Form

**Status:** Draft v0.3 · Companion to `00-requirements.md`, `02-workflows.md`

> **Added in v0.3.** Previously out of scope. Added because two coordinators type every
> piece of data in the system, and that is the binding constraint on the whole design.

---

## 1. What this is, and what it is deliberately not

**It is:** a short, mobile-first form an occupant fills in to report a housing issue, which
lands in the queue as a ticket with enough information to triage **without a phone call back**.

**It is not:**

- A portal. There is no dashboard, no ticket history list, no login-to-check-status.
- A messaging channel. Residents do not reply inside the system; follow-up is the
  coordinator's phone or email, as today.
- An emergency path. See §3 — this is the most important rule on the page.

> The distinction matters because a portal is roughly ten times the work of a form and
> solves a problem nobody has. Residents do not want to track tickets; they want to report
> a problem once and be told when someone is coming.

## 2. Why it earns its place

The form only pays off if it removes coordinator work. It does that in exactly one way:
**by capturing on the first pass the information a coordinator currently obtains by calling
the resident back.** That is access permission, availability, pets, entry codes, and a photo.

A form that collects "name / unit / describe your problem" and nothing else makes things
*worse* — it adds a triage step without removing the callback. Every field in §4 exists
because its absence causes a phone call.

**The honest caveat.** Lowering the barrier to reporting raises reported volume. Issues a
resident previously tolerated — a slow drain, a loose handle — now get submitted. Expect
ticket count to rise. The net effect on coordinator time is positive only if the form
genuinely eliminates the back-and-forth; if it is implemented as a thin "describe your
problem" box, the volume increase arrives without the time saving. Measure both (§9).

---

## 3. Emergency handling — non-negotiable

The first screen is an emergency screen, before any other field:

> **Is this an emergency?**
> No heat or A/C in extreme weather · No water · Flooding or active leak · Gas smell ·
> Smoke or fire · No electricity · Locked out · Break-in or security issue
>
> **→ If yes: STOP. Call [number] now. Do not submit this form.**
> Someone answers 24 hours a day. A form is not monitored overnight.

Rules:

- Selecting any emergency condition replaces the form with the call-now screen. It does not
  submit a ticket and then warn; it refuses to continue.
- The call-now screen shows the number as a tap-to-dial link, and the after-hours number if
  outside business hours for that market.
- If a resident submits a non-emergency form whose text trips the emergency keyword list
  (`02-workflows.md` §2), the ticket is created, flagged `possible_emergency`, and **both
  coordinators are alerted immediately** rather than batched into a digest. The resident is
  also shown the call-now number on the confirmation screen.

> A resident with a gas leak must never be sitting in a web form. This is the one place in
> the spec where a worse user experience is the correct design.

---

## 4. Form fields

Target: **90 seconds on a phone.** Every field below either routes the ticket or prevents a
callback. Nothing else may be added without removing something.

### 4.1 Identity and location

| Field | Tier 1 (signed in) | Tier 2 (QR / anonymous) |
|---|---|---|
| Who you are | Auto from Sterling account | Name (required) |
| Unit | Auto from active Occupancy; a picker if the person has more than one | Auto from QR unit token; manual property + unit as fallback |
| Phone | Pre-filled from Person, editable | Required |
| Email | Pre-filled | Optional |

See §6 for which tier to build.

### 4.2 The issue

| Field | Type | Required | Why |
|---|---|---|---|
| What's the problem? | Plain-language category picker (§5) | ✓ | Routes to the right task template |
| Where in the home? | Kitchen · Bathroom · Bedroom · Living area · Laundry · Outside · Whole home | ✓ | Halves the diagnostic conversation |
| Describe it | Free text, 2–3 line hint | ✓ | |
| How long has it been happening? | Today · A few days · Over a week | ✓ | Separates "broke this morning" from "been getting worse" — a priority signal |
| Photos | Up to 5, camera-first | Strongly prompted, not required | The single largest triage-time saver |
| Is it getting worse? | Yes / No / Not sure | ✓ | Cheap escalation signal |

### 4.3 Access — the fields that actually save the time

| Field | Type | Required | Why |
|---|---|---|---|
| May we enter if you're not home? | Yes / No | ✓ | **The #1 callback cause.** Without it nothing can be scheduled |
| Best times | Weekday morning · Weekday afternoon · Evening · Weekend · Anytime (multi-select) | ✓ | Removes the scheduling round-trip |
| Pets in the home? | None · Dog · Cat · Other (+ free text) | ✓ | Safety, and a no-show cause |
| Gate / alarm / lockbox code | Free text | Optional | Asked once, stored on the ticket, not on the Unit record |
| Anything we should know? | Free text | Optional | Catch-all |

> Access permission, availability, and pets are three questions that each independently
> cause a callback when missing. Capturing them at submission is most of the value of this
> form.

---

## 5. Plain-language category mapping

Residents do not know what `locks_access` means. The form shows the left column; the system
stores the right.

| What the resident picks | → `family` / `category` |
|---|---|
| Water leak, drip, or flooding | `maintenance` / `plumbing` |
| Toilet, sink, shower, or drain | `maintenance` / `plumbing` |
| No hot water | `maintenance` / `plumbing` |
| Heating or air conditioning | `maintenance` / `hvac` |
| Lights, outlets, or power | `maintenance` / `electrical` |
| Fridge, stove, washer, or dryer | `maintenance` / `appliance` |
| Door, lock, key, or garage | `maintenance` / `locks_access` |
| Bugs, mice, or other pests | `maintenance` / `pest` |
| Internet, cable, or TV | `maintenance` / `internet_cable` |
| Damage to walls, floors, ceiling | `maintenance` / `structural` |
| Cleaning or trash | `maintenance` / `cleaning` |
| Yard, grounds, or snow | `maintenance` / `landscaping` |
| Furniture or household items | `turnover` / `furniture_delivery` |
| A question about my rent or bill | `lease_billing` / `rent_discrepancy` |
| I'm moving out | `housing_request` / `early_release` |
| Something else | `maintenance` / `other` |

Coordinators can recategorize at triage; the resident's original selection is preserved on
the ticket so the mapping can be tuned from real data.

---

## 6. Two tiers — which to build

The decision turns on a single question: **do the occupants have working Sterling M365
accounts they can use on a phone?** Many are PEI crew with `employee_id` on their Person
record, which suggests yes — but craft and field staff frequently have no corporate account
in practice, or have one they have never signed into.

### Tier 1 — Authenticated (sign in with Sterling account) ← **preferred if viable**

| | |
|---|---|
| **Identity** | Known. No name/phone typing, no impersonation, no spam |
| **Unit** | Resolved automatically from the active Occupancy |
| **Photos** | Work natively — this matters; see the Microsoft Forms note in §8 |
| **Build cost** | Lowest. Internal-only surface, no new security review, no anonymous endpoint |
| **Risk** | Fails completely for anyone without a usable account. That population is likely non-trivial |

### Tier 2 — QR code per unit, no login

A QR sticker inside each unit (inside a cabinet door, by the thermostat) encoding a
`unit_access_token`. Scanning opens the form with the unit already resolved.

| | |
|---|---|
| **Identity** | Self-declared name + phone. Verified by the coordinator at triage |
| **Unit** | Resolved from the token — no "which unit are you in?" confusion |
| **Photos** | Require an anonymous-capable upload path (§8) |
| **Build cost** | Higher. An externally reachable endpoint, abuse controls, sticker logistics |
| **Risk** | Spam and misuse; stickers get removed, painted over, or photographed and shared |

### Recommendation

**Validate Tier 1 against a real crew member's phone before choosing.** If a representative
field employee can sign in and upload a photo in under a minute, build Tier 1 only — it is
substantially cheaper and avoids an external surface entirely.

If that test fails, build Tier 2 and treat the token as the identity. **Do not build both
for v1**; two intake paths double the triage edge cases for a two-person team.

---

## 7. Data model additions

Additions to `01-data-model.md`. Nothing existing changes shape.

### Ticket — new fields

| Field | Type | Notes |
|---|---|---|
| intake_channel | enum | **Add `resident_form`** to the existing values |
| resident_stated_category | text | What the resident picked, before coordinator recategorization. Tunes §5 |
| issue_location | enum | `kitchen`, `bathroom`, `bedroom`, `living`, `laundry`, `outside`, `whole_home` |
| issue_duration | enum | `today`, `few_days`, `over_week` |
| issue_worsening | enum | `yes`, `no`, `unsure` |
| access_permission | bool | May we enter when nobody is home |
| access_windows | multi-enum | `weekday_am`, `weekday_pm`, `evening`, `weekend`, `anytime` |
| pets_present | text, nullable | |
| entry_code | text, nullable | **Sensitive.** Coordinators and managers only; purge on ticket close |
| possible_emergency | bool | Set by keyword match on a resident submission (§3) |
| required_callback | bool | Set when a coordinator had to call the resident for missing information. **This is the form's scorecard** (§9) |

### UnitAccessToken — Tier 2 only

| Field | Type | Notes |
|---|---|---|
| token_id | PK | |
| unit_id | FK | |
| token | text, indexed | Random, long, non-sequential. Never derived from unit number |
| issued_at / revoked_at | ts | |
| active | bool | Revoked and reissued on turnover — an outgoing occupant keeps their phone |
| submission_count_24h | derived int | Rate-limit input |

### Person

A Tier 2 submission from an unrecognized name creates no Person record at submission time.
The coordinator links the ticket to an existing Person, or creates one, at triage. **The form
must never write to the Person roster** — an unauthenticated public form that creates people
is how reference data rots.

---

## 8. Platform notes

Follows the Option A (Microsoft 365) recommendation in `04-platform-options.md`.

| Tier | Build with | Watch for |
|---|---|---|
| **Tier 1** | Microsoft Forms → Power Automate → ticket table. Or a Power Apps canvas app if the conditional logic in §3 and §5 outgrows Forms | Microsoft Forms supports file upload **only for signed-in responders within the organization** — which is exactly Tier 1, and exactly why Tier 2 cannot use it |
| **Tier 2** | Power Pages anonymous page, or a lightweight hosted form posting to the same Power Automate endpoint | Licensing for anonymous Power Pages capacity; an external surface means a security review that Tier 1 avoids entirely |

**The Microsoft Forms file-upload constraint is the decisive technical fact here.** Photos
are the largest triage saver in §4. Tier 1 gets them nearly free; Tier 2 requires a real
form-hosting solution. This reinforces testing Tier 1 first.

### Abuse controls — Tier 2 only

- Rate limit: 3 submissions per token per 24 hours, then the form asks the resident to call.
- CAPTCHA on the anonymous path.
- Tokens revoked and reissued at every turnover.
- Submissions on a token whose unit has no active Occupancy are flagged for review, not
  auto-created. An empty unit reporting a leaking toilet is either a stale sticker or abuse.

---

## 9. Automation rules

Added to `02-workflows.md` §3.1. Numbered to continue that table.

| # | Rule |
|---|---|
| A7 | WHEN a resident form is submitted THEN create a ticket `status=new`, `intake_channel=resident_form`, mapping `resident_stated_category` via §5, attaching photos |
| A8 | WHEN a resident submission trips the emergency keyword list THEN set `possible_emergency`, alert **both** coordinators immediately (not digest), and show the call-now number on the confirmation screen |
| A9 | WHEN a resident submission arrives for a unit with an open ticket in the same category < 7 days old THEN link as a possible duplicate and tell the resident their existing report is already open, with its number |
| A10 | WHEN a resident submission arrives on a Tier 2 token whose unit has no active Occupancy THEN hold for coordinator review instead of creating a ticket |
| A11 | WHEN a ticket is created from a resident form THEN send the resident a confirmation with the ticket number and the expected response time for its priority |
| A12 | WHEN a resident-submitted ticket is scheduled, resolved, or closed THEN notify the resident by SMS/email. **No login, no reply thread** — the message carries the coordinator's number for questions |

### The rule that pays for the whole feature

| # | Rule |
|---|---|
| **B9** | WHEN tasks generate for a ticket with `intake_channel=resident_form` AND `access_permission`, `access_windows`, and `pets_present` are all populated THEN auto-complete template step 1 ("Contact occupant, confirm issue + access window") with a system note, and start the ticket at step 2 |

> B9 is the mechanism by which this form reduces coordinator workload rather than merely
> relocating it. Every resident-submitted ticket that carries complete access information
> skips the first task in the maintenance template outright. If B9 is not implemented, the
> form adds volume without removing work — build B9 in the same phase as the form, not after.

| # | Rule |
|---|---|
| B10 | WHEN a coordinator calls a resident for information the form should have captured THEN they set `required_callback` with a reason code. Feeds §9's scorecard |

---

## 10. Measuring whether it worked

Add to the manager dashboard in `03-reporting.md` §2.

| Metric | Definition | What it tells you |
|---|---|---|
| **Self-service rate** | % of maintenance tickets with `intake_channel=resident_form` | Adoption. Low means residents don't know it exists or don't trust it |
| **Callback rate** | % of resident-submitted tickets with `required_callback` | **The headline metric.** Should trend toward zero. Above ~25% the form is missing a field |
| **Callback reasons** | `required_callback` grouped by reason code | Tells you precisely which field to add |
| **Step-1 auto-completion** | % of resident tickets where B9 fired | Direct measure of coordinator time saved |
| **Volume change** | Maintenance tickets/month before vs. after launch | The honest cost side of §2's caveat |
| **Triage time by channel** | `triaged_at − created_at`, form vs. coordinator-entered | Form tickets should triage faster. If slower, the form is producing low-quality submissions |
| **Emergency misroutes** | Tickets with `possible_emergency` set | Every one is a resident who should have called. Non-zero means §3's screen needs work |

**Success looks like:** callback rate under 25%, B9 firing on most resident tickets, and
triage time for form tickets below coordinator-entered tickets. If volume rises and callback
rate stays high, the form is a net loss and should be narrowed, not expanded.

---

## 11. Build phasing

The form slots into `04-platform-options.md` as **Phase 3.5** — after the automation engine,
before reporting.

| Prerequisite | Why |
|---|---|
| Phase 1 (queue) | Tickets must exist |
| Phase 2 (tasks) | B9 needs the maintenance template to exist |
| Phase 3 (automation) | The emergency alert path (A8) must be real before residents are invited in |

**Do not ship the form before Phase 3.** A resident reporting a flood into a queue with no
working alerting is worse than a resident reporting it into nothing, because the form
implies someone is watching.

Launch sequence: one property as a pilot → measure §10 for 30 days → fix the fields the
callback reasons expose → roll out.
