# Deployment

The frontend is a static single-page app and deploys to **GitHub Pages** via the
included workflow. The backend is a **Google Apps Script Web App** with Google
Sheets as the database.

## Frontend → GitHub Pages

### Automated (recommended)

The repository ships a workflow at `.github/workflows/deploy.yml` that builds the
app and publishes `dist/` to GitHub Pages on every push to `main`.

1. Create a GitHub repository and push the project:
   ```bash
   git init
   git add .
   git commit -m "feat: factory ITSM portal"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In the repository: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
3. The workflow runs on push; the site is published at
   `https://<you>.github.io/<repo>/`.

Because the app uses `HashRouter` and `base: './'`, deep links work on Pages
without extra rewrite rules.

### Environment variables on Pages

The API URL/key are read at build time (`VITE_*`). To bake them into the Pages
build either:

- Add repository **Settings → Secrets and variables → Actions → Variables** and
  reference them in the workflow step, or
- Provide `.env.production` (do **not** commit secrets).

Example workflow snippet:

```yaml
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ vars.VITE_API_URL }}
          VITE_API_KEY: ${{ vars.VITE_API_KEY }}
```

### Manual

```bash
npm run build
# upload the contents of dist/ to any static host
```

## Backend → Google Apps Script

1. Create the Google Sheet and add `apps-script/Code.gs` (see
   [`apps-script/README.md`](apps-script/README.md)).
2. Run `setup()`, `seedReferenceData()` and `setApiKey()` once.
3. **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone** (or *Anyone within your organisation*)
4. Copy the `/exec` URL and use it as `VITE_API_URL`.
5. To ship updates: **Deploy → Manage deployments → Edit → Version: New
   version → Deploy**. The `/exec` URL stays the same.

## Production hardening checklist

- [ ] Rotate the Apps Script `API_KEY` and store it as a CI secret/variable.
- [ ] Restrict the Web App deployment to your organisation.
- [ ] Replace the shared-key auth with **Google OAuth / Workspace SSO** and
      validate the Google ID token server-side.
- [ ] Move confidential documents to a restricted Drive folder and check
      permissions before returning file URLs.
- [ ] Schedule time-driven Apps Script triggers for SLA-breach, warranty,
      license and low-stock notifications.
- [ ] Keep `.env.local` and `.env.production` out of version control.
