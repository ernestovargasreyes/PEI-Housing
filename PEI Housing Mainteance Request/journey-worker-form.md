# Worker maintenance request form

## Problem Statement

A crew member in Plateau-paid housing reports a maintenance problem from a phone, in under 90 seconds, without signing in. The flow starts when the worker opens the link: by scanning a property QR code, from a wallet card, or from a text sent by a coordinator or foreman. It ends in one of two places:

- **The confirmation screen** with a request number, for every problem that can wait for the daily review.
- **A phone call** to the emergency number, for anything that cannot.

Every question exists because its absence causes a callback. [context-plateau-maintenance.md; spec/v1-scope.md §5; spec/05-resident-intake.md §2]

## User Context & Variations

| Who or what | What changes in the flow |
|---|---|
| Opened from a property QR code | The property is filled in from the link and shown as a single line with a Change control. The worker only types the apartment number. |
| Opened from the plain link or a wallet card | The worker picks the property from a list grouped by state, with a search box. "My place isn't listed" opens a text field for the property name and city. |
| Link texted by a coordinator in reply to a text | The coordinator's link carries the property when the coordinator knows it, so the flow matches the QR entry. |
| Worker who has sent a request before | Property, apartment number, name and cell from the last request are saved on the phone and shown as one editable summary at the top of screen 2: apartment, property, name and cell, with one Change control. Screen 3 is skipped unless the worker taps Change. Under the card, the last request's number, problem and the day it was sent, so a worker who opened the link to check on a request sees it went in and does not send it again. Nothing is stored on the server for this. |
| Foreman submitting for a worker without a smartphone | No separate path. The foreman types the worker's name, apartment number and cell. If the foreman's phone has saved details, the summary shows them, so the foreman sees and replaces them. |
| Spanish speaker | The form opens in the phone's language when it is Spanish, and in English otherwise. An English / Español switch sits at the top of every screen and keeps all answers when tapped. The choice is saved with the request, so the coordinators text that worker in Spanish. |
| Evening, night or weekend | The confirmation names the day the request will be reviewed: the next weekday. Friday at 9pm reads "Monday". |
| Weak cellular signal | Photos are shrunk on the phone and upload in the background while the worker answers the next questions. No screen waits on a photo. |

## Screen-by-Screen Flow

The words on each screen are in the draft copy on the Notion project page, § The form, question by question. Loading, failed-send and offline states belong to the state inventory, which does not exist yet.

### Before screen 1: the link opens

The page loads with no sign-in and no splash screen. One prompt can come first, depending on what the phone holds:

- **A complete request that was never sent** (Send was tapped with no signal), from the last 7 days: the unsent-request prompt, with Send now and Delete it. Sending it skips the form and opens the confirmation. [states-worker-form.md, Every screen]
- **An unfinished request** from the last 24 hours: "Pick up where you left off?" with Continue and Start over. Continue opens the screen the worker left, so a worker who stopped to take a call does not retype anything. After 24 hours the unfinished request is deleted without asking.
- **Nothing:** screen 1.

### 1. Emergency check

Comes first because a worker with a gas smell must never be filling in a form. The screen lists the emergency conditions: no heat or AC at all, no water, water leaking or flooding now, gas smell, smoke or fire, no electricity, locked out, break-in or a door or window that will not lock.

- **Tapping any condition** replaces the form with the call screen at once. There is no checkbox and no second tap. The call screen shows the emergency number as a tap-to-call button and says the form is only checked during the day. A "Not an emergency — go back" link under the button returns to screen 1 for a worker who tapped by mistake.
- **"None of these — report a problem"** moves to screen 2.

Nothing is sent from the call screen, and the form keeps no record of it.

### 2. Where are you

Exists because a request without a property cannot be routed and a request without an apartment number is the most common callback. [Notion project page, § Screen 2]

- **Property:** already filled in from a QR link. Otherwise picked from the list. "My place isn't listed" sends the request with the typed name and city, and it arrives in the queue marked for the coordinators to match.
- **Apartment number:** required, a text keyboard because apartment numbers include letters, such as B12.
- **Next** checks both fields and moves to screen 3, or to screen 4 for a returning worker whose saved details were kept.

### 3. Who are you

