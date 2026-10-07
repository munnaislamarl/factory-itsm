# API Documentation

All requests are sent as **HTTP POST** to the Apps Script `/exec` URL with a
JSON body and content type `text/plain;charset=utf-8` (to avoid CORS pre-flight).
Every response has the shape:

```json
{ "success": true, "message": "optional", "data": {} }
```

On failure: `{ "success": false, "message": "...", "error": "CODE" }`.

If an API key is configured, include `apiKey` in every request payload. The
frontend sends `action`, `requestId`, `apiKey` and the action-specific fields.

## Actions

### Generic CRUD

| Action | Payload | Returns |
| --- | --- | --- |
| `list` | `{ collection, options }` | array of records |
| `get` | `{ collection, id }` | record |
| `create` | `{ collection, data, actor }` | created record |
| `update` | `{ collection, id, patch, actor }` | updated record |
| `delete` | `{ collection, id, actor }` | `{ id }` (soft delete) |

`options` may contain `search`, `filters` (equality map), `sortBy`, `sortDir`,
`page`, `pageSize`.

`collection` is any key from `DATABASE_DESIGN.md` (e.g. `tickets`, `assets`,
`spare_parts`).

### Authentication

| Action | Payload | Returns |
| --- | --- | --- |
| `authenticate` | `{ identifier, password }` | session user `{ id, name, email, role, employeeId, departmentId, department }` |

### Ticket workflow

| Action | Payload | Returns |
| --- | --- | --- |
| `ticketAction` | `{ transition, payload, actor }` | updated ticket |
| `rateTicket` | `{ ticketId, rating, comment, actor }` | updated ticket |

`transition` ∈ `assign · start · pending_user · pending_vendor · resolve · close · reopen · cancel`.
`payload` may include `ticketId`, `assignedTo`, `assignedToName`, `note`,
`resolution`, `minutes`, `spareUsages[]`. Status changes append to
`ticket_history`; comments/work logs are appended automatically.

### Asset workflow

| Action | Payload | Returns |
| --- | --- | --- |
| `assetAction` | `{ op, payload, actor }` | updated asset |

`op` ∈ `assign · transfer · return · send_repair · repair_done · retire · dispose`.
`payload` may include `assetId`, `employeeId`, `employeeName`, `toEmployeeId`,
`reason`, `note`. Writes to `asset_assignments`, `asset_transfers` and
`asset_history` as appropriate.

### Spare parts

| Action | Payload | Returns |
| --- | --- | --- |
| `spareAction` | `{ payload, actor }` | `{ part, transaction }` |

`payload` = `{ sparePartId, type: 'in'|'out'|'adjustment', quantity, ticketId?, note? }`.
Rejects movements that would make stock negative.

### Dashboard & reports

| Action | Payload | Returns |
| --- | --- | --- |
| `getDashboard` | `{ scope: { userId, canViewAll } }` | `{ stats, charts[], monthlyTrend[], assetDistribution[], recentActivity[], recentTickets[] }` |
| `getReport` | `{ report, filter }` | `{ title, columns[], rows[] }` |
| `listActivity` | `{}` | latest activity entries |
| `health` | `{}` | `{ status: 'ok' }` |

`report` ∈ `tickets · open_tickets · sla · assets · warranty · maintenance ·
licenses · network · spares · spare_consumption · vendors · backups · employees`.

`filter` = `{ from, to, departmentId, locationId, categoryId, status, assignedTo }`.

## Example

```bash
curl -X POST "$VITE_API_URL" \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"list","collection":"tickets","options":{"filters":{"status":"new"}}}'
```

## Frontend data source

`src/services/remoteDataSource.ts` maps each frontend method to an action. The
mock implementation (`src/services/mock/mockDataSource.ts`) mirrors the same
contract and business rules for demo mode.
