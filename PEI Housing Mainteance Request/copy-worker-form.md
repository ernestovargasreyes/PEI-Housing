# Worker maintenance request form: English and Spanish copy

## Voice and Tone Framework

| Principle | It is | It is not | Do | Don't |
|---|---|---|---|---|
| Plain | Short words a foreman would use on site; one idea per sentence | Childish, or written in property-management terms | "Can maintenance come in if you're not there?" | "Do you authorize entry in your absence?" |
| Honest about what happens next | Says who does what and when, and only what Plateau controls | A promise the property has to keep | "Tonya or Jordan sends this to Magnolia Pointe Apartments on Monday." | "We'll get this fixed for you soon!" |
| Calm in an emergency | An instruction and a number, in that order | Alarm, exclamation marks, or reassurance in place of the instruction | "Call us now — don't use this form." | "Uh oh! This sounds serious!" |
| Respectful | *Usted* in Spanish; no blame in errors; the worker's own words quoted back | Formal or bureaucratic in either language | "That's 9 digits. A cell number has 10." | "Invalid phone number." |

| Context | Tone | Example |
|---|---|---|
| Questions on the form | Plain, one line, no explanation unless the reason changes the answer | "Any pets in the apartment?" |
| Field errors | Says what is needed, never what was wrong with the person | "Pick at least one time you're usually there." |
| Emergencies | Instruction first, then the number, then the reason | "Call us now — don't use this form." |
| Failed sends | States that it did not send, that nothing is lost, and the next step | "Not sent yet — no signal. Your answers are saved on this phone." |
| Confirmation | Brief; the number, who acts next, and when | "Got it. Your request is in." |
| Texts from the coordinators | First name, informal, signed by the coordinator | "Hi Luis — Plateau housing. Your heating or air conditioning request (HR-1042) is with Magnolia Pointe Apartments now." |

## Terminology

| Term (English / Spanish) | What it means to the worker | Not |
|---|---|---|
| request / solicitud | What the worker sends about one problem | ticket, work order, case, *reporte*, *ticket* |
| request number / número de solicitud | The code on the confirmation, such as HR-1042 | ticket ID, reference, confirmation code |
| where you're staying / dónde se queda | The apartments Plateau rents for the worker | property, location, site, *propiedad* |
| apartment number / número de apartamento | The number on the worker's door, such as 214 or B12 | unit, room, *cuarto*, *habitación* |
| apartment / apartamento | An apartment unit | unit, *departamento* |
| maintenance / mantenimiento | The property's staff who come to fix it | vendor, technician, contractor |
| housing number / número de la oficina de vivienda | The coordinators' line for non-emergencies | office line, support |
| emergency number / número de emergencia | The 24-hour line on the call screen | hotline, after-hours line |
| job site / obra | Where the worker is working | project, job number |

## Copy Deck

Placeholders in braces come from the request or the property list. **Data** marks a string built from those values; **Wraps** marks a Spanish string long enough to wrap where the English does not, which the layout allows. Plural strings have one form for 1 and one for more.

### Every screen

| ID | Where | English | Spanish | Notes |
|---|---|---|---|---|
| G1 | Top bar title | Maintenance request | Solicitud de mantenimiento | Wraps |
| G2 | Language switch | Español (shown in English) | English (shown in Spanish) | |
| G3 | Back button label | Back | Atrás | |
| G4 | Next button | Next | Siguiente | |
| G5 | Step count | Step {n} of {total} | Paso {n} de {total} | Data |
| G6 | Signal drops while filling in | No signal. Your answers are saved. | Sin señal. Sus respuestas están guardadas. | |
| G7 | Send fails: no signal | Not sent yet — no signal. Your answers are saved on this phone. | Todavía no se envió — no hay señal. Sus respuestas están guardadas en este teléfono. | Wraps |
| G8 | Signal returns, retrying | Sending now… | Enviando… | |
| G9 | Send fails: server or Wi-Fi sign-in page | Not sent yet. Try again in a minute. On public Wi-Fi? Switch to cell data, or open any web page to sign in to the Wi-Fi. | Todavía no se envió. Intente de nuevo en un minuto. ¿Está en un Wi-Fi público? Cambie a datos del celular o abra cualquier página web para conectarse al Wi-Fi. | Wraps |
| G10 | Send fails a third time | Still not sending. Copy your request and text it to {housing_number}. | Sigue sin enviarse. Copie su solicitud y mándela por mensaje de texto al {housing_number}. | Data |
| G11 | Button after the third failure | Copy my request | Copiar mi solicitud | |
| G12 | After copying | Copied. Paste it into a text. | Copiado. Péguelo en un mensaje de texto. | |
| G13 | The copied text | Maintenance request: {property}, apartment {apartment}. {category}: {description} Started: {how_long}. Getting worse: {worse}. OK to enter: {entry}. Usually there: {times}. Pets: {pets}. {name}, {cell}. | Solicitud de mantenimiento: {property}, apartamento {apartment}. {category}: {description} Empezó: {how_long}. Empeorando: {worse}. Pueden entrar: {entry}. Suele estar: {times}. Mascotas: {pets}. {name}, {cell}. | Data; answers in the form's language |
| G14 | Retry button | Try again | Intentar de nuevo | |
| G15 | Rate limit reached | You've sent 5 requests in the last hour. If something else is wrong, call {housing_number}. | Ya envió 5 solicitudes en la última hora. Si hay otro problema, llame al {housing_number}. | Data |
| G16 | Announced after switching language | Form in English | Formulario en español | |

