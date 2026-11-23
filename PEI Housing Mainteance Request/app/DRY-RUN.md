# Dry run for Matt

A real link Matt can open on his phone, with no SharePoint, no app registration and nothing
from IT. The form runs on a free Azure Static Web App in **memory mode**: requests are held
by the server and shown on a results page instead of going to a SharePoint list.

About 30 minutes, from the copy on your D: drive. Use made-up names and numbers only: this
is not the approved home for real worker details.

What memory mode means:

- Requests and photos are lost when Azure restarts the app (after idle time, or a redeploy). Send and check in the same sitting.
- Nothing is forwarded to anyone. There is no Forward button; the results page shows what the coordinators would get.
- The property list is the sample one: Test Apartments – Montgomery, Test Apartments – Valdosta, and a few EXAMPLE complexes in each state. Every number on screen says "TEST – do not call".

## 1. Set a test housing number

In `app\web\config.js`, replace `(XXX) XXX-XXXX` with a number you answer, such as your cell.
Leave `testMode: true`. Without this, a red "Not ready" bar shows on every screen.

Don't commit this change; it's for the dry run only.

## 2. Create the Static Web App

Azure portal → **Static Web Apps** → **Create**:

| Setting | Value |
|---|---|
| Name | `pei-housing-dryrun` (anything) |
| Plan type | Free |
| Deployment source | **Other** (you publish from your PC in step 4) |
| Region | East US 2 |

## 3. Turn on memory mode

The new app → **Settings → Environment variables** → add:

| Name | Value |
|---|---|
| `PEI_STORE` | `memory` |
| `PEI_DRYRUN_KEY` | a long random string. In PowerShell: `[guid]::NewGuid().ToString('N')` |

Save. Keep the key: it opens the results page.

## 4. Publish from your PC

The app → **Overview → Manage deployment token** → copy it. Then, in PowerShell:

```powershell
cd "D:\PEI Housing\PEI Housing Mainteance Request\app\api"
npm ci
cd ..
npx @azure/static-web-apps-cli deploy ./web --api-location ./api --api-language node --api-version 20 --env production --deployment-token <paste token>
```

It prints the site's address, for example `https://<name>.azurestaticapps.net`.

## 5. Check it

| Open | You should see |
|---|---|
| `https://<name>.azurestaticapps.net/api/properties` | A list starting with Test Apartments – Valdosta |
| `https://<name>.azurestaticapps.net/?p=test-mgm` on your phone | The emergency question; tap "None of these" and Test Apartments – Montgomery is filled in |
| `https://<name>.azurestaticapps.net/dry-run.html?key=<your key>` | "No requests yet", then each request you send within 15 seconds |

Send one request yourself before passing the link to Matt.

## 6. Print the Montgomery test sign

Needs Python 3 and the QR code package, once:

```powershell
pip install segno
```

Then, from the `PEI Housing Mainteance Request` folder:

```powershell
python tools\make_signs.py --out montgomery-test-sign.html --base-url "https://<name>.azurestaticapps.net/" --emergency "TEST - do not call" --property "Test Apartments – Montgomery=test-mgm"
```

Open `montgomery-test-sign.html` in a browser and print it. Scanning the code opens the form with Montgomery filled in.

## 7. Send Matt the link

Send him the plain link, the QR sign (photo or print), and the script on the Notion page
"Dry run for Matt" under the project. Open the results page while he tries it.

## 8. Afterwards

Delete the Static Web App (Overview → Delete), or remove `PEI_STORE` and `PEI_DRYRUN_KEY` before
connecting SharePoint (`app/README.md`, step 4). With them gone, the results page answers 404.
