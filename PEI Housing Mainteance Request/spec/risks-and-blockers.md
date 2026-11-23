# Blockers, Assumptions & Risks

**Status:** v1 · 2026-11-20 · Companion to [`v1-scope.md`](v1-scope.md)

Live versions on the Notion page, including the Decision Log database:
<https://app.notion.com/p/41e5dc0bf9c380e08ef1ca9ac08f06a2>

---

## 1. Blockers to launch

Six. Only two need Matt.

| # | Blocker | Who | Note |
|---|---|---|---|
| 1 | **The emergency phone number** | Plateau | Appears as `(XXX) XXX-XXXX` in the form, the sign, the wallet cards and the worker texts. Nothing prints or ships without it, and it is the one placeholder with a safety consequence |
| 2 | Property + contact list | Tonya & Jordan | Already asked for. Nothing routes without it |
| 3 | Shared `housing@` mailbox | IT | So both coordinators see replies, and one being out doesn't hide a request |
| 4 | The form URL | Build | Signs cannot print until it exists — the QR encodes it |
| 5 | Platform call: M365 build vs Notion pilot | Ernest | Decides whether the pilot runs in days or weeks |
| 6 | A pilot window that isn't the holidays | Matt | See §2 |

## 2. The timing problem

It is late November. A two-week pilot starting now runs through Thanksgiving and into
December.

Excavation is weather-dependent and crews surge and idle seasonally. A pilot over the
holidays — reduced crews, people travelling home — measures a fortnight that looks nothing
like a normal one. **Low request volume would read as "workers aren't adopting it"** when
the real cause is that half the crew isn't there.

Ask Matt whether a given window is representative. If it isn't: **run the baseline week now
anyway** — it is one number a day and costs nothing — and start the pilot in January.

## 3. Assumptions that could be wrong

None of these has been tested.

| Assumption | If wrong | How to check |
|---|---|---|
| **Workers have a smartphone with a camera and data or wifi** | The biggest one. The form reaches part of the workforce and likely excludes those who most need help — older hands, newer hires, anyone on a basic phone | Ask one foreman to count hands on one crew. Ten minutes |
| Workers will use a link instead of texting | v1 fails its only stated goal | The pilot measures exactly this |
| English is enough | A meaningful share can't use it quickly and quietly keeps texting | Ask Matt or a foreman |
| Hotels will allow a posted sign | The QR path narrows to cards and a texted link — survivable, not fatal | Ask one GM |
| The coordinators will redirect texts to the link | The form becomes additive and calls never drop | Visible in the pilot log within days |
| Properties respond to a forwarded request | The queue fills with sent rows nobody can move | `Days Since Sent` shows it immediately |

**The no-smartphone fallback needs no design change.** A foreman submits on the worker's
behalf and puts *the worker's* number in the contact field. The form never asks "are you the
person with the problem?", so this already works — it just has to be said out loud when the
link goes to crews, or the people without phones stay invisible.

## 4. Risks

| Risk | Mitigation |
|---|---|
| A worker ignores the emergency gate and submits at 2am | Gate refuses, confirmation repeats the number, flagged submissions scanned first thing each morning. **Residual risk accepted, not eliminated** — which is why blocker #1 is a safety item, not an admin one |
| Worker name, cell and room emailed to third-party hotels | Necessary and proportionate to getting a repair done. Worth not adding more, and worth knowing it happens |
| The pilot succeeds and then nothing happens | Decide who owns rollout now. Already an open question for Matt |
| Docs 00–05 mistaken for the plan | They are labelled, but anyone arriving cold may read them first. The Decision Log is the backstop |

## 5. Decision log

Lives as a Notion database on the project page. Eight entries so far, each with a **"Reverse
if"** — the evidence that would make it the wrong call. A decision without a reversal
condition is a belief, and beliefs are what make a plan hard to change when facts arrive.

**Two entries are marked `Assumed — unconfirmed`:** that workers have usable smartphones, and
that an English-only form is enough. Those are guesses currently carrying the weight of
decisions, and both are cheap to resolve with one conversation.