### Opening the link

| ID | Where | English | Spanish | Notes |
|---|---|---|---|---|
| R1 | Resume prompt title | Pick up where you left off? | ¿Quiere seguir donde se quedó? | |
| R2 | Resume prompt body | You started a request at {time}: {category}, apartment {apartment}, {property}. | Empezó una solicitud a las {time}: {category}, apartamento {apartment}, {property}. | Data; time as "6:40 pm" / "6:40 p. m." |
| R3 | Photos lost while away | 1 photo didn't finish uploading. Add it again on the problem screen. / {count} photos didn't finish uploading. Add them again on the problem screen. | 1 foto no terminó de subirse. Agréguela de nuevo en la pantalla del problema. / {count} fotos no terminaron de subirse. Agréguelas de nuevo en la pantalla del problema. | Data; plural |
| R4 | Property removed while away | {property} isn't on our list anymore. You'll choose where you're staying again. | {property} ya no está en nuestra lista. Tendrá que elegir de nuevo dónde se queda. | Data |
| R5 | Resume button | Continue | Continuar | |
| R6 | Resume button | Start over | Empezar de nuevo | |
| U1 | Unsent request title | Your request from {time} wasn't sent | Su solicitud de las {time} no se envió | Data; "{day} at {time}" / "el {day} a las {time}" when not today |
| U2 | Unsent request body | {category}, apartment {apartment}, {property}. | {category}, apartamento {apartment}, {property}. | Data |
| U3 | Unsent request button | Send now | Enviar ahora | |
| U4 | Unsent request button | Delete it | Borrarla | |

### 1. Emergency check and call screen

| ID | Where | English | Spanish | Notes |
|---|---|---|---|---|
| E1 | Title | First — is this an emergency? | Primero: ¿es una emergencia? | |
| E2 | Instruction | Tap anything that's happening right now. | Toque lo que esté pasando ahora mismo. | |
| E3 | Condition | No heat or AC at all | La calefacción o el aire acondicionado no funcionan para nada | Wraps |
| E4 | Condition | No water | No hay agua | |
| E5 | Condition | Water leaking or flooding right now | Hay una fuga de agua o una inundación ahora mismo | Wraps |
| E6 | Condition | I smell gas | Huele a gas | |
| E7 | Condition | Smoke or fire | Hay humo o fuego | |
| E8 | Condition | No electricity | No hay electricidad | |
| E9 | Condition | I'm locked out | Me quedé afuera y no puedo entrar | |
| E10 | Condition | Someone broke in, or a door or window won't lock | Alguien entró a la fuerza, o una puerta o ventana no cierra con llave | Wraps |
| E11 | Button | None of these — report a problem | Nada de esto — reportar un problema | Wraps |
| K1 | Call screen title | Call your leasing office now — don't use this form | Llame ahora a su oficina de alquiler — no use este formulario | Changed 2026-11-23: the property handles emergencies |
| K2 | What was tapped | You tapped: {condition} | Usted tocó: {condition} | Data |
| K3 | Call button | Call {emergency_number} | Llamar al {emergency_number} | Data; {emergency_number} is the property's After-Hours Phone |
| K3a | Above K3 | Emergency line for {property}: | Línea de emergencia de {property}: | Data |
| K3b | No property chosen yet, or no After-Hours Phone on file | Call your leasing office's emergency line. | Llame a la línea de emergencia de su oficina de alquiler. | |
| K3c | Button under K3b, when no property is chosen | Choose where you're staying to see the number | Elija dónde se queda para ver el número | Wraps; opens the property list |
| K3d | Under K3 or K3b | Can't reach them? Call Plateau housing: {housing_number} | ¿No le contestan? Llame a vivienda de Plateau: {housing_number} | Data; the number is a link |
| K4 | Reason | Your leasing office handles emergencies, day or night. This form is only checked during the day, so an emergency sent here could wait all night. | Su oficina de alquiler atiende las emergencias, de día o de noche. Este formulario solo se revisa de día, así que una emergencia enviada aquí podría esperar toda la noche. | Wraps |
| K5 | Safety line, gas only | If you smell gas, leave the apartment first, then call. | Si huele a gas, primero salga del apartamento y luego llame. | Shown above the call button |
| K6 | Link | Not an emergency — go back | No es una emergencia — regresar | |

