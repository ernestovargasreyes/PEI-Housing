# The Plateau form: build

The worker maintenance request form for the platform trial (`../trial-platform.md`), built
from `../prototype/worker-form.html` and the design package in `../handoff/README.md`.

```
worker's phone ──▶ web/  (Azure Static Web App: the form)
                    │
                    ▼
                  api/  (the Static Web App's Functions: /api/properties, /api/requests, /api/photos)
                    │   Microsoft Graph, app-only, this one site
                    ▼
       SharePoint ─ Properties list ─ Requests list ─ Request Photos library
                                          │
                                          ▼  Forward button (Power Automate, standard connectors)
                               email from housing@ to the leasing office
```

| Path | What it is |
|---|---|
| `web/` | The form. Plain HTML, CSS and JavaScript, no build step, no web fonts. About 75 KB before photos |
| `web/config.js` | **The housing number, test mode, and the holiday list.** The only file to edit before launch. Emergency numbers come from each property's After-Hours Phone in SharePoint |
| `web/i18n.js` | Every string in English and Spanish, from `../copy-worker-form.md` |
| `api/` | Azure Functions (Node 20). Checks each request, stops repeats and spam, writes to SharePoint |
| `sharepoint/provision.ps1` | Creates the three lists, their columns and the daily-pass views |
| `sharepoint/forward-flow.md` | How to build the Forward flow in Power Automate, step by step |
| `sharepoint/*.column.json` | Column formatting for Days Since Sent and the Forward button |
| `dev/server.js` | Runs the whole thing locally with no Azure account |
| `test/` | Unit tests, browser tests at phone size, and the launch check |
| `DRY-RUN.md` | **A dry run for Matt:** the form on a free Static Web App in memory mode, a results page instead of SharePoint, and the Montgomery test sign |

## Try it locally

Needs Node 20 or later. Nothing to install for the form itself.

```bash
cd "PEI Housing Mainteance Request/app"
```

```bash
npm run dev
```

Open http://localhost:8080 for the plain link, or http://localhost:8080/?p=test-vld as if the
Test Apartments – Valdosta QR code had been scanned. Requests land in `app/.data/requests.json`,
photos in `app/.data/photos/`. Delete `app/.data` to start over.

## Tests

```bash
npm test
```

Unit tests: request checking, English and Spanish option lists in step with the server,
repeat and spam handling, the rate limit, photos, and the SharePoint calls against a fake Graph.

```bash
npm run test:e2e
```

The form in Chromium at phone size, against the local server. Covers trial cards 1, 2, 3, 5,
7 and 8 (photo without sign-in, entry permission, Spanish, emergency stop, QR, no signal),
plus the property's own emergency number (from a QR code, chosen on the call screen, or missing),
the required job site, Virginia and Indiana in the list, three failed sends, the unsent-request prompt, a returning worker, the property list
failing to load, the "Not ready" bar, and the production Content-Security-Policy.
Needs Playwright (`npm i -D playwright`, then `npx playwright install chromium`) if your machine doesn't have it.

```bash
npm run check:launch
```

Fails until `web/config.js` has real numbers and test mode is off. Run it before the January
pilot. It is expected to fail during the trial week.

## Deploy

About an hour, most of it waiting for admin consent. You need: a SharePoint site for housing,
an Azure subscription Sterling IT approves, and someone who can grant admin consent in Entra ID.

### 1. SharePoint lists

```powershell
./sharepoint/provision.ps1 -SiteUrl https://<tenant>.sharepoint.com/sites/<housing-site> -PnPClientId <pnp-app-id>
```

It prints the list IDs for step 4. Then add the test property to **Properties**:
Property `Test Apartments – Valdosta`, Code `test-vld`, City `Valdosta`, State `GA`,
How to Submit `Email`, Submit To *the trial organizer's address*, After-Hours Phone *a phone the
trial organizer answers*, Active ✓.

**After-Hours Phone is what the emergency screen shows.** The property handles emergencies, so
every active property needs its leasing office's after-hours number here (10 digits). Without one,
the form tells the worker to call their leasing office and shows only the housing number.

Copy real properties over from the Notion "Properties & Maintenance Contacts" list when
Tonya and Jordan have filled it in. Give each one a short **Code** (lowercase, dashes,
for example `magnolia-vld`): the QR signs use it, so never reuse or change one.

### 2. App registration (Entra ID)

1. Entra ID → App registrations → New: `Plateau housing form API`, single tenant, no redirect URI.
2. API permissions → Microsoft Graph → **Application** → `Sites.Selected` → Grant admin consent.
   (Not `Sites.ReadWrite.All`: with `Sites.Selected` the app can reach nothing until it is given a site.)
