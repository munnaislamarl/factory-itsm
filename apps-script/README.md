# Factory ITSM — Google Apps Script backend

This folder contains the complete backend for the Factory ITSM portal. The
database is a **Google Spreadsheet** — one tab per entity — and `Code.gs`
exposes a single JSON REST endpoint that the React frontend calls.

## 1. Create the spreadsheet

Create a new Google Sheet (e.g. **Factory ITSM DB**). Tab names are created
automatically by `setup()`:

```
users, departments, locations, employees,
ticket_categories, ticket_subcategories, tickets,
ticket_comments, ticket_worklogs, ticket_attachments, ticket_history,
sla_rules,
assets, asset_assignments, asset_transfers, asset_history,
network_devices, ip_addresses, servers, backups,
software, software_assignments, maintenance,
spare_parts, spare_transactions, vendors, vendor_services,
documents, notifications, activity
```

## 2. Add the script

1. In the Sheet: **Extensions → Apps Script**.
2. Delete the default `Code.gs` content and paste everything from
   [`Code.gs`](Code.gs).
3. Save the project.

## 3. Run first-time setup

From the Apps Script editor run these once and authorise when prompted:

| Function | Purpose |
| --- | --- |
| `setup()` | Creates every tab with headers and a default super admin (`admin@factory.com` / `Admin@123`). |
| `seedReferenceData()` | Adds demo users, 6 departments, ticket categories + sub-categories and SLA rules. |
| `setApiKey()` | **Recommended.** Stores a shared API key in Script Properties (edit the value first). |
| `createUser(name, email, role, password)` | Helper to add another user from the editor. |

> Passwords are stored as salted **SHA-256** hashes. Plaintext passwords are
> never written to the sheet.

## 4. Deploy as a Web App

1. **Deploy → New deployment → Web app**.
2. **Execute as:** *Me*.
3. **Who has access:** *Anyone* (the API key provides a first layer of control).
4. Copy the **`/exec` URL**.

## 5. Point the frontend at it

In the project root create `.env.local`:

```env
VITE_API_URL=https://script.google.com/macros/s/XXXXXXXXXXXX/exec
VITE_API_KEY=the-same-value-you-stored-in-Script-Properties
```

Restart `npm run dev`. The status in the sidebar switches from **Demo mode** to
**Live data**.

## API contract

Every request is `POST` with a JSON body `{ action, requestId, apiKey, ... }`
and every response is `{ success, message?, data?, error? }`.

See [`../API_DOCUMENTATION.md`](../API_DOCUMENTATION.md) for the full list of
actions.

## Security notes

- The browser bundle contains the Web App URL and an optional shared key —
  never embed service-account credentials or the spreadsheet ID in the client.
- For production, restrict the deployment to your organisation and put real
  identity (Google OAuth / Workspace SSO) in front of it, validating the
  Google-issued token server-side.
- Rotate `API_KEY` regularly and keep `.env.local` out of version control.
