# Forward flow (Power Automate)

The **Forward** button on a request in the Requests list. One tap sends the request to the
property's maintenance contact from the shared `housing@` mailbox, attaches the photos, and
marks the request **Sent to Property** with today's date. This is the "one piece of
automation worth building" in `spec/v1-scope.md` §5.

Built by hand in Power Automate (about 30 minutes). Every connector used is standard
(SharePoint, Office 365 Outlook), so no premium licence is needed.

## Before you start

- `provision.ps1` has run, and the Properties list has at least the test property, with
  **How to Submit** = Email and **Submit To** = the trial organizer's address.
- The shared mailbox `housing@` exists, and the person building the flow has **Send As**
  on it. (The flow sends as whoever owns the connection, through the shared mailbox.)

## Build it

Create an **Instant cloud flow** named `Forward maintenance request`.

### 1. Trigger: SharePoint, *For a selected item*

- Site address: the housing site
- List name: `Requests`

### 2. SharePoint, *Get item* — rename it `Get request`

- List: `Requests`, Id: `ID` (from the trigger)

### 3. Condition — is the property known?

`Property Id` (from Get request) **is equal to** *(leave empty)*

**If yes**: Office 365 Outlook *Send an email (V2)* to the person who pressed the button
(trigger `User email`), subject `Pick the property first: @{outputs('Get_request')?['body/Title']}`,
body `The worker typed "@{outputs('Get_request')?['body/PlaceNotListed']}". Open the request, choose the Property, then press Forward again.`
Then **Terminate** (Succeeded).

### 4. SharePoint, *Get item* — rename it `Get property`

- List: `Properties`, Id: `Property Id` from Get request

### 5. Compose — rename it `Greeting`

```
if(contains(coalesce(outputs('Get_property')?['body/ContactName'], ''), ','), concat('Hi ', first(split(trim(first(split(outputs('Get_property')?['body/ContactName'], ','))), ' ')), ','), 'Hi,')
```

"Brenda, leasing office" greets Brenda; "Leasing office" gets a plain "Hi,".

### 6. Compose — rename it `Subject`

```
concat('Plateau Excavation — Apt ', outputs('Get_request')?['body/Apartment'], ' — ', outputs('Get_request')?['body/ProblemType'], ' — ', outputs('Get_request')?['body/Title'])
```

The request number stays in the subject so a reply can be matched to the request.

### 7. Condition — does this property take email?

`How to Submit Value` (from Get property) **is equal to** `Email`

**If no** (phone, portal, front desk, text): send the person who pressed the button an
email with the details to read out or paste, and stop **without** changing the status,
because nothing was sent yet:

- To: trigger `User email`
- Subject: `@{outputs('Get_property')?['body/HowToSubmit/Value']}: @{outputs('Subject')}`
- Body: `@{outputs('Get_property')?['body/Title']} takes requests by @{outputs('Get_property')?['body/HowToSubmit/Value']}: @{outputs('Get_property')?['body/SubmitTo']}` followed by the same details block as step 9.
  For a phone call, ask who you spoke to and for a work order number, and put both in
  **Notes** on the request before you hang up. Then set **Status** to Sent to Property,
  **Sent On** to today and **Sent By** to the method by hand.
- Then **Terminate** (Succeeded).

### 8. Photos

1. Initialize variable `attachments`, type **Array**, value `[]`.
2. SharePoint *Get files (properties only)*: library `Request Photos`, **Limit entries to folder** =
   `/Request Photos/@{outputs('Get_request')?['body/PhotoFolder']}`. Settings: turn on
   **Configure run after** for the next step to run when this one *has failed* as well,
   because a request with no photos has no folder.
3. **Apply to each** over the files (`value`):
   - SharePoint *Get file content*, File identifier = `Identifier`
   - *Append to array variable* `attachments`:
     ```json
     { "Name": "@{items('Apply_to_each')?['{FilenameWithExtension}']}", "ContentBytes": "@{body('Get_file_content')?['$content']}" }
     ```

### 9. Office 365 Outlook, *Send an email from a shared mailbox (V2)*

- Original mailbox address: `housing@<domain>`
- To: `@{outputs('Get_property')?['body/SubmitTo']}`
- Subject: `@{outputs('Subject')}`
- Attachments: switch to array input and use the `attachments` variable
- Importance: Normal (never "high": the emergency path is a phone call)
- Body (switch the editor to code view and paste):

