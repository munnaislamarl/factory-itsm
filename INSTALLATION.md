# Installation

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | 18 or newer (LTS recommended) |
| npm | 9 or newer |
| Git | any recent version |
| Google account | for the Sheets / Apps Script backend (optional) |

## 1. Install dependencies

```bash
cd factory-itsm
npm install
```

## 2. Run in demo mode

```bash
npm run dev
```

Open the printed URL (default `http://localhost:5173`). With no `.env.local`
the app uses an in-memory demo data source that is fully populated with sample
departments, employees, assets, tickets, network devices, servers, software,
spares and vendors.

Sign in with any of the demo accounts listed in the README.

## 3. Connect Google Sheets (live mode)

Follow [`apps-script/README.md`](apps-script/README.md) to:

1. Create the spreadsheet and paste `apps-script/Code.gs`.
2. Run `setup()` and `seedReferenceData()`.
3. Deploy as a Web App and copy the `/exec` URL.
4. Create `.env.local`:

```env
VITE_API_URL=https://script.google.com/macros/s/XXXXXXXXXXXX/exec
VITE_API_KEY=your-shared-key
```

Restart `npm run dev`. The sidebar indicator switches to **Live data**.

## 4. Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run typecheck` | Run TypeScript with no emit |
| `npm run lint` | Run oxlint |
| `npm run preview` | Serve the production build locally |

## 5. Troubleshooting

- **"Unable to reach the server"** — check `VITE_API_URL` and that the Apps
  Script deployment access is set to *Anyone*.
- **CORS errors** — the client posts with `text/plain` on purpose; Apps Script
  web apps do not answer pre-flight requests. Do not change the content type.
- **Login fails with a valid account** — re-run `createUser(...)` /
  `seedReferenceData()` so the password hash exists.
- **Blank page after deploy** — confirm the Pages workflow uploaded `dist/` and
  that `base: './'` remains set in `vite.config.ts`.
