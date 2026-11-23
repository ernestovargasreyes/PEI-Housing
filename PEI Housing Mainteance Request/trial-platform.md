# Platform trial: maintenance request form

## What gets tried

Two versions of the same maintenance request form and queue, used side by side for one week with made-up requests. The platform used for the January pilot is the one Tonya and Jordan pick at the end of the week.

| | Freshdesk | Plateau form |
|---|---|---|
| Worker form | Freshdesk web form, no sign-in | A web form built for Plateau and hosted in Sterling's Azure, no sign-in |
| Queue | Freshdesk ticket list | A SharePoint list, linked to a SharePoint copy of the property list |
| Forward to the property | Forward the ticket by email from Freshdesk; the ticket number is in the subject line | A Forward button on the request sends the email from `housing@` through Power Automate; the request number is in the subject line |
| Property reply | Attached to the ticket automatically | Read in the `housing@` mailbox and noted on the request by hand |
| Where the data lives | Freshdesk | Microsoft 365 |
| Who changes the form | Tonya and Jordan | Ernest |

If IT requires everything to stay in Microsoft 365, Freshdesk is replaced with Microsoft Forms and a SharePoint list. In that version, workers either sign in or send requests without photos.

## What is the same in both

- The six screens: emergency check, where you are, who you are, what's wrong, getting in, confirmation. [spec/v1-scope.md §5]
- English and Spanish.
- The statuses: New, Needs Info, Sent to Property, Fixed, Closed, Duplicate.
- One test property, **Test Apartments – Valdosta**, apartments 101 to 110. Its contact email goes to the trial organizer, so nothing reaches a real leasing office.
- The emergency number on the emergency screen and the confirmation screen is marked **TEST – do not call**.

## Schedule

| Date | What happens | Who |
|---|---|---|
| Tue 24 Nov | Build Freshdesk if IT has approved it by then, Microsoft Forms and a SharePoint list if not | Ernest |
| Mon 30 Nov – Fri 4 Dec | Build the Plateau form | Ernest |
| Fri 4 Dec | Send Tonya, Jordan and the foreman the two links, the test request cards and the scorecard | Ernest |
| Mon 7 Dec – Wed 9 Dec | Submit the test requests from a phone, both versions | Tonya, Jordan, one foreman |
| Tue 8 Dec and Wed 9 Dec | One daily pass in each version, about 15 minutes each | Tonya, Jordan |
| Thu 10 Dec | 30-minute debrief and pick | Tonya, Jordan, Matt, Ernest |

The baseline count of calls and texts runs 30 November to 4 December, the week before the trial. Thanksgiving week is not used for either.

## Test requests

Each card is submitted once in each version, on a phone, away from a desk. The first time on each card, time it from opening the link to the confirmation screen.

| # | Who submits | The request | What it checks |
|---|---|---|---|
| 1 | Tonya | Apartment 104, AC blowing warm, getting worse. Photo of the thermostat | Photo upload without sign-in |
| 2 | Tonya | Apartment 107, bathroom sink draining slowly. Says maintenance cannot enter while the worker is away | Entry permission; the request goes to Needs Info if it is missing |
| 3 | Jordan | Apartamento 102, el refrigerador no enfría. Foto | The Spanish form from start to finish |
| 4 | Jordan | Apartment 104, AC not cooling, submitted again by a second worker | Spotting and merging a duplicate |
| 5 | Jordan | No water in apartment 109 | The emergency screen stops the form and shows the number to call |
| 6 | Foreman | Apartment 110, broken window latch, for a worker without a smartphone; the worker's cell number in the contact field | Submitting for someone else |
| 7 | Foreman | Apartment 103, dishwasher not draining, scanned from the printed test QR code | The property is filled in from the QR code |
| 8 | Foreman | Apartment 105, bedroom ceiling light out, submitted on cellular data outside, not on wifi | The form loads and sends on a weak connection |

## The daily pass

Done once on Tuesday and once on Wednesday, in each version.

1. Open the queue and find the new requests.
2. For each one: check the property and apartment number, check that entry permission is there, and forward it to the property. Mark it Sent to Property.
3. Mark the request with no entry permission as Needs Info and send the worker a text with what is missing.
4. Merge the two AC requests for apartment 104.
5. Reply to one forwarded request as if you were the leasing office ("scheduled for Thursday"). Find that reply from the request.
6. Close one request as fixed.

## Scorecard

Filled in by Tonya, Jordan and the foreman, one copy each, after the last pass.

| | Freshdesk | Plateau form |
|---|---|---|
| Seconds to submit request 1 | | |
| Photo attached without problems (yes / no) | | |
| Spanish form read correctly (yes / no) | | |
| Emergency screen stopped the form (yes / no) | | |
| QR code filled in the property (yes / no) | | |
| Form worked on cellular data (yes / no) | | |
| Minutes for one daily pass | | |
| Found the leasing office's reply without searching email (yes / no) | | |
| Could you use this every day? (yes / not sure / no) | | |
| What got in the way? | | |

## How the pick is made

1. A version fails the trial if a photo cannot be attached without sign-in, if the emergency screen lets the form continue, or if Spanish does not work. Those are fixed before anything else is compared.
2. Between versions that pass, the coordinators' answer to "Could you use this every day?" decides.
3. When both coordinators say yes to both, the one with the shorter daily pass is used.
4. When the daily passes are within five minutes of each other, the Freshdesk version, which Tonya and Jordan can change themselves, is used over the Plateau form.
5. Matt confirms IT will approve the pick before the January pilot is scheduled.

## Open questions

- Will IT approve Freshdesk for worker names, cell numbers and apartment numbers, or does everything have to stay in Microsoft 365?
- Will IT host a public web form in Sterling's Azure for the Plateau form, and does that need a security review before the trial or only before the pilot?
- Which foreman takes part in the trial?
- Is the shared `housing@` mailbox ready for the trial week?