Exists so the request has someone to follow up with and so the property can call before entering.

- **Name** and **cell number** are required. The cell number opens the phone keypad and accepts any US format. A number with fewer than 10 digits shows the problem when the worker taps Next, not while typing.
- **Job site** is optional.
- **Next** moves to screen 4.

### 4. What's wrong

The screen that tells the property what to bring.

- **What's the problem:** one pick from the plain-language list. "Something else" is allowed.
- **Where in your place:** one pick.
- **What's happening:** free text, required, at least a few words.
- **How long** and **getting worse:** one tap each.
- **Photos:** up to 5, opening the camera first, with the photo library one tap away. Not required. Each photo starts uploading as soon as it is added.

When the worker taps Next, the description is checked for emergency words: gas, smoke, fire, flood, sparks, no water, and their Spanish equivalents (gas, humo, fuego, inundación, chispas, sin agua). On a match, the emergency call screen appears with the number and a second button, "It's not an emergency — continue". Continuing keeps the request and marks it Possible emergency, which puts it at the top of the next daily review. No match moves to screen 5.

### 5. Getting in

The screen that saves the callback: entry permission, times and pets each force a phone call when missing. [spec/05-resident-intake.md §4.3]

- **Can maintenance come in if you're not there:** Yes or No, required.
- **When are you usually there:** required when the answer is No, because the property cannot schedule without it. Optional when the answer is Yes.
- **Pets:** required, one tap.
- **Anything else they should know:** optional.
- **Send request** submits. If photos are still uploading, the button shows their progress and sends when they finish. If a photo fails, the request is sent without it after 30 seconds, and the confirmation says which photos did not arrive, with a button to try them again.

### 6. Confirmation

Exists so the worker has proof the request arrived and a number to quote instead of texting "any update?".

- The request number in large type, the property, and what happens next: Tonya or Jordan sends it to the property on the named review day and texts the worker when it is sent.
- The emergency number again, for a problem that gets worse.
- **"Report another problem"** starts a new request at screen 1 with property, apartment number, name and cell filled in. A second problem in the same apartment is sent as its own request.

The confirmation is the only receipt. No text or email is sent automatically.

## Interaction Specifications

| Moment | What changes | Timing |
|---|---|---|
| Next or Back between screens | The new screen replaces the old one and the page scrolls to the top. Back keeps every answer. The phone's back gesture does the same as Back. | 150 ms slide; none when the phone is set to reduce motion |
| Tapping an emergency condition | The call screen replaces screen 1 | Immediate, no animation |
| Required field left empty or invalid | The field is marked and the problem is written under it; the screen scrolls to the first one | When Next is tapped, never while typing |
| Fixing a marked field | The message clears | As soon as the value is valid |
| Each answer | Saved on the phone | On every change |
| Photo added | Thumbnail appears with an upload ring; a failed upload shows a retry button on the thumbnail | Thumbnail at once; upload in the background |
| Send request | Button disabled, reads "Sending…"; answers stay on screen | After 30 seconds with no reply: "Not sent yet" with Try again; answers are kept |
| Language switch | All words change; answers stay | Immediate |
| Progress | "Step 1 of 4" on screen 2 through "Step 4 of 4" on screen 5; out of 3 when screen 3 is skipped | The emergency check and the confirmation are not counted |

## Multi-Channel Map

| Handoff | From → to | What passes |
|---|---|---|
| Sign, wallet card or coordinator's text → form | Paper or SMS → the worker's phone browser | The form link, with the property code when the source knows the property |
| Call screen → emergency line | Form → phone call | Nothing. The worker repeats the problem on the call |
| Form → queue | The worker's phone → the coordinators' queue | Every answer, the photos, the language, the Possible emergency mark, the time sent and how it arrived (form) |
| Queue → property | `housing@` email, phone or portal → the property's maintenance contact | Apartment number, problem, description, photos, the entry block, the worker's name and cell, the request number in the subject line |
| Queue → worker | Coordinator's text → the worker's phone | Request number, that it was sent, the scheduled day, the "is it fixed?" check, in the worker's language |

## Open Questions

- Which number do the coordinators text workers from? If it is their own cell phones, workers will reply there and the texts return as interruptions.
