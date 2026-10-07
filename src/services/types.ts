import type {
  ActivityLogEntry,
  Asset,
  CollectionName,
  DashboardData,
  Department,
  Employee,
  Location,
  QueryOptions,
  ReportFilter,
  ReportPayload,
  Server,
  SessionUser,
  Software,
  SparePart,
  SpareTransaction,
  Ticket,
  TicketCategory,
  TicketSubcategory,
  Vendor,
  AppUser,
} from '@/types'

export interface LookupBundle {
  departments: Department[]
  locations: Location[]
  employees: Employee[]
  users: AppUser[]
  vendors: Vendor[]
  assets: Asset[]
  servers: Server[]
  software: Software[]
  spare_parts: SparePart[]
  ticket_categories: TicketCategory[]
  ticket_subcategories: TicketSubcategory[]
}

export type TicketTransition =
  | 'assign'
  | 'start'
  | 'pending_user'
  | 'pending_vendor'
  | 'resolve'
  | 'close'
  | 'reopen'
  | 'cancel'

export interface TicketActionPayload {
  ticketId: string
  assignedTo?: string
  assignedToName?: string
  note?: string
  resolution?: string
  minutes?: number
  spareUsages?: { sparePartId: string; quantity: number }[]
}

export type AssetAction =
  | 'assign'
  | 'transfer'
  | 'return'
  | 'send_repair'
  | 'repair_done'
  | 'retire'
  | 'dispose'

export interface AssetActionPayload {
  assetId: string
  employeeId?: string
  employeeName?: string
  toEmployeeId?: string
  reason?: string
  note?: string
}

export interface SpareActionPayload {
  sparePartId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  ticketId?: string
  note?: string
}

export interface DataSource {
  list<T>(collection: CollectionName, options?: QueryOptions): Promise<T[]>
  get<T>(collection: CollectionName, id: string): Promise<T>
  create<T>(collection: CollectionName, data: Partial<T>, actor: string): Promise<T>
  update<T>(collection: CollectionName, id: string, patch: Partial<T>, actor: string): Promise<T>
  remove(collection: CollectionName, id: string, actor: string): Promise<void>

  getLookups(): Promise<LookupBundle>

  ticketAction(action: TicketTransition, payload: TicketActionPayload, actor: string): Promise<Ticket>
  rateTicket(ticketId: string, rating: number, comment: string, actor: string): Promise<Ticket>
  assetAction(action: AssetAction, payload: AssetActionPayload, actor: string): Promise<Asset>
  spareAction(
    payload: SpareActionPayload,
    actor: string,
  ): Promise<{ part: SparePart; transaction: SpareTransaction }>

  authenticate(identifier: string, password: string): Promise<SessionUser>
  listActivity(): Promise<ActivityLogEntry[]>
  getDashboard(scope: { userId?: string; canViewAll: boolean }): Promise<DashboardData>
  getReport(report: string, filter: ReportFilter): Promise<ReportPayload>
}
