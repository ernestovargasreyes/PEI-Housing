# Trial week: maintenance request form

## What gets tried

One version, the Plateau form on Microsoft 365, used for one week with made-up requests. The week decides whether it is ready for the January pilot in Montgomery, and what to fix first.

Freshdesk was dropped on 2026-11-23 (decisions.md). Before that, this trial compared a Freshdesk version with the Plateau form side by side.

| Part | How it works |
|---|---|
| Worker form | A web form built for Plateau and hosted in Sterling's Azure (Static Web App), no sign-in |
| Queue | A SharePoint **Requests** list, linked to a SharePoint **Properties** list |
| Forward to the property | A Forward button on the request sends the email from `housing@` through Power Automate, photos attached; the request number is in the subject line |
| Property reply | Read in the `housing@` mailbox, found by the request number, and noted on the request by hand |
| Where the data lives | Microsoft 365 |
| Who changes the form | Ernest |

Setup: app/README.md (Deploy). If IT has not approved the Azure app registration and SharePoint access by Fri 4 Dec, the week runs on the dry-run setup instead (app/DRY-RUN.md): the worker side is tested in full, and the queue and Forward steps wait for SharePoint.

## What is being checked

- The six screens: emergency check, where you are, who you are, what's wrong, getting in, confirmation. [spec/v1-scope.md §5]
- English and Spanish.
- The statuses: New, Needs Info, Sent to Property, Fixed, Closed, Duplicate.
- One test property, **Test Apartments – Montgomery**, apartments 101 to 110. Its Submit To address goes to the trial organizer, so nothing reaches a real leasing office.
- Its After-Hours Phone is a phone the trial organizer answers. Every number on screen is marked **TEST – do not call**.

## Schedule

| Date | What happens | Who |
|---|---|---|
| This week | Ask IT for the Azure Static Web App and the app registration with access to one SharePoint site | Ernest, through Matt |
| Mon 30 Nov – Fri 4 Dec | Create the SharePoint lists, deploy the form, build the Forward flow (app/README.md) | Ernest |
| Fri 4 Dec | Send Tonya, Jordan and the foreman the link, the test QR sign, the test request cards and the scorecard | Ernest |
| Mon 7 Dec – Wed 9 Dec | Submit the test requests from a phone | Tonya, Jordan, one foreman |
| Tue 8 Dec and Wed 9 Dec | One daily pass, about 15 minutes each | Tonya, Jordan |
| Thu 10 Dec | 30-minute debrief: ready for January or not, and what to fix first | Tonya, Jordan, Matt, Ernest |

The baseline count of calls and texts runs 30 November to 4 December, the week before the trial. Thanksgiving week is not used for either.

## Test requests

Each card is submitted once, on a phone, away from a desk. Time card 1 from opening the link to the confirmation screen.

| # | Who submits | The request | What it checks |
|---|---|---|---|
| 1 | Tonya | Apartment 104, AC blowing warm, getting worse. Photo of the thermostat | Photo upload without sign-in |
| 2 | Tonya | Apartment 107, bathroom sink draining slowly. Says maintenance cannot enter while the worker is away | Entry permission; the form asks for times |
| 3 | Jordan | Apartamento 102, el refrigerador no enfría. Foto | The Spanish form from start to finish |
| 4 | Jordan | Apartment 104, AC not cooling, submitted again by a second worker | Spotting and merging a duplicate |
| 5 | Jordan | No water in apartment 109 | The emergency screen stops the form and shows the property's after-hours number |
| 6 | Foreman | Apartment 110, broken window latch, for a worker without a smartphone; the worker's cell number in the contact field | Submitting for someone else |
| 7 | Foreman | Apartment 103, dishwasher not draining, scanned from the printed test QR code | The property is filled in from the QR code |
| 8 | Foreman | Apartment 105, bedroom ceiling light out, submitted on cellular data outside, not on Wi-Fi | The form loads and sends on a weak connection |

## The daily pass

Done once on Tuesday and once on Wednesday.

1. Open the Requests list (view **1 Triage today**) and find the new requests.
2. For each one: check the property and apartment number, check that entry permission is there, and press **Forward**. It is marked Sent to Property.
3. Mark the request with no entry permission as Needs Info and send the worker a text with what is missing.
4. Open view **2a Follow up (reported again)**. The second AC report for apartment 104 is marked *Repeat of* the first, and the first shows *Times Reported Again: 1*. Follow up with the property on the first (reply in its email thread), then set the second to Duplicate.
5. Reply to one forwarded email as if you were the leasing office ("scheduled for Thursday"). Find that reply in `housing@` by the request number and note it on the request.
6. Close one request as fixed.

## Scorecard

Filled in by Tonya, Jordan and the foreman, one copy each, after the last pass.

| | Answer |
|---|---|
| Seconds to submit request 1 | |
| Photo attached without problems (yes / no) | |
| Spanish form read correctly (yes / no) | |
| Emergency screen stopped the form and showed the number (yes / no) | |
| QR code filled in the property (yes / no) | |
| Form worked on cellular data (yes / no) | |
| Minutes for one daily pass | |
| Found the leasing office's reply by the request number (yes / no) | |
| Could you use this every day? (yes / not sure / no) | |
| What got in the way? | |

## Ready for January?

1. **Must pass:** a photo attaches without sign-in; the emergency screen stops the form and shows the number; Spanish works; the QR code fills in the property; the form sends on cellular data. Anything that fails is fixed and checked again before the pilot.
2. **Coordinators decide:** if Tonya and Jordan both answer yes to "Could you use this every day?", it goes to the January pilot. If either says not sure or no, the top items under "What got in the way?" are fixed first, and that part of the week is run again.
3. **Matt confirms** IT's approval is in place before the January pilot is scheduled.

## Open questions

- Will IT host a public web form in Sterling's Azure, and does that need a security review before the trial or only before the pilot?
- Who in IT grants the app registration access to one SharePoint site (Sites.Selected)?
- Which foreman takes part in the trial?
- Is the shared `housing@` mailbox ready for the trial week?
