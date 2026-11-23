# Worker maintenance request form: accessibility

## Accessibility Audit — Per WCAG Principle

### Perceivable

**Medium.** Photo thumbnails on screen 4 have no text alternative, so a screen reader user cannot tell how many photos are attached or which one a Remove control removes. Fails 1.1.1 Non-text Content. Change: each thumbnail image has `alt="Photo 1"`, `"Photo 2"` … in the form's language ("Foto 1"), and its remove button's accessible name is copy Q16 followed by the number ("Remove photo 1"). Test: with VoiceOver on iOS, swipe through the photo row with two photos attached; it reads "Photo 1, image, Remove photo 1, button, Photo 2, image, Remove photo 2, button, Add photo, button".

**Medium.** Name and cell fields do not declare their purpose, so the phone cannot offer autofill and a worker with a motor impairment types both on every new phone. Fails 1.3.5 Identify Input Purpose. Change: `autocomplete="name"` on the name field and `autocomplete="tel-national"` with `type="tel"` on the cell field. Test: on an iPhone and an Android phone with a saved contact card, tapping the name field offers the owner's name and the cell field offers the owner's number.

**Low.** The step count and the field hints are 11 px text, which is hard to read in sunlight and for older workers, and the cell hint and description hint carry reasons that change the answer. Change: step count (copy G5) and every field hint at 13 px, minimum, in the ink color that passes 4.7:1 on the screen background. Test: at the phone's default text size, the hint "A sentence is fine." measures 13 px or larger in the browser's inspector.

Keep: field errors use a red border, an alert glyph and a sentence; none relies on color alone.
Keep: the emergency number is in the Call button's visible label as text (states-worker-form.md, Phone or device can't place calls).

### Operable

**High.** The pill buttons for single answers (where in your apartment, how long, getting worse, entry, pets) are 32 px tall, and the "When are you usually there?" checkbox rows are 32 px tall with a 20 px box. A worker in work gloves or with a hand tremor misses them and selects the neighbor. Fails nothing at WCAG 2.2 AA (24 px minimum); falls short of 2.5.5 Target Size (Enhanced). Change: pill buttons 48 px tall with 8 px between them; each checkbox row 48 px tall with the whole row, box and words, as the tap target. Test: in the browser inspector at 390 px width, every pill and every checkbox row measures 48 px tall or more, and tapping the words of a checkbox row checks it.

**Medium.** The Back button and the language switch in the top bar are 32 px targets, and "Not an emergency — go back" is a text link one line tall. A worker reaching with a thumb hits the wrong control or misses the link. Change: Back and the language switch each have a 48 × 48 px tap area (the visible label can stay smaller); the "go back" link's tap area spans the screen width and is 48 px tall. Test: inspector shows each tap area at 48 px or more in both dimensions.

**Medium.** The property picker and the two prompts on opening (resume and unsent request) are overlays. Without focus handling, a keyboard or switch user can tab behind them into the hidden form. Fails 2.4.3 Focus Order. Change: each is a modal dialog that keeps focus inside it while open and closes with Escape; focus targets are in the Keyboard Navigation Map. Test: with a Bluetooth keyboard on an iPad, open the picker and press Tab twenty times; focus never leaves the picker. Escape closes it.

Keep: emergency condition rows are full width and 48 px tall.
Keep: no session timeout anywhere in the form; unfinished requests are kept for 24 hours and unsent ones for 7 days.
Keep: every screen works with the phone's back gesture and keeps the answers.

### Understandable

**Medium.** Switching to Spanish changes the words but not the page language, so VoiceOver and TalkBack read the Spanish with English pronunciation and the Spanish speaker hears it garbled. The "Español" switch itself is read in English. Fails 3.1.1 Language of Page and 3.1.2 Language of Parts. Change: the switch sets `lang="es"` or `lang="en"` on the `html` element; the switch's own label carries `lang="es"` when it reads "Español" and `lang="en"` when it reads "English". Test: with VoiceOver set to English, switch the form to Spanish; the title "Solicitud de mantenimiento" is read with a Spanish voice.

**Medium.** Errors appear under fields only after Next or Send is tapped. A screen reader user hears nothing and does not know the screen did not move on. Fails 3.3.1 Error Identification as heard. Change: on Next or Send with errors, focus moves to the first invalid field, and each error is linked to its field with `aria-describedby` and the field marked `aria-invalid="true"`; focus target in the Keyboard Navigation Map. Test: with TalkBack, tap Next on screen 3 with the cell field empty; TalkBack reads "Your cell number, edit text, invalid entry, Enter your cell number."