3. Certificates & secrets → New client secret, 12 months. Put the expiry date in the
   coordinators' shared calendar: the form stops saving requests the day it expires.
4. Give it write access to the housing site only:

```powershell
Grant-PnPAzureADAppSitePermission -AppId <app-client-id> -DisplayName "Plateau housing form API" -Site https://<tenant>.sharepoint.com/sites/<housing-site> -Permissions Write
```

(Newer PnP versions call it `Grant-PnPEntraIDAppSitePermission`.)

### 3. Static Web App

Azure portal → Static Web Apps → Create. Plan: Free is enough for the trial; Standard if IT
wants a service-level agreement. Deployment source: GitHub, this repository, branch `main`, then:

| Setting | Value |
|---|---|
| App location | `PEI Housing Mainteance Request/app/web` |
| Api location | `PEI Housing Mainteance Request/app/api` |
| Output location | *(blank)* |

Azure commits a GitHub Actions workflow and deploys on every push to `main`.
Alternatively, from a terminal: `npx @azure/static-web-apps-cli deploy ./web --api-location ./api --env production`.

### 4. App settings

Static Web App → Settings → Environment variables:

| Name | Value |
|---|---|
| `PEI_TENANT_ID` | Directory (tenant) ID |
| `PEI_CLIENT_ID` | The app registration's Application (client) ID |
| `PEI_CLIENT_SECRET` | The secret from step 2. Better: a Key Vault reference |
| `PEI_SITE_ID` | Printed by `provision.ps1`: `host,siteId,webId` |
| `PEI_REQUESTS_LIST_ID` | Printed by `provision.ps1` |
| `PEI_PROPERTIES_LIST_ID` | Printed by `provision.ps1` |
| `PEI_PHOTOS_DRIVE_ID` | From the Graph Explorer call `provision.ps1` prints |

Without these the API answers 503 and the form keeps showing "Not sent yet", with the
worker's answers safe on the phone. To try the deployed form before SharePoint is ready, set
`PEI_STORE=memory` instead (requests are lost when the app restarts; trial only).

### 5. Forward button

Follow `sharepoint/forward-flow.md`.

### 6. Numbers and QR signs

1. Edit `web/config.js`: `housingNumber`. Keep `testMode: true` for the trial week.
2. Regenerate the signs with the live address. The sign prints one emergency number, so run it once per
   property with that property's After-Hours Phone:

```bash
python3 ../tools/make_signs.py --out signs.html --base-url "https://<your-app>.azurestaticapps.net/" --emergency "<number>" --property "Test Apartments – Valdosta=test-vld"
```

### 7. Check it

```bash
curl -s https://<your-app>.azurestaticapps.net/api/properties
```

The answer lists Test Apartments – Valdosta. Then work through the test cards in
`../trial-platform.md` on a phone.

## What the API does with a request

- **Repeats.** Each request carries an ID the phone makes when the form opens. A request sent
  twice (a retry after a lost reply, a double tap) is stored once and gets the same number back.
- **Spam.** A hidden field people never fill; anything that fills it is dropped. 5 requests per
  phone per hour, 40 per network address per hour (a whole crew can share one complex's Wi-Fi).
  These counts are per server instance and reset on restart: a brake, not a wall.
- **What reaches the browser.** `/api/properties` returns code, name, city and state. Contacts,
  submit-to addresses and notes never leave the server.
- **Photos.** Checked by their first bytes (JPEG, PNG, WebP, HEIC), 4 MB at most, 5 per request.
  The form shrinks them to 1600 px first, so most are under 400 KB. A photo removed before
  sending is deleted; once the request is in, photos stay.
- **Stored in English.** Answers are stored as English labels whatever language the worker
  used, so the queue and the forward email read the same. The description and notes stay
  exactly as typed, and the Language column says which language that is.

## Before the January pilot

- [ ] Real housing number in `web/config.js`, `testMode: false`, `npm run check:launch` passes
- [ ] An After-Hours Phone on every active property (Tonya is collecting the contacts), checked by calling each one
- [ ] Real properties in the Properties list, each with a Code; EXAMPLE rows removed
- [ ] The signature line in the Forward flow's email has the real `housing@` address and number
- [ ] The Spanish read by a native speaker (`../copy-worker-form.md`)
- [ ] IT's answer on a security review for a public form (`../trial-platform.md`, open questions)
- [ ] A retention rule for closed requests, including gate codes in **Anything Else** (`../handoff/README.md`, open questions)
- [ ] A custom domain (Static Web App → Custom domains), so the QR codes don't change if the app is ever moved
