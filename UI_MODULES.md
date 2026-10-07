# UI Modules & Navigation

## Layout

- **Auth layout** — split screen with brand panel and sign-in form.
- **Dashboard layout** — fixed left sidebar (grouped navigation), sticky top bar
  with notifications, theme toggle and user menu. Fully responsive: the sidebar
  collapses into a mobile drawer under `lg`.

## Routes

| Route | Screen | Permission |
| --- | --- | --- |
| `/login` | Sign in | public |
| `/app/dashboard` | Dashboard | `dashboard.view` |
| `/app/tickets` | Service desk list | `tickets.view` |
| `/app/tickets/:id` | Ticket detail & workflow | `tickets.view` |
| `/app/assets` | Asset inventory | `assets.view` |
| `/app/assets/:id` | Asset detail, QR label, lifecycle | `assets.view` |
| `/app/maintenance` | Maintenance records | `maintenance.view` |
| `/app/spare-parts` | Spare parts + stock transactions | `spares.view` |
| `/app/network` | Network devices | `network.view` |
| `/app/servers` | Servers | `servers.view` |
| `/app/backups` | Backup jobs | `servers.view` |
| `/app/software` | Software & licenses | `software.view` |
| `/app/employees` | Employees | `employees.view` |
| `/app/departments` | Departments | `employees.view` |
| `/app/locations` | Locations | `employees.view` |
| `/app/vendors` | Vendors | `vendors.view` |
| `/app/documents` | IT documents | `documents.view` |
| `/app/reports` | Reports | `reports.view` |
| `/app/notifications` | Notifications | `notifications.view` |
| `/app/users` | User administration | `users.manage` |
| `/app/ticket-categories` | Categories | `settings.view` |
| `/app/ticket-subcategories` | Sub-categories | `settings.view` |
| `/app/settings` | Settings | `settings.view` |

Unauthorised routes render an "Access restricted" state; unknown routes render a
404 page.

## Navigation groups

- **Overview** — Dashboard, Service Desk, Notifications
- **IT Assets** — Assets, Maintenance, Spare Parts
- **Infrastructure** — Network, Servers, Backups, Software & Licenses
- **Organisation** — Employees, Departments, Locations
- **Operations** — Vendors, Documents
- **Insights** — Reports
- **System** — Users, Settings

Items are hidden automatically when the current role lacks the required
permission.

## Reusable components

| Component | Purpose |
| --- | --- |
| `StatCard` | KPI tile with icon, tone and loading skeleton |
| `DataTable` + `DataTablePagination` | Sortable table, loading/empty/error states, paging |
| `StatusBadge` / `TicketStatusBadge` / `PriorityBadge` | Colour-coded status pills |
| `Timeline` | Activity / history lists |
| `SearchInput`, `fields.tsx` | Filter and form controls |
| `ConfirmDialog` | Destructive-action confirmation |
| `ResourcePage` | Config-driven CRUD screen (table + filters + form + delete) |
| `ResourceFormDialog` | Renders fields from a resource config with validation |

## Design system

- Primary green `#287a57`, light neutral background, white cards with soft
  layered shadows, `rounded-xl` radius.
- Status colouring: Critical = red, High = orange, Medium = blue, Low = grey,
  Success = green.
- Light / dark / system themes.
- Inter font, responsive from mobile to wide desktop, print styles for reports
  and asset labels.
