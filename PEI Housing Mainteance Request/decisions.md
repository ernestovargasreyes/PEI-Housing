## 2026-11-20 · The form is English and Spanish at launch
- Decided by: Claude, default
- Why: Part of the crew likely reads Spanish first; the sign and wallet cards are already bilingual, and writing both versions together costs less than translating later.
- Rejected: English-only at launch, because a worker who cannot read the form quickly keeps texting and the form fails its only goal.
- Rests on: spec/risks-and-blockers.md §3; spec/v1-scope.md §5

## 2026-11-20 · Baseline week runs now; the pilot starts in January
- Decided by: Claude, default
- Why: A two-week pilot over Thanksgiving and December would measure reduced crews and read low volume as low adoption.
- Rejected: Starting the pilot immediately.
- Rests on: spec/risks-and-blockers.md §2

## 2026-11-20 · Worker texts carry status only
- Decided by: Claude, default
- Why: The coordinators' problem is interruptions; texts beyond sent, scheduled and closed become Notification Spam and Nagging.
- Rejected: Reminder texts to use the form; satisfaction surveys after a repair.
- Rests on: spec/v1-scope.md §5 (texts to the worker)

## 2026-11-20 · Artifacts this project makes
- Decided by: Claude, default
- Why: Each artifact answers a condition in context-plateau-maintenance.md.
- List: brief (spec/v1-scope.md, existing) · journey for the worker form and the coordinators' daily pass, because the form must beat a text in 90 seconds and the daily pass replaces calls · copy deck in English and Spanish, because the form is bilingual · state inventory for the emergency screen, Needs Info and a property that goes quiet, because those are the paths where a request is lost · accessibility review of the form, because it runs on old phones and in a second language · measurement plan (spec/v1-scope.md §9, existing) · handoff package for the build.
- Rejected: Information architecture and service blueprint, because v1 has one form and one queue.
- Rests on: context-plateau-maintenance.md

## 2026-11-20 · The platform is picked by a one-week trial of Notion and Freshdesk
- Decided by: Ernest (trial approach); Claude, default (the two options)
- Why: The coordinators choose from something they have used. Notion is already half built. Freshdesk takes a public form with photos and attaches property replies to the ticket, which is the forwarding loop.
- Rejected: Microsoft Forms, because file upload needs a signed-in organizational responder; Power Pages, because a public site takes longest and likely needs a security review; Jotform with a spreadsheet, because the queue has no forwarding or reply tracking; property-management software and a custom app, because both are larger than one form and one queue.
- Rests on: spec/04-platform-options.md; spec/05-resident-intake.md §6
- Superseded: 2026-11-23, Freshdesk dropped (below).

## 2026-11-20 · Trial runs 30 Nov to 2 Dec, alongside the baseline week
- Decided by: Claude, default
- Why: Thanksgiving week (23–27 Nov) has reduced crews and is used to build; the pilot starts in January.
- Rejected: Running the trial during Thanksgiving week.
- Rests on: spec/risks-and-blockers.md §2

## 2026-11-20 · Option B falls back to Microsoft Forms if IT has not approved Freshdesk by 24 Nov
- Decided by: Claude, default
- Why: The trial week holds without waiting on IT. Microsoft Forms and SharePoint need no new approval; Notion is already Sterling's workspace.
- Rejected: Delaying the trial until IT answers.
- Rests on: Ernest, 2026-11-20 ("not sure" on IT approval); matt-message.md
- Superseded: 2026-11-23, Freshdesk dropped (below).

## 2026-11-20 · A custom form with a SharePoint queue is the third trial option
- Decided by: Ernest
- Why: A custom form gives photos without sign-in, Spanish, the QR property and the emergency screen together, and the SharePoint queue keeps worker data in Microsoft 365. Ernest maintains it.
- Rejected: Custom queue screens, because a SharePoint list covers the queue and takes a day.
- Rests on: Ernest, 2026-11-20

## 2026-11-20 · The trial moves to 7–9 Dec; pick on 10 Dec
- Decided by: Claude, default
- Why: Option C is about a week of building, done 30 Nov to 4 Dec; all three versions are tried in the same week so they are compared under the same conditions. This supersedes the 30 Nov to 2 Dec trial dates.
- Rejected: Trying A and B on 30 Nov and C a week later, because the comparison would span two different weeks.
- Rests on: trial-platform.md

## 2026-11-20 · On a close result, a version the coordinators can change wins over the custom form
- Decided by: Claude, default
- Why: The custom form has one maintainer; a form Tonya and Jordan can edit keeps working when Ernest is unavailable.
- Rejected: Picking on daily-pass time alone.
- Rests on: trial-platform.md (How the pick is made)