```html
<p>@{outputs('Greeting')}</p>
<p>Maintenance request for one of the apartments Plateau Excavation leases at @{outputs('Get_property')?['body/Title']}.</p>
<p><b>Apartment:</b> @{outputs('Get_request')?['body/Apartment']}<br>
<b>Problem:</b> @{outputs('Get_request')?['body/ProblemType']} (@{outputs('Get_request')?['body/WhereInUnit']})<br>
<b>Started:</b> @{outputs('Get_request')?['body/Started']}@{if(equals(outputs('Get_request')?['body/GettingWorse'], 'Yes'), ', getting worse', '')}<br>
<b>Our reference:</b> @{outputs('Get_request')?['body/Title']}</p>
<p><b>What our resident reported@{if(equals(outputs('Get_request')?['body/FormLanguage/Value'], 'Spanish'), ' (in Spanish)', '')}:</b><br>
"@{outputs('Get_request')?['body/ProblemDescription']}"</p>
<p><b>Access:</b><br>
• OK to enter when nobody is home: @{outputs('Get_request')?['body/EntryOK']}<br>
• Best times: @{coalesce(outputs('Get_request')?['body/Availability'], '—')}<br>
• Pets: @{outputs('Get_request')?['body/Pets']}@{if(empty(outputs('Get_request')?['body/AccessNotes']), '', concat('<br>• Notes: ', outputs('Get_request')?['body/AccessNotes']))}</p>
<p><b>Resident:</b> @{outputs('Get_request')?['body/WorkerName']}, @{outputs('Get_request')?['body/WorkerCell']}. Call ahead if you need to.</p>
<p>@{if(greater(length(variables('attachments')), 0), concat(string(length(variables('attachments'))), ' photo(s) attached.'), '')}</p>
<p>Could you reply with when someone can look at it? A one-line answer is fine.</p>
<p>Thanks,<br>
@{triggerOutputs()?['headers/x-ms-user-name']}<br>
Housing Coordinator, Plateau Excavation<br>
housing@&lt;domain&gt; · (XXX) XXX-XXXX</p>
```

Replace the last line's address and number with the real ones before the pilot.

**What the email leaves out, on purpose** (`spec/v1-scope.md` §5): cost or who pays, other open
requests at the same property, the worker on CC, and urgency language.

### 10. SharePoint, *Update item* — mark it sent

- List `Requests`, Id = trigger `ID`
- Title: `Title` from Get request (Update item requires it)
- Status Value: `Sent to Property`
- Sent On: `@{utcNow()}`
- Sent By Value: `Email`
- Owner Claims: trigger `User email`
- Activity:
  ```
  @{concat(outputs('Get_request')?['body/ActivityLog'], decodeUriComponent('%0A'), utcNow(), '  Sent to property by email from housing@ (', triggerOutputs()?['headers/x-ms-user-name'], ')')}
  ```

## Following up on repeats

Coordinators follow up with a property only when a problem is reported again (decided 2026-11-24).
The form marks a new report of an open problem *Repeat of HR-xxxx* and adds one to *Times Reported
Again* on the original. View **2a Follow up (reported again)** lists those originals, most-repeated
first. Follow up by replying in the original email thread (the request number is in the subject),
using the follow-up template on the Notion project page, then set the repeat to Duplicate.

## Hook the button to the flow

1. Open the flow's details page. The flow ID is the GUID in the address bar after `/flows/`.
2. In `forward-button.column.json`, replace `REPLACE-WITH-FLOW-ID` with that GUID.
3. In the Requests list, open the **Forward** column → *Column settings* → *Format this column*
   → *Advanced mode*, paste the JSON and save.
4. Share the flow with Jordan as a **run-only user** (connections: "Use this connection"
   for SharePoint and Outlook), so both coordinators can press Forward.

The button shows only on **New** and **Needs Info** requests, so a request cannot be
forwarded twice by accident. To forward one again, set it back to New.

## Check it (trial card 1)

Submit a request for Test Apartments – Valdosta from the form, press **Forward** on it, and confirm:

- [ ] The email arrives at the trial organizer's address, from `housing@`, with the request number in the subject
- [ ] The photo is attached
- [ ] The request now shows Sent to Property, Sent On is today, and Days Since Sent reads 0 days
- [ ] Reply to the email: the reply lands in `housing@`, and searching that mailbox for the request number finds it