### 2. Where are you

| ID | Where | English | Spanish | Notes |
|---|---|---|---|---|
| W1 | Title | Where are you staying? | ¿Dónde se está quedando? | |
| W2 | Property label | Apartments | Apartamentos | |
| W3 | Property control, empty | Choose where you're staying | Elija dónde se queda | |
| W4 | Apartment number label | Apartment number | Número de apartamento | |
| W5 | Apartment number placeholder | For example 214 or B12 | Por ejemplo 214 o B12 | |
| W6 | Change button | Change | Cambiar | |
| W7 | QR code for a property not on the list | This sign's place isn't on our list. Choose where you're staying. | El lugar de este letrero no está en nuestra lista. Elija dónde se queda. | |
| W8 | Property list fails; "My place isn't listed" | Name of your apartments · City (optional) | Nombre de sus apartamentos · Ciudad (opcional) | |
| W9 | Hint under W8 | Tonya or Jordan will find it on our list. | Tonya o Jordan lo buscarán en nuestra lista. | |
| W10 | Error: no property | Choose where you're staying. | Elija dónde se queda. | |
| W11 | Error: no apartment number | Enter your apartment number. | Escriba el número de su apartamento. | |
| W12 | Returning worker title | Is this still you? | ¿Sigue siendo usted? | |
| W13 | Returning worker card labels | Where · Name · Cell | Dónde · Nombre · Celular | |
| W14 | Under the card | Saved on this phone from your last request. | Guardado en este teléfono de su última solicitud. | |
| W15 | Last request | Last request: {request_number} · {category} · sent {date} | Última solicitud: {request_number} · {category} · enviada el {date} | Data; date as "Mon 23 Nov" / "lun 23 nov" |
| W16 | Returning worker button | Yes, that's me — next | Sí, soy yo — siguiente | |
| P1 | Picker title | Choose where you're staying | Elija dónde se queda | |
| P2 | Picker search placeholder | Search by name or city | Buscar por nombre o ciudad | |
| P3 | Picker state headings | Georgia · Florida · Alabama · Tennessee | Georgia · Florida · Alabama · Tennessee | |
| P4 | Picker last row | My place isn't listed | Mi lugar no está en la lista | |
| P5 | Search finds nothing | No places match "{query}". | Ningún lugar coincide con "{query}". | Data |
| P6 | Close button label | Close | Cerrar | |

### 3. Who are you

| ID | Where | English | Spanish | Notes |
|---|---|---|---|---|
| H1 | Title | Who should they contact? | ¿A quién deben contactar? | |
| H2 | Name label | Your name | Su nombre | |
| H3 | Cell label | Your cell number | Su número de celular | |
| H4 | Cell hint | So we can reach you, and so maintenance can call before they come in. | Para comunicarnos con usted y para que mantenimiento le llame antes de entrar. | Wraps |
| H5 | Job site label | What job site are you on? | ¿En qué obra está trabajando? | Required since 2026-11-23 |
| H9 | Supervisor label | Your supervisor or foreman (optional) | Su supervisor o capataz (opcional) | Added 2026-11-23 |
| H10 | Error: no job site | Enter your job site. | Escriba en qué obra trabaja. | |
| H6 | Error: no name | Enter your name. | Escriba su nombre. | |
| H7 | Error: no cell | Enter your cell number. | Escriba su número de celular. | |
| H8 | Error: wrong length | That's {count} digits. A cell number has 10. | Son {count} dígitos. Un número de celular tiene 10. | Data |

### 4. What's wrong