## 2026-11-20 · Tapping an emergency condition opens the call screen at once
- Decided by: Claude, default
- Why: A worker in an emergency gets the number in one tap; a checkbox followed by a continue button adds a step at the worst moment.
- Rejected: Checkboxes with a continue button (Notion draft, Screen 1).
- Rests on: spec/05-resident-intake.md §3

## 2026-11-20 · "No heat or AC at all" stays on the emergency list
- Decided by: Claude, default
- Why: Total loss of cooling in a Georgia or Florida summer, or of heat in a Tennessee winter, is a safety condition. AC that runs but cools poorly goes through the form under "Heating or air conditioning".
- Rejected: Removing it from the list, which sends a dangerous room into a daily review.
- Rests on: spec/05-resident-intake.md §3 ("in extreme weather"); Notion project page, Screen 1

## 2026-11-20 · Emergency words in the description bring back the call screen, with an option to continue
- Decided by: Claude, default
- Why: v1 has no immediate alerting, so a request sent at night sits until the next review. Stopping the worker before sending is the only point the form can redirect them.
- Rejected: Flagging after submission only (spec/05 A8), because v1 has no alert to send.
- Rests on: spec/05-resident-intake.md §3, §9 A8

## 2026-11-20 · The phone remembers property, room, name and cell for the next request
- Decided by: Claude, default
- Why: A returning worker skips screen 3 and confirms one line on screen 2, which keeps the form faster than a text. Stored on the phone only.
- Rejected: No memory (every request retyped); server-side profiles (needs sign-in).
- Rests on: context-plateau-maintenance.md (Users: faster than a text)

## 2026-11-20 · Times are required only when entry is not allowed
- Decided by: Claude, default
- Why: With entry allowed the property can come any time; with entry refused it cannot schedule without times.
- Rejected: Always required (slower for every worker); never required (the most common Needs Info cause).
- Rests on: spec/05-resident-intake.md §4.3

## 2026-11-20 · No automatic text or email at submission; no duplicate notice to the worker
- Decided by: Claude, default
- Why: v1 has no SMS service, and the coordinators merge duplicates in the daily review.
- Rejected: Confirmation by SMS (spec/05 A11) and "already reported" notice (spec/05 A9), until an SMS service and a queue lookup exist.
- Rests on: spec/v1-scope.md §5; spec/05-resident-intake.md §9

## 2026-11-20 · Unfinished requests are kept on the phone for 24 hours
- Decided by: Claude, default
- Why: Long enough to survive a phone call or a shift; short enough that a stale half-request does not reappear days later.
- Rejected: No save (an interrupted worker starts over); indefinite save.
- Rests on: journey-worker-form.md

## 2026-11-20 · Worker form wireframed at full-page phone fidelity, without an idea board
- Decided by: Claude, default
- Why: journey-worker-form.md fixes the mechanism for every screen; the open decisions are what goes where on each one.
- Rejected: An idea board of alternative mechanisms first.
- Rests on: journey-worker-form.md

