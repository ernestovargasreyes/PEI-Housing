# Plateau Excavation housing: worker maintenance request form

A phone form, opened from a link or a property QR code with no sign-in, where a crew member living in an apartment Plateau rents reports a maintenance problem in English or Spanish in under 90 seconds. Requests land in one queue that the housing coordinators, Tonya Reaves and Jordan, review once a day and forward to the leasing office that does the repair, since Plateau, not the worker, is the tenant on the lease. The change it makes: maintenance stops reaching the coordinators as calls and texts at all hours, and arrives complete enough to forward without a callback. [../spec/v1-scope.md §1, §5; ../context-plateau-maintenance.md]

This build is the Plateau form in the platform trial: a custom form hosted in Sterling's Azure, a SharePoint list as the queue, and Power Automate sending the forward email from `housing@`. [../trial-platform.md]

## Contents

| Artifact | Path | What it holds |
|---|---|---|
| Brief | ../spec/v1-scope.md | v1 scope: the form, the queue and its statuses, the property and contact list fields, the one-click forward, what is not in v1, the pilot |
| Project context | ../context-plateau-maintenance.md | Users, constraints and the ethical stance every screen follows |
| Platform trial | ../trial-platform.md | The Plateau form's parts, the test property, the trial week and the test requests the build is first used for |
| Flow | ../journey-worker-form.md | Every screen's reason to exist, branches, variations, interaction timings, what passes between channels |
| Flow diagram | ../journey-worker-form.html | The flow at a glance, and what reaches the worker after sending |
| Wireframes | ../wireframes-worker-form.html | Every screen at phone width with real content and the reason for each structural choice in its notes (Slides view) |
| States and edge cases | ../states-worker-form.md | Every state the wireframes do not draw: failed sends, offline, returning to a request, photo failures, limits, validation, rate limit |
| Copy | ../copy-worker-form.md | Every string in English and Spanish by ID, the word list, and the coordinators' texts to workers |
| Accessibility | ../accessibility-worker-form.md | Required changes with tests (tap target sizes, native radio groups, language switching, labels), announcements and focus targets |
| Forward email templates | [Notion project page § The templates](https://app.notion.com/p/41e5dc0bf9c380e08ef1ca9ac08f06a2) | The email the Forward button sends, its merge fields and what it leaves out |
| Property and contact list | [Notion project page § Properties & Maintenance Contacts](https://app.notion.com/p/41e5dc0bf9c380e08ef1ca9ac08f06a2) | The routing data the picker and the forward read |
| Decision log | ../decisions.md | Every default and its reason, including the ethical review |

## How the pieces fit

| Screen | Wireframe frame | Journey step | States | Copy |
|---|---|---|---|---|
| Pick up where you left off: an interrupted worker keeps their answers | `scr-resume` | Before screen 1 | Coming back to an unfinished request | R1–R6 |
| Request that was never sent: a request tapped Send with no signal is not lost | `scr-unsent` | Before screen 1 | Coming back to a complete request that was never sent | U1–U4 |
| Emergency check: a worker with an emergency never fills in a form | `scr-emergency` | 1 | — | E1–E11 |
| Call now: the number, in one tap | `scr-call` | 1, emergency tapped | Phone or device can't place calls | K1–K6 |
| Where are you, plain link: the request can be routed | `scr-where` | 2 | Property list fails to load | W1–W5, W10, W11 |
| Choose where you're staying: find the place by name or city | `scr-pick` | 2 | Search finds nothing | P1–P6 |
| My place isn't listed: a missing property never stops the request | `scr-notlisted` | 2 | "My place isn't listed" | W8, W9 |
| Where are you, from a QR code: only the apartment number is typed | `scr-where-qr` | 2, QR entry | QR code or link with a property that isn't on the list | W6, W7 |
| Where are you, returning worker: confirm in one tap and see the last request | `scr-where-back` | 2, returning worker | — | W12–W16 |
| Who are you: someone to follow up with | `scr-who` | 3 | — | H1–H8 |
| What's wrong: the property knows what to bring | `scr-what` | 4 | Photo upload fails; five photos added; description empty or very long | Q1–Q24 |
| Might be an emergency: a worker who typed an emergency is offered the call first | `scr-maybe` | 4, emergency words | — | X1–X4, K3 |
| Getting in: no callback for entry, times or pets | `scr-access` | 5 | Sending with photos; sending takes longer; times left empty | A1–A12, S1–S3 |
| Confirmation: proof it arrived and a number to quote | `scr-done` | 6 | Sent without some photos | C1–C11 |
| Every screen | — | Interaction Specifications | Send fails; signal drops; same request sent twice; storage unavailable; refresh and back; rate limit | G1–G16 |

## Left to the builder

- Visual design: color, type, spacing and motion beyond the journey's Interaction Specifications and the sizes in the accessibility findings
- Technology: the front-end framework, the Azure hosting service, and how the form writes to the SharePoint list
- The property code in the QR link: `tools/make_signs.py` appends `?p=<code>` to the form URL, so each row of the property list needs a code column the form looks up
- How answers are saved on the phone, within the rules in the flow and the state inventory (24 hours for an unfinished request, 7 days for an unsent one)
- The name of the hidden anti-spam field

## Open questions

- What are the emergency number and the housing number? Neither string ships with a placeholder. (../copy-worker-form.md; ../spec/risks-and-blockers.md §1)
- Which number does the form show when sending fails three times: the coordinators' texting number or the emergency line? (../states-worker-form.md)
- Will IT host a public web form in Sterling's Azure, and does that need a security review before the trial or only before the pilot? (../trial-platform.md)
- How long are closed requests kept, including gate codes and other notes a worker types under "Anything else they should know?" (../context-plateau-maintenance.md)
