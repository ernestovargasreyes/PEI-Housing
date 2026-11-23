# Plateau Excavation housing: maintenance request intake

## Users

**Crew members living in Plateau-paid housing.** Excavation crews on job sites across Georgia, Florida, Alabama and Tennessee, housed in apartments that Plateau rents in its own name and pays for. Plateau holds each lease, so the leasing office treats Plateau as the tenant and takes maintenance requests from Plateau, not from the worker. They report a problem today by calling or texting a coordinator, usually in the evening after a shift, from the truck or the room, not while standing at the broken thing. [spec/v1-scope.md §4, §7]

Conditions that change a design decision:

- **Phone in hand, little time, no login.** The form has to be faster than a text: under 90 seconds, no account, no app. [spec/v1-scope.md §7]
- **Not every worker has a smartphone with a camera and data.** A foreman submits for that worker and enters the worker's cell number. The form never asks whether the submitter is the person with the problem. [spec/risks-and-blockers.md §3]
- **Spanish is the first language for part of the crew.** The form is in English and Spanish at launch, the same as the sign and the wallet cards. [spec/risks-and-blockers.md §3]
- **Problems at 2am.** No heat or AC, no water, flooding, gas smell, smoke, no power, or a lockout cannot wait for a daily review. These go to a phone call. [spec/v1-scope.md §5]
- **Crews move between apartments and complexes.** The property can be pre-filled from a property QR code; the apartment number is always typed. [spec/v1-scope.md §4]
- **Foremen and superintendents decide what the crew uses.** A worker uses the link because the foreman said to. [spec/v1-scope.md §7]

**Housing coordinators: Tonya Reaves and Jordan.** Two people who route requests. They do no repairs. They take calls and texts at any hour, collect the details, and forward each request to the property that does the repair. The work they want back is the interruptions, not better tracking: "so we can just go in daily and get submitted to the correct location vs them calling and texting us constantly." [Tonya Reaves, 2026-11-20]

**Property maintenance contacts.** Apartment leasing offices, landlords and property managers. Because Plateau is the tenant on the lease, some offices take requests only from the coordinators. They are not users of the system. Each one takes requests in one way that works (email, phone, portal, front desk, text), and some of them stop responding. [spec/v1-scope.md §3]

## Product

Nothing is built. v1 is one form, reached by a plain link and by property QR codes, that puts each request into one queue. Tonya and Jordan work the queue once a day and forward each request to the property's maintenance contact. A request has one of four working statuses (New, Needs Info, Sent to Property, Fixed) plus Closed and Duplicate. The only automation is a one-click forward: it builds the message from the linked property row and marks the request Sent to Property. [spec/v1-scope.md §5]

The routing data is the Properties & Maintenance Contacts list, kept in Notion until the platform is picked. The platform is picked by the coordinators after a one-week trial of a Freshdesk version and a custom form with a SharePoint queue that Ernest builds and maintains. [trial-platform.md]

Maintenance requests only. Leases, turnovers, housing requests, cost tracking, SLA clocks and task templates are out of scope. [spec/v1-scope.md §6]

## Constraints

- **Timeline.** The form is about a week of build work. Pilot: one apartment complex, one crew, two weeks, with a one-week baseline count beforehand. A pilot over Thanksgiving and December would measure reduced crews. The baseline week runs now and the pilot starts in January unless Matt says the holiday weeks are representative. [spec/risks-and-blockers.md §2]
- **Routing data.** Nothing routes without the property and contact list, and only Tonya and Jordan have it. [spec/v1-scope.md §3]
- **Emergency number.** No form, sign, wallet card or worker text ships with the placeholder number. [spec/risks-and-blockers.md §1]
- **Shared mailbox.** Forwards go out from a shared `housing@` mailbox so both coordinators see replies. IT has to create it. [spec/v1-scope.md §5]
- **Property permission.** Signs go up only where the leasing office allows them. Apartment-level QR codes are not used. [spec/v1-scope.md §4]
- **Requirements owner.** Matt has the detailed requirements and has not been consulted. Requirements questions go to Matt. Tonya is asked only for the property list and the pilot site. [matt-message.md]
- **Regulation.** No health or payment data is collected. Worker name, cell number and apartment number go to the leasing office so the repair can be scheduled.

## Ethical stance

- **Emergencies go to a phone call, and nothing closes that channel.** The emergency screen refuses to continue to the form and shows the number as a call action, so the worker is never left with nothing to do. The confirmation screen shows the number again.
- **The minimum data needed to route a repair.** Name, cell, property, apartment number, problem, entry permission, availability, pets. Job site is optional. Nothing else is required, and nothing is sent to a property that the repair does not need.
- **Every request gets a visible answer.** The worker gets a request number at submission and a text when the request is sent to the property, scheduled, and closed. A request that is sent and then goes quiet shows up in the coordinators' daily pass by days since sent.
- **Worker texts report status only.** No reminders to use the form, no surveys, no nudges.
- **Foreman submission is a supported path.** The form does not require the submitter to be the occupant.
- **Plain language in both languages.** Problem categories use the words a worker would use. No internal codes, ticket terms or property legal names.
- **The volume increase is stated before launch.** Tonya hears before launch that requests will likely go up when reporting is easy. The time saved comes from complete requests that need no callback.

## Success

For workers: a problem is reported once, in about a minute, and the worker knows it reached the property and when it will be fixed, without calling anyone.

For Tonya and Jordan: maintenance stops arriving as calls and texts during the day and night. Requests are handled in one daily pass, and each one arrives complete enough to forward without a callback. When a property does not respond, it is visible before the worker calls again.

For Plateau: crews in company housing get repairs without the coordinators as a 24-hour switchboard, and the process still works when one coordinator is out.

## Open questions

- How many apartment complexes are there, and where?
- How many maintenance requests arrive in a week?
- What is the emergency phone number, and who answers it after hours?
- Which apartment complex and which crew run the pilot?
- Is a January pilot window representative of normal crew size?
- Who owns the system after launch?
- What happens today when a property ignores a request, and who escalates?
- How long are closed requests kept, including gate codes and other notes a worker types under "Anything else they should know?"
