export const STORAGE_KEYS = {
  theme: 'factory-itsm.theme',
  session: 'factory-itsm.session',
  notifications: 'factory-itsm.notifications',
  sidebar: 'factory-itsm.sidebar',
} as const

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export type Tone =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'
  | 'destructive'
  | 'muted'

export interface Option<T extends string = string> {
  value: T
  label: string
}

export function optionLabel<T extends string>(options: Option<T>[], value: T | string): string {
  return options.find((option) => option.value === value)?.label ?? String(value ?? '')
}

export function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item) || 'unknown'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
}

/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */

export const ROLES: Option[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'it_manager', label: 'IT Manager' },
  { value: 'it_officer', label: 'IT Officer / Engineer' },
  { value: 'employee', label: 'Employee / IT User' },
  { value: 'viewer', label: 'Management / Viewer' },
]

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Full access to every module, settings and administration.',
  it_manager: 'Owns the IT operation: tickets, assets, reports and team workload.',
  it_officer: 'Handles assigned tickets, assets, maintenance, network and servers.',
  employee: 'Raises tickets and views their own tickets and assigned assets.',
  viewer: 'Read-only access to the dashboard, reports and IT statistics.',
}

/* ------------------------------------------------------------------ */
/* Tickets                                                             */
/* ------------------------------------------------------------------ */

export const TICKET_STATUSES: Option[] = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_user', label: 'Pending User' },
  { value: 'pending_vendor', label: 'Pending Vendor' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'reopened', label: 'Reopened' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const TICKET_STATUS_TONES: Record<string, Tone> = {
  new: 'info',
  assigned: 'default',
  in_progress: 'warning',
  pending_user: 'secondary',
  pending_vendor: 'secondary',
  resolved: 'success',
  closed: 'muted',
  reopened: 'destructive',
  cancelled: 'muted',
}

export const OPEN_STATUSES = ['new', 'assigned', 'in_progress', 'pending_user', 'pending_vendor', 'reopened']
export const CLOSED_STATUSES = ['resolved', 'closed', 'cancelled']

export const PRIORITIES: Option[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export const PRIORITY_TONES: Record<string, Tone> = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  critical: 'destructive',
}

export const DEFAULT_SLA_RULES = [
  { priority: 'critical', responseHours: 1, resolveHours: 4 },
  { priority: 'high', responseHours: 2, resolveHours: 8 },
  { priority: 'medium', responseHours: 4, resolveHours: 24 },
  { priority: 'low', responseHours: 8, resolveHours: 72 },
]

/* ------------------------------------------------------------------ */
/* Ticket categories + sub-categories                                  */
/* ------------------------------------------------------------------ */

export const DEFAULT_CATEGORIES: { name: string; icon: string; subcategories: string[] }[] = [
  {
    name: 'Hardware',
    icon: 'Cpu',
    subcategories: ['Desktop', 'Laptop', 'Monitor', 'Printer', 'Scanner', 'UPS', 'Keyboard/Mouse', 'Other'],
  },
  {
    name: 'Software',
    icon: 'AppWindow',
    subcategories: ['Windows', 'Microsoft Office', 'Antivirus', 'Application', 'Installation', 'Update', 'Error'],
  },
  {
    name: 'Network',
    icon: 'Network',
    subcategories: ['Internet', 'LAN', 'Wi-Fi', 'Router', 'Switch', 'Firewall', 'VPN', 'IP Issue'],
  },
  {
    name: 'Email',
    icon: 'Mail',
    subcategories: ['New Account', 'Password Reset', 'Outlook', 'Email Delivery', 'Email Access'],
  },
  {
    name: 'User Account',
    icon: 'UserCog',
    subcategories: ['New User', 'Password Reset', 'Permission', 'Account Lock', 'Account Disable'],
  },
  {
    name: 'Server',
    icon: 'Server',
    subcategories: ['Server Down', 'Storage', 'Performance', 'Backup', 'Access'],
  },
  {
    name: 'Printer',
    icon: 'Printer',
    subcategories: ['Printing Problem', 'Toner', 'Paper Jam', 'Network Printer', 'Hardware Problem'],
  },
  {
    name: 'CCTV',
    icon: 'Cctv',
    subcategories: ['Camera Offline', 'NVR', 'Recording', 'Display', 'Storage'],
  },
  {
    name: 'Biometric / Access Control',
    icon: 'Fingerprint',
    subcategories: ['Device Offline', 'Fingerprint', 'Attendance Sync', 'Access Issue'],
  },
  {
    name: 'ERP / Application',
    icon: 'LayoutGrid',
    subcategories: ['Login', 'Error', 'Performance', 'Access', 'Integration'],
  },
  { name: 'Other', icon: 'CircleHelp', subcategories: ['General'] },
]

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

export const ASSET_TYPES = [
  'Desktop',
  'Laptop',
  'Monitor',
  'Printer',
  'Scanner',
  'Server',
  'Switch',
  'Router',
  'Firewall',
  'Wi-Fi Access Point',
  'CCTV Camera',
  'NVR',
  'Biometric Device',
  'IP Phone',
  'UPS',
  'Other IT Equipment',
]

export const ASSET_STATUSES: Option[] = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_repair', label: 'In Repair' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
  { value: 'lost', label: 'Lost' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'retired', label: 'Retired' },
  { value: 'disposed', label: 'Disposed' },
]