## 2026-11-20 · The property picker is a full-height list with search and state headings
- Decided by: Claude, default
- Why: The phone's native dropdown has no search, no grouping and no "My place isn't listed" row.
- Rejected: Native select element.
- Rests on: wireframes-worker-form.html (Choose where you're staying)

## 2026-11-20 · A complete request that was never sent is kept on the phone for 7 days and never deleted without asking
- Decided by: Claude, default
- Why: A worker who tapped Send with no signal believes the request went in; deleting it silently loses the request.
- Rejected: The 24-hour limit used for unfinished requests.
- Rests on: states-worker-form.md

## 2026-11-20 · After three failed sends the form offers "Copy my request" for a text message
- Decided by: Claude, default
- Why: When the form cannot send, the worker still reaches a coordinator with a complete request instead of a bare "my AC is broken" text.
- Rejected: Showing only an error and Try again.
- Rests on: states-worker-form.md

## 2026-11-20 · 5 requests per phone per hour
- Decided by: Claude, default
- Why: A public form with no sign-in needs a limit; five covers a worker reporting several problems in one room.
- Rejected: CAPTCHA, because it slows every worker and fails for some.
- Rests on: spec/05-resident-intake.md §8 (abuse controls)

## 2026-11-20 · Spanish copy uses usted
- Decided by: Claude, default
- Why: Workers range in age and the form speaks for Plateau to adults it has not met; usted is the safe default in US workplace Spanish.
- Rejected: tú, which reads as closer but can read as disrespectful to older workers.
- Rests on: copy-worker-form.md (Voice and Tone Framework)

## 2026-11-20 · "Request" is the worker's word; "property" is not shown to workers
- Decided by: Claude, default
- Why: Workers say "the hotel" or "the apartments"; "property", "ticket" and "unit" are coordinator and property-manager words.
- Rejected: ticket, work order, unit, property.
- Rests on: copy-worker-form.md (Terminology); Notion project page, the form question by question

## 2026-11-20 · The problem-type label reads "Type of problem", not "What's the problem?"
- Decided by: Claude, default
- Why: The screen title already asks "What's wrong?"; repeating the question as a label adds nothing.
- Rejected: The Notion draft label.
- Rests on: copy-worker-form.md Q1, Q2

## 2026-11-20 · Answer pills and checkbox rows are 48 px tall on the worker form
- Decided by: Claude, default
- Why: Workers tap with gloves, wet hands or in a truck; 48 px is the larger of the iOS and Android minimums.
- Rejected: The wireframe kit's 32 px chips, which pass WCAG 2.2 AA at 24 px but are easy to miss.
- Rests on: accessibility-worker-form.md (Operable)

## 2026-11-20 · Single answers are native radio buttons styled as pills
- Decided by: Claude, default
- Why: Native radios in a fieldset give screen readers the question, the choices and the selected one with no custom ARIA.
- Rejected: Buttons with aria-pressed, which announce as toggle buttons and lose the group question.
- Rests on: accessibility-worker-form.md (Robust)

## 2026-11-20 · Ethical review of the worker form before the build
- Decided by: Claude, default; design approved by Ernest, 2026-11-20
- Why: The form is public, collects contact details, and sits on an emergency path, so defaults, asymmetric buttons and data handling were checked screen by screen.
- Rejected: Nothing blocks the build. How each pattern that could apply is handled:
- No answer is preselected. The selected pills and checkboxes in the wireframes show example answers; every question starts empty in the build.
- Asymmetric buttons favor the worker: "Delete it" and "Start over" are quieter than "Send now" and "Continue" because the quiet choice loses a request; both are labelled plainly and one tap away, with no guilt wording. "None of these — report a problem" sits below the emergency list so the list is read first; it is a full-width button, not hidden.
- The emergency check refuses to submit after a tapped emergency, and offers "Not an emergency — go back". The keyword check quotes the matched words and lets the worker continue. Neither hides the form from a worker whose problem is not an emergency.
- Data is the minimum to route a repair. Job site is optional. Remembered details stay on the phone; on a shared foreman phone they show the last worker's name and cell to the foreman, who submitted them. Worker name, cell and room go to the property in the forward, and nothing else about the worker.
- No reminders, streaks, badges or nudges. Texts to the worker report status only.
- The rate limit tells the worker the limit and gives a number to call, so a blocked worker is never left without a way to report.
- The possible-emergency check is a fixed word list, shown to the worker, with no hidden scoring.
- Rests on: journey-worker-form.md; wireframes-worker-form.html; states-worker-form.md; copy-worker-form.md; context-plateau-maintenance.md (Ethical stance)

## 2026-11-20 · Apartments only; Plateau holds each lease
- Decided by: Ernest
- Why: Plateau houses crews only in apartments it rents in its own name, so the leasing office treats Plateau as the tenant and takes maintenance requests from Plateau. Every "room" and "hotel" path in the form, copy and trial is removed.
- Rejected: The hotel and extended-stay paths (room numbers, front desks, hotel Wi-Fi).
- Rests on: Ernest, 2026-11-20

## 2026-11-20 · The Notion version leaves the platform trial
- Decided by: Ernest
- Why: Ernest wants the form built from scratch, visible and shareable; the trial compares the Freshdesk version (or Microsoft Forms) with the Plateau form.
- Rejected: A Notion form and queue as a trial option.
- Rests on: Ernest, 2026-11-20; trial-platform.md
- Superseded in part: 2026-11-23, Freshdesk dropped (below); the trial now tries the Plateau form alone.

## 2026-11-23 · The Plateau form runs on Azure Static Web Apps with a Functions API that writes to SharePoint through Microsoft Graph
- Decided by: Claude, default (for Ernest to confirm)
- Why: One Azure resource hosts both the static form and its API, the Free plan covers the trial, and the API reaches only the one housing site, because the app registration holds Graph `Sites.Selected` with write on that site alone. No packages besides `@azure/functions`, so there is nothing else to patch.
- Rejected: Power Automate's HTTP trigger as the form's endpoint, because it is a premium connector and its URL is a bearer secret in a public page; Power Pages, as in the platform decision above; a database outside Microsoft 365, because the queue has to be the SharePoint list.
- Rests on: trial-platform.md; handoff/README.md "Left to the builder"

## 2026-11-23 · Request numbers come from the SharePoint item ID
- Decided by: Claude, default
- Why: HR-(1000 + item ID) is unique and goes up on its own, with no counter to keep in step. The number is shown only after the server has saved the request, as states-worker-form.md requires.
- Rejected: Numbers made on the phone, because two phones can make the same one; a counter list, because two requests at once can read the same value.
- Rests on: states-worker-form.md (Every screen)

## 2026-11-23 · Photos upload while the worker fills in the form, into a folder named by the request's ID on the phone
- Decided by: Claude, default
- Why: Uploading during screen 4 is what lets the copy say "You can keep going". The form makes the request's ID when it opens, so photos have somewhere to go before the request exists, and sending twice cannot make a second request. The phone shrinks each photo to 1600 px before sending it, so a photo uploads on one bar of signal.
- Rejected: Sending photos with the request, because one slow photo would hold up the whole request; list-item attachments, because Graph cannot write them.
- Rests on: states-worker-form.md (4. What's wrong; Same request sent twice)

## 2026-11-23 · A photo the worker removes before sending is deleted; after sending it is kept
- Decided by: Claude, default
- Why: A photo removed by mistake, or one showing something private, must not reach the leasing office. Once a request is in, a coordinator may already have forwarded it, so the record stays as it was sent.
- Rejected: Keeping every uploaded photo.
- Rests on: context-plateau-maintenance.md (ethical stance)

## 2026-11-23 · Forward sends email only; phone and portal properties get the details mailed to the coordinator
- Decided by: Claude, default
- Why: Email is the one method a flow can complete on its own. For a phone or portal property, Forward mails the coordinator who pressed it the details to read out or paste, and leaves the status alone, because nothing has reached the property yet.
- Rejected: Marking phone and portal requests as sent automatically, because a request marked sent that never reached the property is the failure Days Since Sent exists to catch.
- Rests on: spec/v1-scope.md §5 (templates); app/sharepoint/forward-flow.md

## 2026-11-23 · The property handles emergencies, so the emergency screen shows that property's after-hours number
- Decided by: Matt (emergencies go to the property); Ernest (approved the change); Claude, default (how the screen shows it)
- Why: Matt: no heat or AC, no water, flooding, gas, smoke, power, lockouts and break-ins are handled by the property. A single Plateau 24-hour line was never confirmed and would only relay the call. The number now comes from each property's After-Hours Phone in the Properties list. When the property is known (QR code, or the phone's last request) the call button shows it at once, even with no signal, from the list saved on the phone. When it is not known, one tap on "Choose where you're staying" shows it. Plateau housing's number is shown under it as the fallback. "Someone answers 24 hours a day" is gone, because Plateau cannot promise that for a leasing office.
- Rejected: Keeping one Plateau emergency number; making the worker pick a property before seeing any number, because the emergency screen must never wait.
- Rests on: Matt's written answers, 2026-11-23 (Notion, Matt — Requirements Call)

## 2026-11-23 · Job site is required; supervisor is an optional field; employee number is not asked yet
- Decided by: Matt (job site and supervisor as main data points); Ernest (approved); Claude, default (supervisor optional, employee number held back)
- Why: Matt wants job site and supervisor for escalations. Supervisor is optional, because a worker who doesn't know who to name should still be able to send. Employee number waits for Matt to confirm workers know it without looking it up; every field a worker can't answer from memory is a reason to text instead.
- Rejected: Employee number as a required field before that is confirmed.
- Rests on: Matt's written answers, 2026-11-23; earlier "What the form deliberately does not ask" (Notion project page)

## 2026-11-23 · Virginia and Indiana are on the state list
- Decided by: Matt
- Why: Plateau also houses crews in Virginia and Indiana. The pilot itself runs in one state, at Montgomery, AL.
- Rests on: Matt's written answers, 2026-11-23

## 2026-11-23 · Sized for older field workers: 18px text, 56px tap targets, visible field borders
- Decided by: Ernest (asked for it); Claude, default (the sizes)
- Why: Many of the crew are older, read the phone in bright light, and tap with big or gloved fingers.
  - Body text is 18px; hints and errors are 16 to 17px.
  - Buttons, answer pills and list rows are 56px tall; checkboxes are 30px; the remove-photo button is 44px.
  - Field and pill borders are 2px at 4.9:1 contrast, so boxes show in sunlight.
  - A segment bar sits above "Step 2 of 4", and the back arrow says "Back".
  - On narrow phones the header title hides while Back shows, rather than wrapping.
  - The "Copied" message stays 5 seconds.
- Replaces: "Answer pills and checkbox rows are 48 px tall on the worker form" (2026-11-20).
- Considered: the iOS libraries in cjwirth/awesome-ios-ui. All 77 are Swift or Objective-C, so none can run in this web form. Their useful patterns (a slide-up picker, labels that stay visible, a sending indicator, a big confirmation) were already in the form.
- Rejected: Turning "Type of problem" into a list of 14 buttons. The phone's own picker already shows large rows; revisit if the dry run shows people struggling with it.
- Rests on: Ernest, 2026-11-23; accessibility-worker-form.md

## 2026-11-23 · A job-site look: slate header, hazard stripe, a yellow work-order tag, and motion
- Decided by: Ernest (asked for a more polished, fluid look for everyone in construction); Claude, default (the design)
- What changed:
  - A dark slate band holds the header, step bar and heading, edged with a hi-vis yellow and black hazard stripe. The step bar fills in yellow.
  - The request number sits on a safety-yellow tag styled like a work order. Dark text on yellow is about 11:1, readable in sun.
  - Screens slide in from the right going forward and from the left going back. The step segment fills, answer buttons press in, and the confirmation check pops.
  - Selected answers also show a ✓, so they don't rely on color alone.
- Kept: the 18px text, 56px tap targets and 4.9:1 field borders from the older-worker pass. Emergency red stays reserved for emergencies. Still no web fonts or images; the form is about 83 KB before photos.
- Motion is off when the phone asks for reduced motion. Animations release when they finish, so they never sit over the Next or Send button.
- Fixed on the way: the confirmation check had been drawn in emergency red since the first build. It is now the accent blue.
- Rests on: Ernest, 2026-11-23

## 2026-11-23 · No Freshdesk: the Plateau form on Microsoft 365 is the platform
- Decided by: Ernest
- Why: Ernest: "We're not doing Freshdesk." The Plateau form is built and passed a desk run. It keeps worker names, cell numbers and apartment numbers inside Sterling's Microsoft 365, and Matt was not familiar with Freshdesk and asked for simplicity. The queue is the SharePoint Requests list, the routing data is the SharePoint Properties list, and Forward is a Power Automate flow sending from housing@.
- Changes: the 7 to 9 Dec trial tries the Plateau form alone and decides whether it is ready for the January pilot (trial-platform.md). If IT has not approved the Azure app and SharePoint access by 4 Dec, the week runs on the dry-run setup (app/DRY-RUN.md) and the queue steps wait.
- Reverse if: IT will not host the form in Azure or give the app registration access to a SharePoint site. Then the fallback is Microsoft Forms with a SharePoint list, which loses photos without sign-in.
- Supersedes: "The platform is picked by a one-week trial of Notion and Freshdesk" and "Option B falls back to Microsoft Forms if IT has not approved Freshdesk by 24 Nov" (2026-11-20).
- Rests on: Ernest, 2026-11-23; Matt's written answers, 2026-11-23

## 2026-11-24 · Repeats are detected automatically and are the follow-up trigger
- Decided by: the demo meeting, 2026-11-24 (follow up only when a request is submitted two or three times); Claude, default (how a repeat is detected)
- Why: Coordinators do not chase properties on a timer. A repeat report is the signal, so the queue has to show repeats without anyone spotting them by eye.
- How it works:
  - A new request repeats an open one (New, Needs Info or Sent to Property) when the place, the apartment and the kind of problem match. The kind of problem is the category code, so a leak and a toilet are both plumbing.
  - Apartments are compared loosely: "Apt 214", "#214" and "214" match.
  - The new request gets *Repeat Of*. The original gets *Times Reported Again*, *Last Reported Again* and a line in its activity log.
  - View **2a Follow up (reported again)** lists the originals, most-repeated first.
  - There is no age limit while the original is open. A closed, fixed or duplicate original does not count, so a new problem in the same place starts fresh.
  - A failed lookup never blocks a request.
- Rejected: Matching on the exact problem label, because two workers often pick different plumbing labels for the same leak. A 7-day window, because a property that ignores a request for weeks is exactly the case to catch.
- Rests on: Demo meeting notes, 2026-11-24 (Notion)