| ID | Where | English | Spanish | Notes |
|---|---|---|---|---|
| Q1 | Title | What's wrong? | ¿Cuál es el problema? | |
| Q2 | Problem type label | Type of problem | Tipo de problema | |
| Q3 | Problem type, empty | Pick the closest one | Elija el más parecido | |
| Q4 | Problem types | Water leak, drip, or flooding · Toilet, sink, shower, or drain · No hot water · Heating or air conditioning · Lights, outlets, or power · Fridge, stove, washer, or dryer · Door, lock, key, or garage · Bugs, mice, or other pests · Internet, cable, or TV · Damage to walls, floors, or ceiling · Cleaning or trash · Yard, grounds, or snow · Furniture or household items · Something else | Fuga de agua, goteo o inundación · Inodoro, lavabo, ducha o desagüe · No hay agua caliente · Calefacción o aire acondicionado · Luces, enchufes o electricidad · Refrigerador, estufa, lavadora o secadora · Puerta, cerradura, llave o garaje · Insectos, ratones u otras plagas · Internet, cable o TV · Daños en paredes, pisos o techo · Limpieza o basura · Jardín, áreas exteriores o nieve · Muebles o artículos de la casa · Otra cosa | Wraps |
| Q5 | Where label | Where in your apartment? | ¿En qué parte de su apartamento? | |
| Q6 | Where options | Kitchen · Bathroom · Bedroom · Living area · Laundry · Outside · The whole place | Cocina · Baño · Dormitorio · Sala · Lavandería · Afuera · Todo el lugar | |
| Q7 | Description label | Tell us what's happening | Cuéntenos qué está pasando | |
| Q8 | Description placeholder | For example: AC blows warm air, started Tuesday. | Por ejemplo: el aire sale caliente, empezó el martes. | |
| Q9 | Description hint | A sentence is fine. | Con una oración basta. | |
| Q10 | How long label | How long has this been going on? | ¿Desde cuándo está pasando? | |
| Q11 | How long options | Started today · A few days · More than a week | Empezó hoy · Hace unos días · Hace más de una semana | |
| Q12 | Getting worse label | Is it getting worse? | ¿Está empeorando? | |
| Q13 | Getting worse options | Yes · No · Not sure | Sí · No · No sé | |
| Q14 | Photos label | Photos — they help a lot (up to 5) | Fotos — ayudan mucho (hasta 5) | |
| Q15 | Add photo button | Add photo | Agregar foto | |
| Q16 | Remove photo label | Remove photo | Quitar foto | |
| Q17 | Uploading | Uploading 1 photo. You can keep going. / Uploading {count} photos. You can keep going. | Subiendo 1 foto. Puede seguir. / Subiendo {count} fotos. Puede seguir. | Data; plural |
| Q18 | Upload failed | 1 photo didn't upload. Tap it to try again. / {count} photos didn't upload. Tap each one to try again. | 1 foto no se subió. Tóquela para intentar de nuevo. / {count} fotos no se subieron. Toque cada una para intentar de nuevo. | Data; plural |
| Q19 | Five photos added | You can add up to 5 photos. | Puede agregar hasta 5 fotos. | |
| Q20 | Error: no description | Tell us in a few words what's wrong. | Díganos en pocas palabras qué pasa. | |
| Q21 | Long description count | {used} of 2,000 | {used} de 2,000 | Data |
| Q22 | Error: no problem type | Pick the type of problem. | Elija el tipo de problema. | |
| Q23 | Error: one-tap question unanswered | Pick one. | Elija una opción. | |
| Q24 | Announced when a photo finishes uploading | Photo {n} uploaded | Foto {n} subida | Data |
| X1 | Possible emergency title | This might be an emergency | Esto podría ser una emergencia | |
| X2 | Possible emergency body | You wrote "{matched_words}". If that's happening now, call instead of sending this. | Usted escribió "{matched_words}". Si eso está pasando ahora, llame en vez de enviar esto. | Data; Wraps |
| X3 | Above the call button (K3) | Your leasing office handles emergencies, day or night. | Su oficina de alquiler atiende las emergencias, de día o de noche. | |
| X4 | Continue button | It's not an emergency — continue | No es una emergencia — continuar | Wraps |

### 5. Getting in and sending