export const ASSET_STATUS_TONES: Record<string, Tone> = {
  available: 'success',
  assigned: 'info',
  in_repair: 'warning',
  under_maintenance: 'warning',
  lost: 'destructive',
  damaged: 'destructive',
  retired: 'muted',
  disposed: 'muted',
}

export const ASSET_CONDITIONS: Option[] = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'faulty', label: 'Faulty' },
]

/* ------------------------------------------------------------------ */
/* Network / Servers / Backups                                         */
/* ------------------------------------------------------------------ */

export const NETWORK_DEVICE_TYPES = [
  'Router',
  'Switch',
  'Firewall',
  'Wi-Fi Access Point',
  'Modem',
  'Load Balancer',
  'Other',
]

export const DEVICE_STATUSES: Option[] = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'faulty', label: 'Faulty' },
]

export const DEVICE_STATUS_TONES: Record<string, Tone> = {
  online: 'success',
  offline: 'destructive',
  degraded: 'warning',
  maintenance: 'warning',
  faulty: 'destructive',
}

export const SERVER_STATUSES: Option[] = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'decommissioned', label: 'Decommissioned' },
]

export const BACKUP_STATUSES: Option[] = [
  { value: 'successful', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
  { value: 'warning', label: 'Warning' },
  { value: 'never_run', label: 'Never Run' },
]

export const BACKUP_STATUS_TONES: Record<string, Tone> = {
  successful: 'success',
  failed: 'destructive',
  warning: 'warning',
  never_run: 'muted',
}

/* ------------------------------------------------------------------ */
/* Software / Maintenance / Spares / Vendors                           */
/* ------------------------------------------------------------------ */

export const LICENSE_TYPES: Option[] = [
  { value: 'perpetual', label: 'Perpetual' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'oem', label: 'OEM' },
  { value: 'volume', label: 'Volume' },
  { value: 'free', label: 'Free / Open Source' },
  { value: 'trial', label: 'Trial' },
]

export const MAINTENANCE_TYPES: Option[] = [
  { value: 'preventive', label: 'Preventive' },
  { value: 'corrective', label: 'Corrective' },
  { value: 'repair', label: 'Repair' },
  { value: 'service', label: 'Service' },
]

export const MAINTENANCE_STATUSES: Option[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const MAINTENANCE_STATUS_TONES: Record<string, Tone> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'muted',
}

export const SPARE_CATEGORIES = [
  'RAM',
  'SSD',
  'HDD',
  'Keyboard',
  'Mouse',
  'Power Adapter',
  'Power Supply',
  'Network Cable',
  'RJ45 Connector',
  'Printer Toner',
  'UPS Battery',
  'Other IT Parts',
]

export const SPARE_TRANSACTION_TYPES: Option[] = [
  { value: 'in', label: 'Stock In' },
  { value: 'out', label: 'Stock Out' },
  { value: 'adjustment', label: 'Adjustment' },
]

export const VENDOR_SERVICE_TYPES = [
  'Hardware Supply',
  'Software Supply',
  'Network Services',
  'Server & Storage',
  'CCTV & Security',
  'AMC / Maintenance',
  'Internet / ISP',
  'Other',
]

export const VENDOR_CONTRACT_TYPES: Option[] = [
  { value: 'none', label: 'None' },
  { value: 'amc', label: 'AMC' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'service_agreement', label: 'Service Agreement' },
]

/* ------------------------------------------------------------------ */
/* Documents / Notifications / Employees                               */
/* ------------------------------------------------------------------ */

export const DOCUMENT_CATEGORIES: Option[] = [
  { value: 'asset_invoice', label: 'Asset Invoice' },
  { value: 'warranty', label: 'Warranty Document' },
  { value: 'amc', label: 'AMC' },
  { value: 'license', label: 'License Document' },
  { value: 'service_report', label: 'Service Report' },
  { value: 'network_doc', label: 'Network Documentation' },
  { value: 'server_doc', label: 'Server Documentation' },
  { value: 'config_backup', label: 'Configuration Backup' },
  { value: 'other', label: 'Other IT Document' },
]

export const EMPLOYEE_STATUSES: Option[] = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'resigned', label: 'Resigned' },
]

export const EMPLOYEE_STATUS_TONES: Record<string, Tone> = {
  active: 'success',
  on_leave: 'warning',
  inactive: 'muted',
  resigned: 'muted',
}

export const NOTIFICATION_TONES: Record<string, Tone> = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  info: 'info',
  destructive: 'destructive',
}

export const CURRENCY = 'BDT'

export const ENTITY_LABELS: Record<string, string> = {
  tickets: 'Ticket',
  assets: 'Asset',
  employees: 'Employee',
  departments: 'Department',
  locations: 'Location',
  network_devices: 'Network Device',
  servers: 'Server',
  backups: 'Backup',
  software: 'Software',
  maintenance: 'Maintenance',
  spare_parts: 'Spare Part',
  spare_transactions: 'Spare Transaction',
  vendors: 'Vendor',
  vendor_services: 'Vendor Service',
  documents: 'Document',
  asset_assignments: 'Asset Assignment',
  asset_transfers: 'Asset Transfer',
}
