import type { Permission } from '@/utils/permissions'

export type Role = 'super_admin' | 'it_manager' | 'it_officer' | 'employee' | 'viewer'

export type TicketStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'pending_user'
  | 'pending_vendor'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'cancelled'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type AssetStatus =
  | 'available'
  | 'assigned'
  | 'in_repair'
  | 'under_maintenance'
  | 'lost'
  | 'damaged'
  | 'retired'
  | 'disposed'

export interface BaseRecord {
  id: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

/* ------------------------------------------------------------------ */
/* Users & auth                                                        */
/* ------------------------------------------------------------------ */

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  employeeId?: string
  departmentId?: string
  department?: string
  permissions?: Permission[]
}

export interface AppUser extends SessionUser {
  active: boolean
  createdAt?: string
  lastLogin?: string
}

export interface AuthSession {
  token: string
  user: SessionUser
  issuedAt: string
}

/* ------------------------------------------------------------------ */
/* Organisation                                                        */
/* ------------------------------------------------------------------ */

export interface Department extends BaseRecord {
  name: string
  code: string
  headEmployeeId?: string
  buildingId?: string
  description?: string
  active: boolean
}

export interface Location extends BaseRecord {
  building: string
  floor: string
  room: string
  departmentId?: string
  description?: string
  active: boolean
}

export interface Employee extends BaseRecord {
  employeeId: string
  name: string
  departmentId: string
  designation: string
  email: string
  phone: string
  locationId?: string
  status: string
  joinedAt?: string
  notes?: string
}

/* ------------------------------------------------------------------ */
/* Tickets                                                             */
/* ------------------------------------------------------------------ */

export interface TicketCategory extends BaseRecord {
  name: string
  icon: string
  active: boolean
}

export interface TicketSubcategory extends BaseRecord {
  categoryId: string
  name: string
  active: boolean
}

export interface Ticket extends BaseRecord {
  code: string
  title: string
  description: string
  requesterId: string
  requesterName: string
  employeeId?: string
  departmentId: string
  locationId?: string
  categoryId: string
  subcategoryId?: string
  priority: Priority
  status: TicketStatus
  assignedTo?: string
  assignedToName?: string
  dueDate?: string
  slaHours?: number
  resolvedAt?: string
  closedAt?: string
  resolution?: string
  rating?: number
  ratingComment?: string
  firstResponseAt?: string
  reopenCount?: number
}

export interface TicketComment extends BaseRecord {
  ticketId: string
  authorId: string
  authorName: string
  body: string
  internal: boolean
}

export interface TicketWorkLog extends BaseRecord {
  ticketId: string
  officerId: string
  officerName: string
  minutes: number
  note: string
}

export interface TicketAttachment extends BaseRecord {
  ticketId: string
  name: string
  url: string
  size: number
  uploadedBy: string
}

export interface TicketHistory extends BaseRecord {
  ticketId: string
  actor: string
  field: string
  oldValue: string
  newValue: string
  createdAt: string
}

export interface SlaRule extends BaseRecord {
  priority: Priority
  responseHours: number
  resolveHours: number
  active: boolean
}

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

export interface AssetType extends BaseRecord {
  name: string
  description?: string
}

export interface Asset extends BaseRecord {
  assetTag: string
  qrCode?: string
  typeId: string
  name: string
  brand: string
  model: string
  serialNumber: string
  purchaseDate?: string
  purchaseCost?: number
  vendorId?: string
  warrantyStart?: string
  warrantyEnd?: string
  locationId?: string
  building?: string
  floor?: string
  departmentId?: string
  assignedEmployeeId?: string
  status: AssetStatus
  condition: string
  notes?: string
}

export interface AssetAssignment extends BaseRecord {
  assetId: string
  employeeId: string
  employeeName?: string
  assignedAt: string
  returnedAt?: string
  assignedBy: string
  note?: string
}

export interface AssetTransfer extends BaseRecord {
  assetId: string
  fromEmployeeId?: string
  toEmployeeId: string
  transferredAt: string
  reason: string
  by: string
}

export interface AssetHistory extends BaseRecord {
  assetId: string
  action: string
  actor: string
  detail: string
  createdAt: string
}

/* ------------------------------------------------------------------ */
/* Network / Servers / Backups                                         */
/* ------------------------------------------------------------------ */

export interface NetworkDevice extends BaseRecord {
  name: string
  deviceType: string
  brand?: string
  model?: string
  ipAddress?: string
  macAddress?: string
  vlan?: string
  isp?: string
  locationId?: string
  assetId?: string
  status: string
  notes?: string
}

export interface IpAddress extends BaseRecord {
  address: string
  vlan?: string
  deviceId?: string
  status: string
  description?: string
}

export interface Server extends BaseRecord {
  name: string
  hostname: string
  ip: string
  serverType: string
  virtualization: string
  os: string
  cpu: string
  ram: string
  storage: string
  locationId?: string
  status: string
  ownerId?: string
  notes?: string
}

