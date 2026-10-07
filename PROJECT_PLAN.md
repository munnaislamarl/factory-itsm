# Project Plan — Factory ITSM

## 1. Repository inspection

The workspace is a multi-project folder containing several React + Vite
dashboards (`opex-hub`, `cctv-dashboard`, `fai-shop-dashboard`). `opex-hub`
established a proven, working pattern:

- React 19 + Vite + TypeScript + Tailwind CSS frontend
- shadcn/ui-style primitives on Radix UI, Lucide icons, Recharts, Sonner
- A **Google Apps Script** API with **Google Sheets** as the database
- A fallback **demo data source** so the UI works without a backend
- A GitHub Actions workflow deploying to GitHub Pages

## 2. Architecture decision

The brief's reference stack was Laravel 12 + MySQL. The user explicitly
requested **Google Sheets as the database** and delivery **via GitHub**.
Therefore the project follows the existing, proven architecture of this
workspace instead of MySQL/Laravel:

| Layer | Choice | Rationale |
| --- | --- | --- |
| Frontend | React + Vite + TS + Tailwind | Matches the workspace convention |
| UI kit | Radix + shadcn-style + Lucide | Consistent enterprise look |
| State/data | Thin data-source abstraction | Swappable mock ↔ remote |
| Backend | Google Apps Script Web App | No server to host, free tier |
| Database | Google Sheets (one tab per entity) | Explicit user requirement |
| Auth | Email + salted SHA-256 + shared key | Pragmatic; OAuth-ready |
| Deploy | GitHub Pages + Apps Script | "GitHub diye" requirement |

The data layer is transparent: `src/services/datasource.ts` selects
`remoteDataSource` (Apps Script) when `VITE_API_URL` is set, otherwise
`mockDataSource` (in-memory seed).

## 3. Design principles

- **Permission-based RBAC** (`utils/permissions.ts`) — no scattered role checks.
- **Config-driven CRUD** (`config/resources.ts` + `components/resource/`) so
  similar modules share one high-quality table/form/dialog implementation.
- **Auditability** — ticket history and activity log for important changes.
- **Business rules enforced in the data layer** (mock + Apps Script), not only
  in the UI.

## 4. Delivery phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Project setup, auth, RBAC, layout, dashboard foundation | ✅ |
| 2 | Employees, departments, locations | ✅ |
| 3 | Tickets: categories, SLA, workflow, comments, work logs, history | ✅ |
| 4 | Assets: assignment, transfer, return, QR, history | ✅ |
| 5 | Network, servers, backups | ✅ |
| 6 | Software & licenses | ✅ |
| 7 | Maintenance, spare parts, vendors | ✅ |
| 8 | Documents, notifications, reports | ✅ |
| 9 | Settings, polish, build/lint, documentation, deploy | ✅ |

## 5. Business rules implemented

- An asset has at most one active assignee; reassignment auto-returns the
  previous assignment.
- Every asset transfer/assignment/return writes an assignment/transfer record
  and an asset-history entry.
- Spare stock cannot go below zero; every movement creates a transaction and can
  link to a ticket.
- Tickets record status changes in `ticket_history`; reopen retains prior
  history and increments `reopenCount`.
- License usage is validated against purchased quantity in create/update flows.
- Warranty/license expiry, SLA breach, low stock and backup failure surface as
  dashboard KPIs and notifications.
- Soft delete (`deletedAt`) keeps historical records.
- Employees see only their own tickets/assets; viewers are read-only.

## 6. Testing strategy

The build pipeline runs `tsc` (strict-ish with no-unused checks) and `oxlint`.
Business logic lives in the data layer where it can be unit-tested against both
the mock and Apps Script sources. Manual verification covers the ticket
workflow, asset lifecycle, spare movements and permission scoping per role.