Keep: one question per line, the step count on every form screen (copy G5), and Next in the same place at the bottom of every screen.
Keep: required fields are unmarked and the few optional ones say "(optional)" in the label.

### Robust

**High.** The pill buttons are plain buttons with a visual selected state. A screen reader announces "Bedroom, button" with no group name and no selected state, so a blind worker cannot tell which answer is chosen or what the question was. Fails 4.1.2 Name, Role, Value and 1.3.1 Info and Relationships. Change: each single-answer question is a `fieldset` whose `legend` is the question (copy Q5, Q10, Q12, A2, A6), containing native `input type="radio"` elements styled as pills; "When are you usually there?" is a `fieldset` with `legend` (copy A4) and native checkboxes. Test: with VoiceOver, swipe to "Bedroom"; it reads "Bedroom, radio button, selected, 3 of 7, Where in your apartment?".

**Medium.** The property control on screen 2 looks like a dropdown but opens a full-screen list. Without a role and value, a screen reader user hears "button" and does not know what is chosen or that a list will open. Fails 4.1.2. Change: a `button` whose accessible name is the label plus the current value ("Apartments, Magnolia Pointe Apartments" or "Apartments, Choose where you're staying"), with `aria-haspopup="dialog"`. The picker is `role="dialog"` with `aria-modal="true"`, labelled by its title (copy P1); its search field has a programmatic label equal to copy P2, not only the placeholder. Test: VoiceOver reads the control as "Apartments, Choose where you're staying, button, opens dialog".

**Medium.** Each screen replaces the last without a page load, so the browser tab title and the page heading structure do not change. Fails 2.4.2 Page Titled. Change: each screen has one `h1` (its title: copy E1, W1, H1, Q1, A1, C1, K1, X1) inside one `main` landmark, the top bar is a `header`, and the document title updates to "{screen title} — {copy G1}", with the step count first on form screens: "Step 2 of 4: Who should they contact? — Maintenance request". Test: after each Next, the iOS app switcher shows the new title; VoiceOver's rotor lists one heading.

Keep: the emergency rows, Call and every action are native `button` or `a` elements; the chevrons and alert glyphs are decorative and hidden from assistive technology (`aria-hidden="true"`).

## Screen Reader Flow Documentation

| Change | What is announced | How |
|---|---|---|
| Errors after Next or Send | The first invalid field's label, "invalid entry", and its error | Focus move to the field; error read as its description. No live region |
| Signal drops while filling in | Copy G6 | Polite |
| Signal returns and the form retries | Copy G8 | Polite |
| Send fails: no signal, server, captive Wi-Fi | Copy G7 or G9 | Assertive (`role="alert"`) |
| Send fails a third time | Copy G10 | Assertive |
| Request copied | Copy G12 | Polite |
| Rate limit reached | Copy G15 | Assertive |
| Language switched | Copy G16, in the new language | Polite |
| Photo uploading, uploaded, failed | Copy Q17, then "Photo {n} uploaded" / "Foto {n} subida" (copy Q24), or copy Q18 | Polite |
| Fifth photo added | Copy Q19 | Polite |
| Description length | Copy Q21 at 1,800, 1,900 and 2,000 characters only | Polite |
| Sending with photos; sending past 10 seconds | Copy S2; copy S3 | Polite |
| Sent without some photos | Copy C10 | Polite |
| Search in the picker finds nothing | Copy P5 | Polite |

## Keyboard Navigation Map

| Moment | Focus goes to | Returns to |
|---|---|---|
| A new screen opens (Next, Back, Report another problem) | The screen's `h1` (`tabindex="-1"`) | — |
| An emergency condition is tapped | Call screen `h1` (copy K1) | "Not an emergency — go back" returns focus to the tapped condition's row on screen 1 |
| Possible emergency screen opens | Its `h1` (copy X1) | "It's not an emergency — continue" opens screen 5 with focus on its `h1` |
| Resume or unsent-request prompt opens on load | The prompt's title (`tabindex="-1"`) | Continue or Send now: the screen it opens, at its `h1`. Start over, Delete it, or Escape: screen 1 `h1`. Escape on the unsent prompt keeps the request, and the prompt appears on the next visit |
| Property control opens the picker | The picker's search field | Choosing a place or Close or Escape: the property control, which now reads its value |
| "My place isn't listed" | That screen's `h1` | Next: the apartment number field on screen 2 |
| Next or Send with errors | The first invalid field | — |
| Send succeeds | Confirmation `h1` (copy C1) | — |
| Send fails | Stays on Send request | — |
| A photo is removed | The next photo's remove button, or Add photo when none is left | — |
| Language switched | Stays on the switch | — |
