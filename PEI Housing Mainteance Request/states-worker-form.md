# Worker maintenance request form: states and edge cases

## State Inventory

### Every screen

| State | Where | What the worker sees | What the worker can do | Recovery and timings | Severity |
|---|---|---|---|---|---|
| Send fails: no signal | Send request, screen 5 | Button returns to "Send request". Callout above it [copy G7] | Try again; leave the page | The form tries again on its own when the phone reports a connection, while the page is open, and shows [copy G8] in the button. No request number is shown until the server has accepted the request. | Critical |
| Send fails: server error or captive Wi-Fi | Send request | Callout [copy G9] | Try again | After the third failed attempt, the callout adds the housing number and a **Copy my request** button that copies every answer as one plain-text message to paste into a text [copy G10–G13]. | Critical |
| Coming back to a complete request that was never sent | Opening the link | Before screen 1, the unsent-request prompt [copy U1–U4] | Send it; delete it | Shown for up to 7 days. A complete unsent request is never deleted without asking. | Critical |
| Same request sent twice | Send request | Nothing different. The button disables on the first tap. | — | Each request carries an ID made on the phone when the form opens; the queue keeps the first copy and drops any repeat with the same ID. A retry after a lost reply returns the original request number. | Critical |
| Signal drops while filling in | Any screen | A one-line bar under the top bar [copy G6] | Keep answering | The bar clears when the connection returns. Nothing is blocked until Send. | Major |
| Coming back to an unfinished request | Opening the link | The resume prompt, as drawn, with one addition for each thing that changed while the worker was away: photos that had not finished uploading [copy R3]; a property no longer on the list [copy R4] | Continue; start over | Continue opens the screen the worker left. If the property was removed, Continue opens screen 2 with the property cleared. After 24 hours an unfinished request is deleted without asking. | Major |
| Phone storage unavailable | Any screen (private browsing, an in-app browser that clears data) | The form as normal, without the resume prompt and without remembered details | Fill in and send | Nothing is saved between visits. The form works the same otherwise. | Minor |
| Refresh or the phone's back gesture | Any screen | The same screen with every answer still filled in | — | Answers come from the phone's saved copy. Back from the confirmation opens a new, empty screen 1, never screen 5 with the Send button. | Minor |
| Too many requests from one phone | Send request | Callout [copy G15] | Call | 5 requests per phone per hour. The limit clears an hour after the first of the 5. | Minor |

### 1. Emergency check and call screen

| State | What the worker sees | What the worker can do | Recovery and timings | Severity |
|---|---|---|---|---|
| Phone or device can't place calls | Tapping Call does nothing, or opens a "no app" message (Wi-Fi-only tablet, a computer) | Read the number and dial it from another phone | The number is in the button label as text, large enough to read across a room. It never appears only inside the link. | Critical |

### 2. Where are you

| State | What the worker sees | What the worker can do | Recovery and timings | Severity |
|---|---|---|---|---|
| QR code or link with a property that isn't on the list | The plain-link version of screen 2, with a callout above the property control [copy W7] | Choose from the list; use "My place isn't listed" | — | Major |
| Property list fails to load | In place of the property control: the name and city fields [copy W8, W9] | Type the name and city | The request arrives marked for the coordinators to match, as with "My place isn't listed". The list loads again on the next visit. | Major |
| "My place isn't listed" | A screen with the name (required) and city (optional) fields [copy W8, W9], and Next | Type and continue | Next returns to the apartment number field on screen 2. | Major |
| Search finds nothing | Under the search box: [copy P5], followed by the "My place isn't listed" row | Change the search; use "My place isn't listed" | — | Minor |

### 4. What's wrong

| State | What the worker sees | What the worker can do | Recovery and timings | Severity |
|---|---|---|---|---|
| Photo upload fails | The thumbnail with a retry glyph in place of the spinner; hint line [copy Q18] | Tap to retry; remove the photo; keep going | Each failed photo retries once on its own after 5 seconds before showing the retry glyph. | Major |
| Five photos added | Add photo is disabled; hint line [copy Q19] | Remove a photo to add a different one | — | Minor |
| Description left empty | The field marked invalid [copy Q20] | Type | Checked when Next is tapped. | Minor |
| Description very long | A count under the field from 1,800 characters [copy Q21] | Shorten | Typing stops at 2,000 characters. | Minor |

### 5. Getting in and sending

| State | What the worker sees | What the worker can do | Recovery and timings | Severity |
|---|---|---|---|---|
| Sending, photos still uploading | Button disabled, with a spinner [copy S2] | Wait | Sends when the photos finish. At 30 seconds the request is sent without the unfinished photos. | Major |
| Sending takes longer than usual | After 10 seconds the button reads [copy S3] | Wait | At 30 seconds with no reply: the "Not sent yet" callout from Every screen. | Major |
| Times left empty after "No" | The times group marked invalid [copy A12] | Pick a time | Checked when Send is tapped. | Minor |

### 6. Confirmation

| State | What the worker sees | What the worker can do | Recovery and timings | Severity |
|---|---|---|---|---|
| Sent without some photos | Under the request number: callout [copy C10, C11] | Send the photos again; leave them | Photos sent from here are added to the same request. The button stays until they arrive or the page closes. | Major |

## Edge Case Catalog

| Scenario | What the design does now | Change | Severity |
|---|---|---|---|
| Request sent the evening before a holiday | The confirmation names the next weekday, when nobody reviews the queue | The review day skips dates on a holiday list the coordinators keep in the queue. | Minor |
| Emergency words in a description the worker already marked "not an emergency", then edited | The check would run again on every Next | The check runs once per request. After "It's not an emergency — continue", it does not appear again for that request. | Minor |
| Description in Spanish while the form is in English, or the reverse | Keyword check could miss it | The check runs the English and Spanish word lists on every description, whatever the form language. | Minor |
| Cell number pasted as "+1 (229) 555-0134" or "1-229-555-0134" | Could count 11 digits and fail | A leading 1 or +1 is removed before counting. Stored as 10 digits. | Minor |
| Apartment number entered as "214 and 216" or "Bldg 3 Apt 12" | — | The apartment number field takes up to 30 characters of any kind and wraps in the queue and the forward email. | Minor |
| Long names, such as "José Luis Hernández García" | — | The name field takes up to 80 characters; the confirmation and the forward email wrap it. | Minor |
| Spanish buttons are about a quarter longer [copy E11] | Full-width buttons hold one line in English | Buttons wrap to two lines and grow taller; no label is cut off. | Minor |
| "Step 1 of 4", the review day and dates built by joining words | — | Each sentence with a value in it is one translatable string with placeholders, so Spanish word order ("Paso 1 de 4", "el lunes") is correct. | Minor |
| Public form receives automated spam | — | A hidden field that people never fill; submissions that fill it are dropped. Plus the 5-per-hour limit above. | Minor |
| Old or slow phone | — | The form, before photos, loads in under 200 KB, with no web fonts. | Minor |

## Open Questions

- Which number does the form show when sending fails three times: the coordinators' texting number or the emergency line?