| ID | Where | English | Spanish | Notes |
|---|---|---|---|---|
| A1 | Title | Getting in | Acceso | |
| A2 | Entry question | Can maintenance come in if you're not there? | ¿Puede entrar mantenimiento si usted no está? | |
| A3 | Entry options | Yes · No | Sí · No | |
| A4 | Times label | When are you usually there? Check all that work | ¿Cuándo suele estar? Marque todos los que le sirvan | Wraps |
| A5 | Times options | Weekday mornings · Weekday afternoons · Evenings · Weekends · Anytime is fine | Mañanas entre semana · Tardes entre semana · Noches · Fines de semana · A cualquier hora | |
| A6 | Pets label | Any pets in the apartment? | ¿Hay mascotas en el apartamento? | |
| A7 | Pets options | None · Dog · Cat · Other | Ninguna · Perro · Gato · Otra | |
| A8 | Other pet field label | What kind? | ¿Cuál? | |
| A9 | Anything else label | Anything else they should know? (optional) | ¿Algo más que deban saber? (opcional) | |
| A10 | Anything else placeholder | Gate code, where the water shutoff is, best door to use | Código del portón, dónde está la llave de paso del agua, qué puerta usar | Wraps |
| A11 | Error: entry unanswered | Pick yes or no. | Elija sí o no. | |
| A12 | Error: no times after "No" | Pick at least one time you're usually there. | Elija por lo menos un horario en que suele estar. | |
| S1 | Send button | Send request | Enviar solicitud | |
| S2 | Sending with photos | Sending 1 photo… / Sending {count} photos… | Enviando 1 foto… / Enviando {count} fotos… | Data; plural |
| S3 | Sending past 10 seconds | Still sending — keep this page open | Todavía enviando — no cierre esta página | Wraps |

### 6. Confirmation

| ID | Where | English | Spanish | Notes |
|---|---|---|---|---|
| C1 | Title | Got it. Your request is in. | Listo. Recibimos su solicitud. | |
| C2 | Number label | Your request number | Su número de solicitud | |
| C3 | Under the number | Take a screenshot to keep it. | Tome una captura de pantalla para guardarlo. | |
| C4 | Next steps heading | What happens next | Qué sigue | |
| C5 | Next steps | Tonya or Jordan sends this to {property} on {review_day}. | Tonya o Jordan se la enviará a {property} el {review_day}. | Data; day as "Monday" / "lunes" |
| C6 | Next steps | You'll get a text when it's sent, and again when they give a date. | Le mandaremos un mensaje de texto cuando se envíe y otra vez cuando den una fecha. | Wraps |
| C7 | Emergency callout title | If it turns into an emergency | Si se convierte en una emergencia | |
| C8 | Emergency callout text | Call your leasing office's emergency line: {emergency_number}. | Llame a la línea de emergencia de su oficina de alquiler: {emergency_number}. | Data; without a number: "Call your leasing office's emergency line." |
| C9 | Button | Report another problem | Reportar otro problema | |
| C10 | Sent without some photos | Your request is in, but 1 photo didn't arrive. / Your request is in, but {count} photos didn't arrive. | Recibimos su solicitud, pero 1 foto no llegó. / Recibimos su solicitud, pero {count} fotos no llegaron. | Data; plural |
| C11 | Button under C10 | Send photos again | Enviar las fotos de nuevo | |

### Texts from the coordinators

Sent by Tonya or Jordan in the language saved with the request, signed with the sender's first name.

| ID | When | English | Spanish | Notes |
|---|---|---|---|---|
| T1 | Sent to the property | Hi {name} — Plateau housing. Your {category} request ({request_number}) is with {property} now. We'll text you when they give a date. — {coordinator} | Hola {name}, le escribe la oficina de vivienda de Plateau. Su solicitud de {category} ({request_number}) ya está con {property}. Le avisamos por mensaje cuando den una fecha. — {coordinator} | Data |
| T2 | Date given | Hi {name} — maintenance is coming {day} for your {category} request ({request_number}). Reply here if nobody comes. — {coordinator} | Hola {name}, mantenimiento va a ir el {day} por su solicitud de {category} ({request_number}). Responda aquí si no llega nadie. — {coordinator} | Data |
| T3 | Checking it's fixed | Hi {name} — is the {category} problem fixed? Reply yes or no so we can close request {request_number}. — {coordinator} | Hola {name}, ¿ya se arregló el problema de {category}? Responda sí o no para cerrar la solicitud {request_number}. — {coordinator} | Data |
| T4 | Needs Info | Hi {name} — to send your request ({request_number}) to {property}, we need {missing}. Reply here with it. — {coordinator} | Hola {name}, para enviar su solicitud ({request_number}) a {property}, necesitamos {missing}. Respóndanos aquí con el dato. — {coordinator} | Data; {missing} as "your apartment number" / "el número de su apartamento", "a time you're usually there" / "un horario en que suele estar" |

## Open Questions

- Should every emergency condition get a safety line like K5, and who at Plateau writes and approves them?
