import { buildSeed } from '@/services/mock/seed'
import type {
  AssetAction,
  AssetActionPayload,
  DataSource,
  SpareActionPayload,
  TicketActionPayload,
  TicketTransition,
} from '@/services/types'
import type {
  ActivityLogEntry,
  Asset,
  CollectionName,
  DashboardData,
  QueryOptions,
  ReportFilter,
  ReportPayload,
  SessionUser,
  SparePart,
  SpareTransaction,
  Ticket,
  TicketHistory,
} from '@/types'
import { optionLabel, OPEN_STATUSES, PRIORITIES, TICKET_STATUSES } from '@/utils/constants'
import { generateId } from '@/utils/id'

type AnyRecord = Record<string, unknown>

const now = () => new Date().toISOString()

const DEMO_CREDENTIALS: Record<string, string> = {
  'admin@factory.com': 'Admin@123',
  'manager@factory.com': 'Manager@123',
  'officer@factory.com': 'Officer@123',
  'officer2@factory.com': 'Officer@123',
  'employee@factory.com': 'Employee@123',
  'viewer@factory.com': 'Viewer@123',
}

class MockDataSource implements DataSource {
  private store: Record<string, AnyRecord[]>

  constructor() {
    this.store = buildSeed() as unknown as Record<string, AnyRecord[]>
  }

  private table(collection: string): AnyRecord[] {
    if (!this.store[collection]) this.store[collection] = []
    return this.store[collection]
  }

  private active(collection: string): AnyRecord[] {
    return this.table(collection).filter((row) => !row.deletedAt)
  }

  private activity(entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>): void {
    this.table('activity').unshift({ ...entry, id: generateId('act'), createdAt: entry.timestamp })
  }

  private history(entry: Omit<TicketHistory, 'id'>): void {
    this.table('ticket_history').unshift({ ...entry, id: generateId('th') })
  }

  async list<T>(collection: CollectionName, options: QueryOptions = {}): Promise<T[]> {
    let rows = this.active(collection).slice()

    if (options.filters) {
      rows = rows.filter((row) =>
        Object.entries(options.filters ?? {}).every(([key, value]) => {
          if (value == null || value === '' || value === 'all') return true
          return String(row[key] ?? '') === String(value)
        }),
      )
    }

    if (options.search) {
      const term = options.search.toLowerCase()
      rows = rows.filter((row) =>
        Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(term)),
      )
    }

    if (options.sortBy) {
      const key = options.sortBy
      const dir = options.sortDir === 'asc' ? 1 : -1
      rows.sort((a, b) => {
        const av = a[key]
        const bv = b[key]
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
        return String(av).localeCompare(String(bv)) * dir
      })
    } else {
      rows.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    }

    if (options.page && options.pageSize) {
      const start = (options.page - 1) * options.pageSize
      rows = rows.slice(start, start + options.pageSize)
    }

