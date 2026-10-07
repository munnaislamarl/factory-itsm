# Factory ITSM — IT Service Management Portal

A production-ready, responsive **Factory IT Service Management (ITSM)** web
application for an organisation's IT department. Built with **React 19 + Vite +
TypeScript + Tailwind CSS**, and powered by a **Google Apps Script** API with
**Google Sheets** as the database.

The portal focuses exclusively on IT operations — service desk tickets, IT
assets, network devices, servers and backups, software licenses, maintenance,
spare parts, vendors, IT documents, reports, notifications, and role-based
access control.

> **Demo mode:** with no backend configured the app runs against realistic
> in-memory data so every screen is explorable immediately. Set one environment
> variable to switch to the live Google Sheets backend.

---

## ✨ Modules

| Module | Highlights |
| --- | --- |
| **Dashboard** | 13 KPI cards (open/pending/critical tickets, SLA breaches, assets, warranty/license expiry, low stock, backup failures), 6 charts, activity timeline, recent tickets |
| **Service Desk** | Full ticket lifecycle, dynamic category → sub-category, priority/SLA, comments, work logs, audit history, resolution + user rating |
| **IT Assets** | Inventory, assignment / transfer / return, repair & disposal, QR code + printable label, full asset history |
| **Maintenance** | Preventive, corrective, repair and service records with next-due reminders |
| **Spare Parts** | Stock in / out / adjustment, minimum-stock alerts, transaction history linked to tickets |
| **Network** | Routers, switches, firewalls, Wi-Fi APs, VLAN / IP / MAC tracking |
| **Servers & Backups** | Server inventory and backup jobs with last/next run and status |
| **Software & Licenses** | License seats, expiry alerts, vendor links |
| **Vendors** | Contacts, service types, AMC / warranty / service agreements |
| **Documents** | Invoices, warranties, AMCs, licenses, service reports, config backups |
| **Reports** | 13 filterable reports with CSV / print export |
| **Notifications** | In-app alerts for tickets, SLA, warranty, license, stock and backup events |
| **Administration** | Users, roles, permissions, departments, locations, categories, sub-categories, SLA rules |
| **Audit Trail** | Every important change records actor, field, old value, new value and time |

---

## 🧱 Tech stack

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS** with a professional green design system
- **shadcn/ui-style** primitives on top of **Radix UI**
- **Lucide** icons, **Recharts** charts, **Sonner** toasts, **React Router**
- **Zod** (available for validation), **date-fns**
- **Google Apps Script** + **Google Sheets** backend
- **GitHub Actions** workflow for GitHub Pages deployment

---

## 🚀 Quick start

Requirements: **Node 18+**.

```bash
npm install
npm run dev       # start the dev server (demo mode)
npm run build     # type-check + production build
npm run lint      # oxlint
npm run preview   # preview the production build
```

See [`INSTALLATION.md`](INSTALLATION.md) for full setup and
[`DEPLOYMENT.md`](DEPLOYMENT.md) for GitHub Pages / backend deployment.

### Demo accounts (demo mode only)

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@factory.com` | `Admin@123` |
| IT Manager | `manager@factory.com` | `Manager@123` |
| IT Officer | `officer@factory.com` | `Officer@123` |
| Employee | `employee@factory.com` | `Employee@123` |
| Viewer | `viewer@factory.com` | `Viewer@123` |

Click an account on the login screen to autofill it.

---

## 📁 Project structure

```
src/
  components/
    common/      # StatCard, DataTable, StatusBadge, Timeline, fields, dialogs…
    resource/    # Generic config-driven CRUD page + form dialog
    tickets/     # Ticket form dialog
    ui/          # shadcn-style primitives (button, dialog, select, table…)
  config/        # env, navigation, resource definitions
  hooks/         # useAuth, useLookups, useCollection, useTheme, useNotifications…
  layouts/       # DashboardLayout, Sidebar, Topbar, guards
  pages/         # Dashboard, Tickets, Assets, Reports, Settings + resource pages
  services/      # apiClient, datasource, remote/mock sources, authService
  types/         # shared domain types
  utils/         # constants, format, permissions, csv, id
apps-script/
  Code.gs        # complete Google Apps Script backend
  README.md      # backend setup guide
.github/workflows/deploy.yml
```

---

## 🔐 Roles

`super_admin` · `it_manager` · `it_officer` · `employee` · `viewer`

Access is controlled by **permissions** (see `src/utils/permissions.ts`), not
hard-coded role checks. Employees see only their own tickets and assigned
assets; viewers get read-only dashboard and reports.

---

## 📚 Documentation

- [`PROJECT_PLAN.md`](PROJECT_PLAN.md) — scope, architecture and delivery phases
- [`DATABASE_DESIGN.md`](DATABASE_DESIGN.md) — sheets/collections schema
- [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) — REST actions
- [`UI_MODULES.md`](UI_MODULES.md) — screens and navigation
- [`INSTALLATION.md`](INSTALLATION.md) — local setup
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — GitHub Pages + Apps Script

---

## 📝 License

Provided as a starting point for internal tooling. Replace placeholder branding
and credentials before production use.