export interface Backup extends BaseRecord {
  name: string
  serverId: string
  backupType: string
  schedule: string
  lastBackup?: string
  status: string
  nextBackup?: string
  storageLocation?: string
  notes?: string
}

/* ------------------------------------------------------------------ */
/* Software / Maintenance / Spares / Vendors                          */
/* ------------------------------------------------------------------ */

export interface Software extends BaseRecord {
  name: string
  vendorId?: string
  version: string
  licenseType: string
  licenseKey?: string
  totalLicenses: number
  usedLicenses: number
  purchaseDate?: string
  expiryDate?: string
  notes?: string
}

export interface SoftwareAssignment extends BaseRecord {
  softwareId: string
  employeeId: string
  assignedAt: string
}

export interface Maintenance extends BaseRecord {
  assetId: string
  maintenanceType: string
  scheduledDate: string
  completedDate?: string
  technician: string
  vendorId?: string
  cost?: number
  status: string
  description: string
  findings?: string
  actionTaken?: string
  nextMaintenanceDate?: string
}

export interface SparePart extends BaseRecord {
  name: string
  sku: string
  category: string
  unit: string
  currentStock: number
  minimumStock: number
  unitCost?: number
  location?: string
  notes?: string
}

export interface SpareTransaction extends BaseRecord {
  sparePartId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  ticketId?: string
  note?: string
  actor: string
  createdAt: string
}

export interface Vendor extends BaseRecord {
  name: string
  contactPerson: string
  phone: string
  email: string
  address?: string
  serviceType: string
  contractType: string
  contractStart?: string
  contractEnd?: string
  notes?: string
}

export interface VendorService extends BaseRecord {
  vendorId: string
  assetId?: string
  ticketId?: string
  serviceDate: string
  description: string
  cost?: number
  status: string
}

/* ------------------------------------------------------------------ */
/* Documents / Notifications / Audit                                   */
/* ------------------------------------------------------------------ */

export interface ItDocument extends BaseRecord {
  name: string
  category: string
  relatedType?: string
  relatedId?: string
  url: string
  size?: number
  uploadedBy: string
  confidential: boolean
  createdAt: string
}

export interface AppNotification extends BaseRecord {
  title: string
  description: string
  timestamp: string
  read: boolean
  tone: 'default' | 'success' | 'warning' | 'info' | 'destructive'
  type?: string
  link?: string
}

export interface ActivityLogEntry extends BaseRecord {
  action: string
  entityType: string
  entityId?: string
  actor: string
  detail: string
  timestamp: string
  oldValue?: string
  newValue?: string
}

/* ------------------------------------------------------------------ */
/* Dashboard & reports                                                 */
/* ------------------------------------------------------------------ */

export interface DashboardStats {
  openTickets: number
  pendingTickets: number
  criticalTickets: number
  ticketsDueToday: number
  slaBreaching: number
  totalAssets: number
  activeAssets: number
  assetsUnderRepair: number
  warrantyExpiringSoon: number
  licensesExpiringSoon: number
  maintenanceDue: number
  lowSpareStock: number
  backupFailures: number
}

export interface ChartDatum {
  name: string
  value: number
}

export interface TrendDatum {
  month: string
  opened: number
  closed: number
}

export interface DashboardData {
  stats: DashboardStats
  ticketsByStatus: ChartDatum[]
  ticketsByCategory: ChartDatum[]
  ticketsByDepartment: ChartDatum[]
  ticketsByPriority: ChartDatum[]
  monthlyTrend: TrendDatum[]
  assetDistribution: ChartDatum[]
  recentActivity: ActivityLogEntry[]
  recentTickets: Ticket[]
}

export interface ReportFilter {
  from?: string
  to?: string
  departmentId?: string
  locationId?: string
  categoryId?: string
  status?: string
  assignedTo?: string
}

export interface ReportPayload {
  title: string
  columns: { key: string; header: string }[]
  rows: Record<string, string | number | null>[]
}

/* ------------------------------------------------------------------ */
/* Generic CRUD plumbing                                               */
/* ------------------------------------------------------------------ */

export type CollectionName =
  | 'users'
  | 'departments'
  | 'locations'
  | 'employees'
  | 'ticket_categories'
  | 'ticket_subcategories'
  | 'tickets'
  | 'ticket_comments'
  | 'ticket_worklogs'
  | 'ticket_attachments'
  | 'ticket_history'
  | 'sla_rules'
  | 'asset_types'
  | 'assets'
  | 'asset_assignments'
  | 'asset_transfers'
  | 'asset_history'
  | 'network_devices'
  | 'ip_addresses'
  | 'servers'
  | 'backups'
  | 'software'
  | 'software_assignments'
  | 'maintenance'
  | 'spare_parts'
  | 'spare_transactions'
  | 'vendors'
  | 'vendor_services'
  | 'documents'
  | 'notifications'
  | 'activity'

export interface QueryOptions {
  search?: string
  filters?: Record<string, string | undefined>
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