    return rows as unknown as T[]
  }

  async get<T>(collection: CollectionName, id: string): Promise<T> {
    const row = this.table(collection).find((item) => item.id === id && !item.deletedAt)
    if (!row) throw new Error(`${collection} record not found`)
    return row as unknown as T
  }

  async create<T>(collection: CollectionName, data: Partial<T>, actor: string): Promise<T> {
    const record: AnyRecord = {
      id: (data as AnyRecord).id ?? generateId(collection.slice(0, 3)),
      ...(data as AnyRecord),
      createdAt: now(),
      updatedAt: now(),
    }
    this.table(collection).unshift(record)
    this.activity({
      action: `${collection}.created`,
      entityType: collection,
      entityId: String(record.id),
      actor,
      detail: `Created ${collection.replace(/_/g, ' ')} record`,
      timestamp: now(),
    })
    return record as unknown as T
  }

  async update<T>(collection: CollectionName, id: string, patch: Partial<T>, actor: string): Promise<T> {
    const row = this.table(collection).find((item) => item.id === id)
    if (!row) throw new Error(`${collection} record not found`)
    const before = { ...row }
    Object.assign(row, patch, { updatedAt: now() })

    if (collection === 'tickets') {
      Object.entries(patch as AnyRecord).forEach(([key, value]) => {
        if (String(before[key] ?? '') !== String(value ?? '') && key !== 'updatedAt') {
          this.history({
            ticketId: id,
            actor,
            field: key,
            oldValue: String(before[key] ?? ''),
            newValue: String(value ?? ''),
            createdAt: now(),
          })
        }
      })
    }

    this.activity({
      action: `${collection}.updated`,
      entityType: collection,
      entityId: id,
      actor,
      detail: `Updated ${collection.replace(/_/g, ' ')} record`,
      timestamp: now(),
    })
    return row as unknown as T
  }

  async remove(collection: CollectionName, id: string, actor: string): Promise<void> {
    const row = this.table(collection).find((item) => item.id === id)
    if (!row) throw new Error(`${collection} record not found`)
    row.deletedAt = now()
    row.updatedAt = now()
    this.activity({
      action: `${collection}.deleted`,
      entityType: collection,
      entityId: id,
      actor,
      detail: `Deleted ${collection.replace(/_/g, ' ')} record`,
      timestamp: now(),
    })
  }

  /* ---------------------------------------------------------------- */
  /* Ticket workflow                                                   */
  /* ---------------------------------------------------------------- */

  async ticketAction(
    action: TicketTransition,
    payload: TicketActionPayload,
    actor: string,
  ): Promise<Ticket> {
    const row = this.table('tickets').find((item) => item.id === payload.ticketId)
    if (!row) throw new Error('Ticket not found')
    const before = String(row.status)

    const setStatus = (status: string) => {
      row.status = status
      this.history({
        ticketId: payload.ticketId,
        actor,
        field: 'status',
        oldValue: before,
        newValue: status,
        createdAt: now(),
      })
    }

    switch (action) {
      case 'assign': {
        row.assignedTo = payload.assignedTo
        row.assignedToName = payload.assignedToName
        row.firstResponseAt = row.firstResponseAt ?? now()
        setStatus('assigned')
        break
      }
      case 'start':
        setStatus('in_progress')
        break
      case 'pending_user':
        setStatus('pending_user')
        break
      case 'pending_vendor':
        setStatus('pending_vendor')
        break
      case 'resolve': {
        row.resolution = payload.resolution ?? row.resolution
        row.resolvedAt = now()
        setStatus('resolved')
        if (payload.spareUsages?.length) {
          for (const usage of payload.spareUsages) {
            await this.spareAction(
              { sparePartId: usage.sparePartId, type: 'out', quantity: usage.quantity, ticketId: payload.ticketId, note: `Consumed for ${row.code}` },
              actor,
            )
          }
        }
        break
      }
      case 'close':
        row.closedAt = now()
        setStatus('closed')
        break
      case 'reopen':
        row.reopenCount = Number(row.reopenCount ?? 0) + 1
        row.resolvedAt = undefined
        row.closedAt = undefined
        setStatus('reopened')
        break
      case 'cancel':
        setStatus('cancelled')
        break
      default:
        break
    }

    if (payload.note) {
      this.table('ticket_comments').unshift({
        id: generateId('tc'),
        ticketId: payload.ticketId,
        authorId: actor,
        authorName: actor,
        body: payload.note,
        internal: false,
        createdAt: now(),
        updatedAt: now(),
      })
    }

    if (payload.minutes) {
      this.table('ticket_worklogs').unshift({
        id: generateId('tw'),
        ticketId: payload.ticketId,
        officerId: actor,
        officerName: actor,
        minutes: payload.minutes,
        note: payload.note ?? 'Work logged',
        createdAt: now(),
        updatedAt: now(),
      })
    }

    row.updatedAt = now()
    this.activity({
      action: `ticket.${action}`,
      entityType: 'tickets',
      entityId: payload.ticketId,
      actor,
      detail: `Ticket ${row.code} moved from ${before} to ${row.status}`,
      timestamp: now(),
    })
    return row as unknown as Ticket
  }

  async rateTicket(ticketId: string, rating: number, comment: string, actor: string): Promise<Ticket> {
    const row = this.table('tickets').find((item) => item.id === ticketId)
    if (!row) throw new Error('Ticket not found')
    row.rating = rating
    row.ratingComment = comment
    row.status = 'closed'
    row.closedAt = now()
    row.updatedAt = now()
    this.activity({
      action: 'ticket.rated',
      entityType: 'tickets',
      entityId: ticketId,
      actor,
      detail: `Rated ticket ${row.code} ${rating}/5`,
      timestamp: now(),
    })
    return row as unknown as Ticket
  }

  /* ---------------------------------------------------------------- */
  /* Asset workflow                                                    */
  /* ---------------------------------------------------------------- */

  async assetAction(action: AssetAction, payload: AssetActionPayload, actor: string): Promise<Asset> {
    const row = this.table('assets').find((item) => item.id === payload.assetId)
    if (!row) throw new Error('Asset not found')

    const addAssetHistory = (act: string, detail: string) => {
      this.table('asset_history').unshift({
        id: generateId('ah'),
        assetId: payload.assetId,
        action: act,
        actor,
        detail,
        createdAt: now(),
        updatedAt: now(),
      })
    }

    switch (action) {
      case 'assign': {
        if (payload.employeeId && row.assignedEmployeeId && row.assignedEmployeeId !== payload.employeeId) {
          await this.assetAction('return', { assetId: payload.assetId, note: 'Auto-returned on reassignment' }, actor)
        }
        row.assignedEmployeeId = payload.employeeId
        row.status = 'assigned'
        this.table('asset_assignments').unshift({
          id: generateId('asg'),
          assetId: payload.assetId,
          employeeId: payload.employeeId,
          employeeName: payload.employeeName,
          assignedAt: now(),
          assignedBy: actor,
          note: payload.note,
          createdAt: now(),
          updatedAt: now(),
        })
        addAssetHistory('Assigned', `Assigned to ${payload.employeeName ?? payload.employeeId}`)
        break
      }
      case 'transfer': {
        this.table('asset_transfers').unshift({
          id: generateId('atf'),
          assetId: payload.assetId,
          fromEmployeeId: row.assignedEmployeeId,
          toEmployeeId: payload.toEmployeeId,
          transferredAt: now(),
          reason: payload.reason ?? '',
          by: actor,
          createdAt: now(),
          updatedAt: now(),
        })
        row.assignedEmployeeId = payload.toEmployeeId
        row.status = 'assigned'
        addAssetHistory('Transferred', `Transferred to ${payload.toEmployeeId}`)
        break
      }
      case 'return': {
        const assignment = this.table('asset_assignments').find(
          (item) => item.assetId === payload.assetId && !item.returnedAt,
        )
        if (assignment) assignment.returnedAt = now()
        row.assignedEmployeeId = undefined
        row.status = 'available'
        addAssetHistory('Returned', 'Asset returned to IT store')
        break
      }
      case 'send_repair':
        row.status = 'in_repair'
        addAssetHistory('Repair', payload.note ?? 'Sent for repair')
        break
      case 'repair_done':
        row.status = row.assignedEmployeeId ? 'assigned' : 'available'
        addAssetHistory('Repair Completed', payload.note ?? 'Repair completed')
        break
      case 'retire':
        row.status = 'retired'
        row.assignedEmployeeId = undefined
        addAssetHistory('Retired', payload.note ?? 'Asset retired')
        break
      case 'dispose':
        row.status = 'disposed'
        row.assignedEmployeeId = undefined
        addAssetHistory('Disposed', payload.note ?? 'Asset disposed')
        break
      default:
        break
    }
    row.updatedAt = now()
    this.activity({
      action: `asset.${action}`,
      entityType: 'assets',
      entityId: payload.assetId,
      actor,
      detail: `Asset ${row.assetTag} ${action}`,
      timestamp: now(),
    })
    return row as unknown as Asset
  }

  /* ---------------------------------------------------------------- */
  /* Spare parts                                                       */
  /* ---------------------------------------------------------------- */

  async spareAction(
    payload: SpareActionPayload,
    actor: string,
  ): Promise<{ part: SparePart; transaction: SpareTransaction }> {
    const part = this.table('spare_parts').find((item) => item.id === payload.sparePartId)
    if (!part) throw new Error('Spare part not found')

    const current = Number(part.currentStock ?? 0)
    const qty = Number(payload.quantity)
    let next = current
    if (payload.type === 'in') next = current + qty
    else if (payload.type === 'out') next = current - qty
    else next = current + qty

    if (next < 0) throw new Error('Spare stock cannot go below zero')

    part.currentStock = next
    part.updatedAt = now()

    const transaction: AnyRecord = {
      id: generateId('spt'),
      sparePartId: payload.sparePartId,
      type: payload.type,
      quantity: payload.type === 'adjustment' ? qty : Math.abs(qty),
      ticketId: payload.ticketId,
      note: payload.note,
      actor,
      createdAt: now(),
      updatedAt: now(),
    }
    this.table('spare_transactions').unshift(transaction)
    this.activity({
      action: `spare.${payload.type}`,
      entityType: 'spare_parts',
      entityId: payload.sparePartId,
      actor,
      detail: `${payload.type === 'in' ? 'Received' : payload.type === 'out' ? 'Issued' : 'Adjusted'} ${Math.abs(qty)} ${part.unit} of ${part.name}`,
      timestamp: now(),
    })
    return { part: part as unknown as SparePart, transaction: transaction as unknown as SpareTransaction }
  }

  /* ---------------------------------------------------------------- */
  /* Auth & misc                                                       */
  /* ---------------------------------------------------------------- */

  async authenticate(identifier: string, password: string): Promise<SessionUser> {
    const key = identifier.trim().toLowerCase()
    const user = this.table('users').find(
      (item) =>
        String(item.email).toLowerCase() === key ||
        String(item.employeeId ?? '').toLowerCase() === key,
    )
    if (!user) throw new Error('No account found for that email or employee ID.')
    const expected = DEMO_CREDENTIALS[String(user.email).toLowerCase()]
    if (!expected || expected !== password) {
      throw new Error('Incorrect password. Please try again.')
    }
    user.lastLogin = now()
    return {
      id: String(user.id),
      name: String(user.name),
      email: String(user.email),
      role: user.role as SessionUser['role'],
      employeeId: user.employeeId as string | undefined,
      departmentId: user.departmentId as string | undefined,
      department: user.department as string | undefined,
    }
  }

  async listActivity(): Promise<ActivityLogEntry[]> {
    return this.table('activity').slice(0, 60) as unknown as ActivityLogEntry[]
  }

  async getDashboard(scope: { userId?: string; canViewAll: boolean }): Promise<DashboardData> {
    const allTickets = this.active('tickets') as unknown as Ticket[]
    const tickets = scope.canViewAll
      ? allTickets
      : allTickets.filter((t) => t.requesterId === scope.userId || t.assignedTo === scope.userId)

    const assets = this.active('assets') as unknown as Asset[]
    const spares = this.active('spare_parts') as unknown as SparePart[]
    const software = this.active('software') as AnyRecord[]
    const maintenance = this.active('maintenance') as AnyRecord[]
    const backups = this.active('backups') as AnyRecord[]

    const openTickets = tickets.filter((t) => OPEN_STATUSES.includes(t.status))
    const today = new Date().toDateString()
    const in30Days = Date.now() + 30 * 86400000
    const in7Days = Date.now() + 7 * 86400000

    const ticketDueSoon = openTickets.filter((t) => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return due.toDateString() === today
    })
    const slaBreaching = openTickets.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now())

    const stats = {
      openTickets: openTickets.length,
      pendingTickets: tickets.filter((t) => ['pending_user', 'pending_vendor'].includes(t.status)).length,
      criticalTickets: openTickets.filter((t) => t.priority === 'critical').length,
      ticketsDueToday: ticketDueSoon.length,
      slaBreaching: slaBreaching.length,
      totalAssets: assets.length,
      activeAssets: assets.filter((a) => !['retired', 'disposed', 'lost'].includes(a.status)).length,
      assetsUnderRepair: assets.filter((a) => ['in_repair', 'under_maintenance'].includes(a.status)).length,
      warrantyExpiringSoon: assets.filter(
        (a) => a.warrantyEnd && new Date(a.warrantyEnd).getTime() < in30Days && new Date(a.warrantyEnd).getTime() > Date.now(),
      ).length,
      licensesExpiringSoon: software.filter(
        (s) => s.expiryDate && new Date(String(s.expiryDate)).getTime() < in30Days && new Date(String(s.expiryDate)).getTime() > Date.now(),
      ).length,
      maintenanceDue: maintenance.filter(
        (m) => m.scheduledDate && new Date(String(m.scheduledDate)).getTime() < in7Days && String(m.status) === 'scheduled',
      ).length,
      lowSpareStock: spares.filter((s) => Number(s.currentStock) <= Number(s.minimumStock)).length,
      backupFailures: backups.filter((b) => String(b.status) === 'failed').length,
    }

    const byLabel = (items: { label: string; value: number }[]) =>
      items.map((item) => ({ name: item.label, value: item.value }))

    const group = (keyFn: (t: Ticket) => string, labelFn: (key: string) => string) => {
      const count: Record<string, number> = {}
      tickets.forEach((t) => {
        const k = keyFn(t)
        count[k] = (count[k] ?? 0) + 1
      })
      return Object.entries(count).map(([k, v]) => ({ name: labelFn(k), value: v }))
    }

    const categoryMap = new Map(this.active('ticket_categories').map((c) => [String(c.id), String(c.name)]))
    const departmentMap = new Map(this.active('departments').map((d) => [String(d.id), String(d.name)]))

    const monthlyTrend = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index))
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const opened = tickets.filter((t) => (t.createdAt ?? '').slice(0, 7) === monthKey).length
      const closed = tickets.filter((t) => (t.resolvedAt ?? t.closedAt ?? '').slice(0, 7) === monthKey).length
      return { month: date.toLocaleString('en-US', { month: 'short' }), opened, closed }
    })

    return {
      stats,
      ticketsByStatus: byLabel(
        TICKET_STATUSES.map((status) => ({ label: status.label, value: tickets.filter((t) => t.status === status.value).length })).filter((item) => item.value > 0),
      ),
      ticketsByCategory: group((t) => t.categoryId, (k) => categoryMap.get(k) ?? 'Other'),
      ticketsByDepartment: group((t) => t.departmentId, (k) => departmentMap.get(k) ?? 'Unknown'),
      ticketsByPriority: byLabel(
        PRIORITIES.map((p) => ({ label: p.label, value: tickets.filter((t) => t.priority === p.value).length })).filter((item) => item.value > 0),
      ),
      monthlyTrend,
      assetDistribution: (() => {
        const count: Record<string, number> = {}
        assets.forEach((a) => {
          count[a.typeId] = (count[a.typeId] ?? 0) + 1
        })
        return Object.entries(count).map(([name, value]) => ({ name, value }))
      })(),
      recentActivity: (this.table('activity').slice(0, 10) as unknown as ActivityLogEntry[]),
      recentTickets: tickets.slice().sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 6),
    }
  }

  async getReport(report: string, filter: ReportFilter): Promise<ReportPayload> {
    const tickets = this.active('tickets') as unknown as Ticket[]
    const assets = this.active('assets') as unknown as Asset[]
    const categoryMap = new Map(this.active('ticket_categories').map((c) => [String(c.id), String(c.name)]))
    const departmentMap = new Map(this.active('departments').map((d) => [String(d.id), String(d.name)]))
    const employeeMap = new Map(this.active('employees').map((e) => [String(e.id), String(e.name)]))

    const withinRange = (value: string | undefined) => {
      if (!value) return true
      const time = new Date(value).getTime()
      if (filter.from && time < new Date(filter.from).getTime()) return false
      if (filter.to && time > new Date(filter.to).getTime() + 86400000) return false
      return true
    }

    switch (report) {
      case 'open_tickets': {
        const rows = tickets.filter((t) => OPEN_STATUSES.includes(t.status) && withinRange(t.createdAt)).map((t) => ({
          code: t.code,
          title: t.title,
          priority: optionLabel(PRIORITIES, t.priority),
          status: optionLabel(TICKET_STATUSES, t.status),
          category: categoryMap.get(t.categoryId) ?? '',
          department: departmentMap.get(t.departmentId) ?? '',
          assignee: t.assignedToName ?? 'Unassigned',
          due: t.dueDate ?? '',
        }))
        return {
          title: 'Open Tickets Report',
          columns: [
            { key: 'code', header: 'Ticket' },
            { key: 'title', header: 'Title' },
            { key: 'priority', header: 'Priority' },
            { key: 'status', header: 'Status' },
            { key: 'category', header: 'Category' },
            { key: 'department', header: 'Department' },
            { key: 'assignee', header: 'Assigned To' },
            { key: 'due', header: 'Due Date' },
          ],
          rows,
        }
      }
      case 'sla': {
        const rows = tickets.filter((t) => t.dueDate && withinRange(t.createdAt)).map((t) => ({
          code: t.code,
          title: t.title,
          priority: optionLabel(PRIORITIES, t.priority),
          status: optionLabel(TICKET_STATUSES, t.status),
          due: t.dueDate ?? '',
          breached: t.dueDate && new Date(t.dueDate).getTime() < Date.now() && OPEN_STATUSES.includes(t.status) ? 'Yes' : 'No',
        }))
        return {
          title: 'SLA Report',
          columns: [
            { key: 'code', header: 'Ticket' },
            { key: 'title', header: 'Title' },
            { key: 'priority', header: 'Priority' },
            { key: 'status', header: 'Status' },
            { key: 'due', header: 'Due' },
            { key: 'breached', header: 'Breached' },
          ],
          rows,
        }
      }
      case 'assets':
      case 'warranty': {
        const rows = assets
          .filter((a) => (report === 'warranty' ? a.warrantyEnd && new Date(a.warrantyEnd).getTime() < Date.now() + 60 * 86400000 : true))
          .map((a) => ({
            tag: a.assetTag,
            name: a.name,
            type: a.typeId,
            brand: a.brand,
            status: a.status,
            department: a.departmentId ? departmentMap.get(a.departmentId) ?? '' : '',
            assignee: a.assignedEmployeeId ? employeeMap.get(a.assignedEmployeeId) ?? '' : '—',
            warrantyEnd: a.warrantyEnd ?? '—',
          }))
        return {
          title: report === 'warranty' ? 'Asset Warranty Report' : 'Asset Report',
          columns: [
            { key: 'tag', header: 'Asset Tag' },
            { key: 'name', header: 'Asset' },
            { key: 'type', header: 'Type' },
            { key: 'brand', header: 'Brand' },
            { key: 'status', header: 'Status' },
            { key: 'department', header: 'Department' },
            { key: 'assignee', header: 'Assigned To' },
            { key: 'warrantyEnd', header: 'Warranty End' },
          ],
          rows,
        }
      }
      case 'spares':
      case 'spare_consumption': {
        if (report === 'spare_consumption') {
          const spares = this.active('spare_parts')
          const partMap = new Map(spares.map((s) => [String(s.id), String(s.name)]))
          const rows = (this.active('spare_transactions') as AnyRecord[]).map((t) => ({
            part: partMap.get(String(t.sparePartId)) ?? '',
            type: String(t.type),
            quantity: Number(t.quantity),
            ticket: String(t.ticketId ?? '—'),
            actor: String(t.actor),
            date: String(t.createdAt ?? ''),
          }))
          return {
            title: 'Spare Consumption Report',
            columns: [
              { key: 'part', header: 'Spare Part' },
              { key: 'type', header: 'Type' },
              { key: 'quantity', header: 'Qty' },
              { key: 'ticket', header: 'Ticket' },
              { key: 'actor', header: 'By' },
              { key: 'date', header: 'Date' },
            ],
            rows,
          }
        }
        const rows = (this.active('spare_parts') as AnyRecord[]).map((s) => ({
          name: String(s.name),
          sku: String(s.sku),
          category: String(s.category),
          stock: Number(s.currentStock),
          minimum: Number(s.minimumStock),
          status: Number(s.currentStock) <= Number(s.minimumStock) ? 'Low' : 'OK',
          value: Number(s.currentStock) * Number(s.unitCost ?? 0),
        }))
        return {
          title: 'Spare Stock Report',
          columns: [
            { key: 'name', header: 'Spare Part' },
            { key: 'sku', header: 'SKU' },
            { key: 'category', header: 'Category' },
            { key: 'stock', header: 'Stock' },
            { key: 'minimum', header: 'Minimum' },
            { key: 'status', header: 'Status' },
            { key: 'value', header: 'Stock Value' },
          ],
          rows,
        }
      }
      case 'licenses': {
        const rows = (this.active('software') as AnyRecord[]).map((s) => ({
          name: String(s.name),
          version: String(s.version),
          type: String(s.licenseType),
          total: Number(s.totalLicenses),
          used: Number(s.usedLicenses),
          available: Number(s.totalLicenses) - Number(s.usedLicenses),
          expiry: String(s.expiryDate ?? '—'),
        }))
        return {
          title: 'Software License Report',
          columns: [
            { key: 'name', header: 'Software' },
            { key: 'version', header: 'Version' },
            { key: 'type', header: 'License Type' },
            { key: 'total', header: 'Total' },
            { key: 'used', header: 'Used' },
            { key: 'available', header: 'Available' },
            { key: 'expiry', header: 'Expiry' },
          ],
          rows,
        }
      }
      case 'backups': {        const serverMap = new Map(this.active('servers').map((s) => [String(s.id), String(s.name)]))
        const rows = (this.active('backups') as AnyRecord[]).map((b) => ({
          name: String(b.name),
          server: serverMap.get(String(b.serverId)) ?? '',
          type: String(b.backupType),
          schedule: String(b.schedule),
          last: String(b.lastBackup ?? '—'),
          status: String(b.status),
          next: String(b.nextBackup ?? '—'),
        }))
        return {
          title: 'Server Backup Report',
          columns: [
            { key: 'name', header: 'Backup' },
            { key: 'server', header: 'Server' },
            { key: 'type', header: 'Type' },
            { key: 'schedule', header: 'Schedule' },
            { key: 'last', header: 'Last Backup' },
            { key: 'status', header: 'Status' },
            { key: 'next', header: 'Next Backup' },
          ],
          rows,
        }
      }
      case 'maintenance': {
        const assetMap = new Map(this.active('assets').map((a) => [String(a.id), String(a.assetTag)]))
        const vendorMap = new Map(this.active('vendors').map((v) => [String(v.id), String(v.name)]))
        const rows = (this.active('maintenance') as AnyRecord[]).map((m) => ({
          asset: assetMap.get(String(m.assetId)) ?? '',
          type: String(m.maintenanceType),
          scheduled: String(m.scheduledDate ?? ''),
          completed: String(m.completedDate ?? '—'),
          technician: String(m.technician ?? ''),
          vendor: m.vendorId ? vendorMap.get(String(m.vendorId)) ?? '' : '—',
          cost: Number(m.cost ?? 0),
          status: String(m.status),
        }))
        return {
          title: 'Maintenance Report',
          columns: [
            { key: 'asset', header: 'Asset' },
            { key: 'type', header: 'Type' },
            { key: 'scheduled', header: 'Scheduled' },
            { key: 'completed', header: 'Completed' },
            { key: 'technician', header: 'Technician' },
            { key: 'vendor', header: 'Vendor' },
            { key: 'cost', header: 'Cost' },
            { key: 'status', header: 'Status' },
          ],
          rows,
        }
      }
      case 'network': {
        const rows = (this.active('network_devices') as AnyRecord[]).map((d) => ({
          name: String(d.name),
          type: String(d.deviceType),
          brand: String(d.brand ?? '—'),
          ip: String(d.ipAddress ?? '—'),
          mac: String(d.macAddress ?? '—'),
          vlan: String(d.vlan ?? '—'),
          status: String(d.status),
        }))
        return {
          title: 'Network Device Report',
          columns: [
            { key: 'name', header: 'Device' },
            { key: 'type', header: 'Type' },
            { key: 'brand', header: 'Brand' },
            { key: 'ip', header: 'IP' },
            { key: 'mac', header: 'MAC' },
            { key: 'vlan', header: 'VLAN' },
            { key: 'status', header: 'Status' },
          ],
          rows,
        }
      }
      case 'vendors': {
        const rows = (this.active('vendors') as AnyRecord[]).map((v) => ({
          name: String(v.name),
          contact: String(v.contactPerson ?? ''),
          phone: String(v.phone ?? ''),
          serviceType: String(v.serviceType),
          contract: String(v.contractType),
          contractEnd: String(v.contractEnd ?? '—'),
        }))
        return {
          title: 'Vendor Service Report',
          columns: [
            { key: 'name', header: 'Vendor' },
            { key: 'contact', header: 'Contact' },
            { key: 'phone', header: 'Phone' },
            { key: 'serviceType', header: 'Service Type' },
            { key: 'contract', header: 'Contract' },
            { key: 'contractEnd', header: 'Contract End' },
          ],
          rows,
        }
      }
      case 'employees': {
        const rows = (this.active('employees') as AnyRecord[]).map((e) => ({
          employeeId: String(e.employeeId),
          name: String(e.name),
          department: departmentMap.get(String(e.departmentId)) ?? '',
          designation: String(e.designation),
          email: String(e.email),
          phone: String(e.phone),
          status: String(e.status),
        }))
        return {
          title: 'Employee Report',
          columns: [
            { key: 'employeeId', header: 'Employee ID' },
            { key: 'name', header: 'Name' },
            { key: 'department', header: 'Department' },
            { key: 'designation', header: 'Designation' },
            { key: 'email', header: 'Email' },
            { key: 'phone', header: 'Phone' },
            { key: 'status', header: 'Status' },
          ],
          rows,
        }
      }
      default: {
        const rows = tickets.filter((t) => withinRange(t.createdAt)).map((t) => ({
          code: t.code,
          title: t.title,
          requester: t.requesterName,
          department: departmentMap.get(t.departmentId) ?? '',
          category: categoryMap.get(t.categoryId) ?? '',
          priority: optionLabel(PRIORITIES, t.priority),
          status: optionLabel(TICKET_STATUSES, t.status),
          assignee: t.assignedToName ?? 'Unassigned',
          created: t.createdAt ?? '',
        }))
        return {
          title: 'Ticket Report',
          columns: [
            { key: 'code', header: 'Ticket' },
            { key: 'title', header: 'Title' },
            { key: 'requester', header: 'Requester' },
            { key: 'department', header: 'Department' },
            { key: 'category', header: 'Category' },
            { key: 'priority', header: 'Priority' },
            { key: 'status', header: 'Status' },
            { key: 'assignee', header: 'Assigned To' },
            { key: 'created', header: 'Created' },
          ],
          rows,
        }
      }
    }
  }
}

export const mockDataSource = new MockDataSource()
