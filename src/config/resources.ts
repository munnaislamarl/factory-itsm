import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Cpu,
  FileText,
  HardHat,
  ListTree,
  MapPin,
  Network,
  ReceiptText,
  Server,
  ShieldCheck,
  Tags,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'

import type { LookupSource } from '@/hooks/useLookups'
import type { CollectionName } from '@/types'
import type { Permission } from '@/utils/permissions'
import type { Option, Tone } from '@/utils/constants'
import {
  ASSET_CONDITIONS,
  ASSET_STATUS_TONES,
  ASSET_STATUSES,
  ASSET_TYPES,
  BACKUP_STATUS_TONES,
  BACKUP_STATUSES,
  DEVICE_STATUS_TONES,
  DEVICE_STATUSES,
  DOCUMENT_CATEGORIES,
  EMPLOYEE_STATUS_TONES,
  EMPLOYEE_STATUSES,
  LICENSE_TYPES,
  MAINTENANCE_STATUS_TONES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_TYPES,
  ROLES,
  SERVER_STATUSES,
  VENDOR_CONTRACT_TYPES,
  VENDOR_SERVICE_TYPES,
} from '@/utils/constants'

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'tel'

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  options?: Option[]
  optionsFrom?: LookupSource | 'subcategories'
  required?: boolean
  placeholder?: string
  help?: string
  full?: boolean
  defaultValue?: string | number | boolean
  dependsOn?: string
  min?: number
}

export type ColumnKind = 'text' | 'badge' | 'currency' | 'date' | 'datetime' | 'ref' | 'boolean' | 'number' | 'code'

export interface ColumnConfig {
  key: string
  header: string
  kind?: ColumnKind
  ref?: LookupSource
  options?: Option[]
  tones?: Record<string, Tone>
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
  secondaryKey?: string
}

export interface FilterConfig {
  name: string
  label: string
  options?: Option[]
  optionsFrom?: LookupSource
}

export interface ResourceConfig {
  key: string
  collection: CollectionName
  title: string
  singular: string
  description: string
  icon: LucideIcon
  permissions: { view: Permission; create?: Permission; update?: Permission; delete?: Permission }
  columns: ColumnConfig[]
  fields: FieldConfig[]
  filters?: FilterConfig[]
  defaultSort?: { by: string; dir: 'asc' | 'desc' }
  searchable?: string[]
  detailRoute?: (row: Record<string, unknown>) => string
}

export const RESOURCES: Record<string, ResourceConfig> = {
  employees: {
    key: 'employees',
    collection: 'employees',
    title: 'Employees',
    singular: 'Employee',
    description: 'Directory of factory employees that IT supports.',
    icon: Users,
    permissions: { view: 'employees.view', create: 'employees.manage', update: 'employees.manage', delete: 'employees.manage' },
    columns: [
      { key: 'employeeId', header: 'Employee ID', kind: 'code' },
      { key: 'name', header: 'Name' },
      { key: 'departmentId', header: 'Department', kind: 'ref', ref: 'departments', hideBelow: 'sm' },
      { key: 'designation', header: 'Designation', hideBelow: 'md' },
      { key: 'email', header: 'Email', hideBelow: 'lg' },
      { key: 'status', header: 'Status', kind: 'badge', options: EMPLOYEE_STATUSES, tones: EMPLOYEE_STATUS_TONES },
    ],
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'employeeId', label: 'Employee ID', type: 'text', required: true, placeholder: 'EMP-1001' },
      { name: 'departmentId', label: 'Department', type: 'select', optionsFrom: 'departments', required: true },
      { name: 'designation', label: 'Designation', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'locationId', label: 'Location', type: 'select', optionsFrom: 'locations', full: true },
      { name: 'status', label: 'Status', type: 'select', options: EMPLOYEE_STATUSES, defaultValue: 'active' },
      { name: 'joinedAt', label: 'Joined Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    filters: [
      { name: 'departmentId', label: 'Department', optionsFrom: 'departments' },
      { name: 'status', label: 'Status', options: EMPLOYEE_STATUSES },
    ],
  },

  assets: {
    key: 'assets',
    collection: 'assets',
    title: 'IT Assets',
    singular: 'Asset',
    description: 'IT asset inventory with assignment, warranty and lifecycle tracking.',
    icon: Cpu,
    permissions: { view: 'assets.view', create: 'assets.create', update: 'assets.update', delete: 'assets.delete' },
    detailRoute: (row) => `/app/assets/${row.id}`,
    columns: [
      { key: 'assetTag', header: 'Asset Tag', kind: 'code' },
      { key: 'name', header: 'Asset', secondaryKey: 'brand' },
      { key: 'typeId', header: 'Type', hideBelow: 'sm' },
      { key: 'assignedEmployeeId', header: 'Assigned To', kind: 'ref', ref: 'employees', hideBelow: 'md' },
      { key: 'departmentId', header: 'Department', kind: 'ref', ref: 'departments', hideBelow: 'lg' },
      { key: 'warrantyEnd', header: 'Warranty End', kind: 'date', hideBelow: 'lg' },
      { key: 'status', header: 'Status', kind: 'badge', options: ASSET_STATUSES, tones: ASSET_STATUS_TONES },
    ],
    fields: [
      { name: 'name', label: 'Asset Name', type: 'text', required: true },
      { name: 'assetTag', label: 'Asset Tag', type: 'text', required: true, placeholder: 'AST-2024-1001' },
      { name: 'typeId', label: 'Asset Type', type: 'select', required: true, options: ASSET_TYPES.map((value) => ({ value, label: value })) },
      { name: 'serialNumber', label: 'Serial Number', type: 'text' },
      { name: 'brand', label: 'Brand', type: 'text' },
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ASSET_STATUSES, defaultValue: 'available' },
      { name: 'condition', label: 'Condition', type: 'select', options: ASSET_CONDITIONS, defaultValue: 'good' },
      { name: 'departmentId', label: 'Department', type: 'select', optionsFrom: 'departments' },
      { name: 'locationId', label: 'Location', type: 'select', optionsFrom: 'locations' },
      { name: 'assignedEmployeeId', label: 'Assigned Employee', type: 'select', optionsFrom: 'employees' },
      { name: 'vendorId', label: 'Vendor', type: 'select', optionsFrom: 'vendors' },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'purchaseCost', label: 'Purchase Cost', type: 'number', min: 0 },
      { name: 'warrantyStart', label: 'Warranty Start', type: 'date' },
      { name: 'warrantyEnd', label: 'Warranty End', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    filters: [
      { name: 'status', label: 'Status', options: ASSET_STATUSES },
      { name: 'typeId', label: 'Type', options: ASSET_TYPES.map((value) => ({ value, label: value })) },
      { name: 'departmentId', label: 'Department', optionsFrom: 'departments' },
    ],
  },

  departments: {
    key: 'departments',
    collection: 'departments',
    title: 'Departments',
    singular: 'Department',
    description: 'Factory departments used across tickets, assets and assets.',
    icon: Building2,
    permissions: { view: 'employees.view', create: 'lookup.manage', update: 'lookup.manage', delete: 'lookup.manage' },
    columns: [
      { key: 'name', header: 'Department' },
      { key: 'code', header: 'Code', kind: 'code' },
      { key: 'headEmployeeId', header: 'Head', kind: 'ref', ref: 'employees', hideBelow: 'md' },
      { key: 'description', header: 'Description', hideBelow: 'lg' },
      { key: 'active', header: 'Active', kind: 'boolean' },
    ],
    fields: [
      { name: 'name', label: 'Department Name', type: 'text', required: true },
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'headEmployeeId', label: 'Department Head', type: 'select', optionsFrom: 'employees' },
      { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
    ],
  },

  locations: {
    key: 'locations',
    collection: 'locations',
    title: 'Locations',
    singular: 'Location',
    description: 'Building → floor → room structure used across the IT system.',
    icon: MapPin,
    permissions: { view: 'employees.view', create: 'locations.manage', update: 'locations.manage', delete: 'locations.manage' },
    columns: [
      { key: 'building', header: 'Building' },
      { key: 'floor', header: 'Floor' },
      { key: 'room', header: 'Room / Area' },
      { key: 'departmentId', header: 'Department', kind: 'ref', ref: 'departments', hideBelow: 'md' },
      { key: 'active', header: 'Active', kind: 'boolean', hideBelow: 'lg' },
    ],
    fields: [
      { name: 'building', label: 'Building', type: 'text', required: true },
      { name: 'floor', label: 'Floor', type: 'text', required: true },
      { name: 'room', label: 'Room / Area', type: 'text', required: true },
      { name: 'departmentId', label: 'Department', type: 'select', optionsFrom: 'departments' },
      { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
    ],
    filters: [{ name: 'building', label: 'Building' }],
  },

  network: {
    key: 'network',
    collection: 'network_devices',
    title: 'Network Devices',
    singular: 'Network Device',
    description: 'Routers, switches, firewalls and wireless access points.',
    icon: Network,
    permissions: { view: 'network.view', create: 'network.manage', update: 'network.manage', delete: 'network.manage' },
    columns: [
      { key: 'name', header: 'Device' },
      { key: 'deviceType', header: 'Type' },
      { key: 'ipAddress', header: 'IP Address', kind: 'code' },
      { key: 'macAddress', header: 'MAC', kind: 'code', hideBelow: 'lg' },
      { key: 'locationId', header: 'Location', kind: 'ref', ref: 'locations', hideBelow: 'md' },
      { key: 'status', header: 'Status', kind: 'badge', options: DEVICE_STATUSES, tones: DEVICE_STATUS_TONES },
    ],
    fields: [
      { name: 'name', label: 'Device Name', type: 'text', required: true },
      { name: 'deviceType', label: 'Device Type', type: 'select', required: true, options: [
        { value: 'Router', label: 'Router' },
        { value: 'Switch', label: 'Switch' },
        { value: 'Firewall', label: 'Firewall' },
        { value: 'Wi-Fi Access Point', label: 'Wi-Fi Access Point' },
        { value: 'Modem', label: 'Modem' },
        { value: 'Load Balancer', label: 'Load Balancer' },
        { value: 'Other', label: 'Other' },
      ] },
      { name: 'brand', label: 'Brand', type: 'text' },
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'ipAddress', label: 'IP Address', type: 'text', placeholder: '192.168.1.1' },
      { name: 'macAddress', label: 'MAC Address', type: 'text' },
      { name: 'vlan', label: 'VLAN', type: 'text' },
      { name: 'isp', label: 'ISP', type: 'text' },
      { name: 'locationId', label: 'Location', type: 'select', optionsFrom: 'locations' },
      { name: 'status', label: 'Status', type: 'select', options: DEVICE_STATUSES, defaultValue: 'online' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    filters: [
      { name: 'deviceType', label: 'Type', options: [
        { value: 'Router', label: 'Router' },
        { value: 'Switch', label: 'Switch' },
        { value: 'Firewall', label: 'Firewall' },
        { value: 'Wi-Fi Access Point', label: 'Wi-Fi Access Point' },
      ] },
      { name: 'status', label: 'Status', options: DEVICE_STATUSES },
    ],
  },

  servers: {
    key: 'servers',
    collection: 'servers',
    title: 'Servers',
    singular: 'Server',
    description: 'Physical and virtual servers owned by the IT department.',
    icon: Server,
    permissions: { view: 'servers.view', create: 'servers.manage', update: 'servers.manage', delete: 'servers.manage' },
    columns: [
      { key: 'name', header: 'Server', secondaryKey: 'hostname' },
      { key: 'ip', header: 'IP Address', kind: 'code' },
      { key: 'serverType', header: 'Type', hideBelow: 'sm' },
      { key: 'os', header: 'OS', hideBelow: 'md' },
      { key: 'locationId', header: 'Location', kind: 'ref', ref: 'locations', hideBelow: 'lg' },
      { key: 'status', header: 'Status', kind: 'badge', options: SERVER_STATUSES, tones: DEVICE_STATUS_TONES },
    ],
    fields: [
      { name: 'name', label: 'Server Name', type: 'text', required: true },
      { name: 'hostname', label: 'Hostname', type: 'text', required: true },
      { name: 'ip', label: 'IP Address', type: 'text', required: true },
      { name: 'ownerId', label: 'Responsible Officer', type: 'select', optionsFrom: 'users' },
      { name: 'serverType', label: 'Server Type', type: 'select', required: true, options: [
        { value: 'Physical', label: 'Physical' },
        { value: 'Virtual', label: 'Virtual' },
      ] },
      { name: 'virtualization', label: 'Virtualization', type: 'text', placeholder: 'VMware / Hyper-V / N/A' },
      { name: 'os', label: 'Operating System', type: 'text' },
      { name: 'cpu', label: 'CPU', type: 'text' },
      { name: 'ram', label: 'RAM', type: 'text' },
      { name: 'storage', label: 'Storage', type: 'text' },
      { name: 'locationId', label: 'Location', type: 'select', optionsFrom: 'locations' },
      { name: 'status', label: 'Status', type: 'select', options: SERVER_STATUSES, defaultValue: 'online' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    filters: [
      { name: 'serverType', label: 'Type', options: [
        { value: 'Physical', label: 'Physical' },
        { value: 'Virtual', label: 'Virtual' },
      ] },
      { name: 'status', label: 'Status', options: SERVER_STATUSES },
    ],
  },

  backups: {
    key: 'backups',
    collection: 'backups',
    title: 'Backups',
    singular: 'Backup',
    description: 'Backup jobs, schedules and last/next run status.',
    icon: HardHat,
    permissions: { view: 'servers.view', create: 'servers.manage', update: 'servers.manage', delete: 'servers.manage' },
    columns: [
      { key: 'name', header: 'Backup' },
      { key: 'serverId', header: 'Server', kind: 'ref', ref: 'servers' },
      { key: 'backupType', header: 'Type', hideBelow: 'sm' },
      { key: 'schedule', header: 'Schedule', hideBelow: 'md' },
      { key: 'lastBackup', header: 'Last Backup', kind: 'date', hideBelow: 'lg' },
      { key: 'status', header: 'Status', kind: 'badge', options: BACKUP_STATUSES, tones: BACKUP_STATUS_TONES },
    ],
    fields: [
      { name: 'name', label: 'Backup Name', type: 'text', required: true },
      { name: 'serverId', label: 'Server', type: 'select', optionsFrom: 'servers', required: true },
      { name: 'backupType', label: 'Backup Type', type: 'select', required: true, options: [
        { value: 'Full', label: 'Full' },
        { value: 'Incremental', label: 'Incremental' },
        { value: 'Differential', label: 'Differential' },
        { value: 'Configuration', label: 'Configuration' },
      ] },
      { name: 'schedule', label: 'Schedule', type: 'text', placeholder: 'Daily 01:00' },
      { name: 'lastBackup', label: 'Last Backup', type: 'date' },
      { name: 'nextBackup', label: 'Next Backup', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: BACKUP_STATUSES, defaultValue: 'never_run' },
      { name: 'storageLocation', label: 'Storage Location', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    filters: [{ name: 'status', label: 'Status', options: BACKUP_STATUSES }],
  },

  software: {
    key: 'software',
    collection: 'software',
    title: 'Software & Licenses',
    singular: 'Software',
    description: 'Software catalog with license keys, seats and expiry alerts.',
    icon: ShieldCheck,
    permissions: { view: 'software.view', create: 'software.manage', update: 'software.manage', delete: 'software.manage' },
    columns: [
      { key: 'name', header: 'Software' },
      { key: 'version', header: 'Version', hideBelow: 'sm' },
      { key: 'licenseType', header: 'License', kind: 'badge', options: LICENSE_TYPES },
      { key: 'usedLicenses', header: 'Used', kind: 'number' },
      { key: 'totalLicenses', header: 'Total', kind: 'number' },
      { key: 'expiryDate', header: 'Expiry', kind: 'date', hideBelow: 'lg' },
    ],
    fields: [
      { name: 'name', label: 'Software Name', type: 'text', required: true },
      { name: 'vendorId', label: 'Vendor', type: 'select', optionsFrom: 'vendors' },
      { name: 'version', label: 'Version', type: 'text' },
      { name: 'licenseType', label: 'License Type', type: 'select', options: LICENSE_TYPES, required: true },
      { name: 'licenseKey', label: 'License Key / Reference', type: 'text', full: true },
      { name: 'totalLicenses', label: 'Total Licenses', type: 'number', min: 0, required: true, defaultValue: 1 },
      { name: 'usedLicenses', label: 'Used Licenses', type: 'number', min: 0, defaultValue: 0 },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    filters: [{ name: 'licenseType', label: 'License Type', options: LICENSE_TYPES }],
  },

  maintenance: {
    key: 'maintenance',
    collection: 'maintenance',
    title: 'Maintenance',
    singular: 'Maintenance Task',
    description: 'Preventive, corrective, repair and service activities.',
    icon: Wrench,
    permissions: { view: 'maintenance.view', create: 'maintenance.manage', update: 'maintenance.manage', delete: 'maintenance.manage' },
    columns: [
      { key: 'assetId', header: 'Asset', kind: 'ref', ref: 'assets' },
      { key: 'maintenanceType', header: 'Type', kind: 'badge', options: MAINTENANCE_TYPES },
      { key: 'scheduledDate', header: 'Scheduled', kind: 'date' },
      { key: 'technician', header: 'Technician', hideBelow: 'md' },
      { key: 'status', header: 'Status', kind: 'badge', options: MAINTENANCE_STATUSES, tones: MAINTENANCE_STATUS_TONES },
    ],
    fields: [
      { name: 'assetId', label: 'Asset', type: 'select', optionsFrom: 'assets', required: true },
      { name: 'maintenanceType', label: 'Maintenance Type', type: 'select', options: MAINTENANCE_TYPES, required: true },
      { name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
      { name: 'completedDate', label: 'Completed Date', type: 'date' },
      { name: 'technician', label: 'Technician', type: 'text', required: true },
      { name: 'vendorId', label: 'Vendor', type: 'select', optionsFrom: 'vendors' },
      { name: 'cost', label: 'Cost', type: 'number', min: 0 },
      { name: 'status', label: 'Status', type: 'select', options: MAINTENANCE_STATUSES, defaultValue: 'scheduled' },
      { name: 'nextMaintenanceDate', label: 'Next Maintenance', type: 'date' },
      { name: 'description', label: 'Description', type: 'textarea', full: true, required: true },
      { name: 'findings', label: 'Findings', type: 'textarea', full: true },
      { name: 'actionTaken', label: 'Action Taken', type: 'textarea', full: true },
    ],
    filters: [
      { name: 'maintenanceType', label: 'Type', options: MAINTENANCE_TYPES },
      { name: 'status', label: 'Status', options: MAINTENANCE_STATUSES },
    ],
  },

  vendors: {
    key: 'vendors',
    collection: 'vendors',
    title: 'Vendors',
    singular: 'Vendor',
    description: 'IT vendors, service providers and AMC contracts.',
    icon: ReceiptText,
    permissions: { view: 'vendors.view', create: 'vendors.manage', update: 'vendors.manage', delete: 'vendors.manage' },
    columns: [
      { key: 'name', header: 'Vendor' },
      { key: 'contactPerson', header: 'Contact', hideBelow: 'sm' },
      { key: 'phone', header: 'Phone', hideBelow: 'md' },
      { key: 'serviceType', header: 'Service Type', hideBelow: 'lg' },
      { key: 'contractType', header: 'Contract', kind: 'badge', options: VENDOR_CONTRACT_TYPES },
    ],
    fields: [
      { name: 'name', label: 'Vendor Name', type: 'text', required: true },
      { name: 'contactPerson', label: 'Contact Person', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: VENDOR_SERVICE_TYPES.map((value) => ({ value, label: value })) },
      { name: 'contractType', label: 'Contract Type', type: 'select', options: VENDOR_CONTRACT_TYPES, defaultValue: 'none' },
      { name: 'contractStart', label: 'Contract Start', type: 'date' },
      { name: 'contractEnd', label: 'Contract End', type: 'date' },
      { name: 'address', label: 'Address', type: 'textarea', full: true },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    filters: [{ name: 'contractType', label: 'Contract', options: VENDOR_CONTRACT_TYPES }],
  },

  documents: {
    key: 'documents',
    collection: 'documents',
    title: 'IT Documents',
    singular: 'Document',
    description: 'Invoices, warranties, AMCs, licenses and technical documentation.',
    icon: FileText,
    permissions: { view: 'documents.view', create: 'documents.manage', update: 'documents.manage', delete: 'documents.manage' },
    columns: [
      { key: 'name', header: 'Document' },
      { key: 'category', header: 'Category', kind: 'badge', options: DOCUMENT_CATEGORIES },
      { key: 'relatedType', header: 'Related To', hideBelow: 'md' },
      { key: 'confidential', header: 'Confidential', kind: 'boolean', hideBelow: 'lg' },
      { key: 'createdAt', header: 'Uploaded', kind: 'date', hideBelow: 'sm' },
    ],
    fields: [
      { name: 'name', label: 'Document Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: DOCUMENT_CATEGORIES, required: true },
      { name: 'relatedType', label: 'Related Module', type: 'select', options: [
        { value: 'assets', label: 'Assets' },
        { value: 'servers', label: 'Servers' },
        { value: 'network_devices', label: 'Network' },
        { value: 'software', label: 'Software' },
        { value: 'vendors', label: 'Vendors' },
        { value: 'tickets', label: 'Tickets' },
      ] },
      { name: 'relatedId', label: 'Related Record ID', type: 'text' },
      { name: 'url', label: 'File URL / Reference', type: 'text', full: true, help: 'Paste a shared drive link, or the Apps Script will store uploaded files.' },
      { name: 'confidential', label: 'Confidential', type: 'checkbox' },
    ],
    filters: [{ name: 'category', label: 'Category', options: DOCUMENT_CATEGORIES }],
  },

  users: {
    key: 'users',
    collection: 'users',
    title: 'Users',
    singular: 'User',
    description: 'Application users and their roles.',
    icon: UserCog,
    permissions: { view: 'users.manage', create: 'users.manage', update: 'users.manage', delete: 'users.manage' },
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role', kind: 'badge', options: ROLES },
      { key: 'department', header: 'Department', hideBelow: 'md' },
      { key: 'active', header: 'Active', kind: 'boolean' },
    ],
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'role', label: 'Role', type: 'select', options: ROLES, required: true, defaultValue: 'employee' },
      { name: 'employeeId', label: 'Linked Employee', type: 'select', optionsFrom: 'employees' },
      { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
    filters: [
      { name: 'role', label: 'Role', options: ROLES },
      { name: 'active', label: 'Active', options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ] },
    ],
  },

  'ticket-categories': {
    key: 'ticket-categories',
    collection: 'ticket_categories',
    title: 'Ticket Categories',
    singular: 'Category',
    description: 'Top-level ticket categories shown to users.',
    icon: Tags,
    permissions: { view: 'settings.view', create: 'lookup.manage', update: 'lookup.manage', delete: 'lookup.manage' },
    columns: [
      { key: 'name', header: 'Category' },
      { key: 'icon', header: 'Icon', kind: 'code' },
      { key: 'active', header: 'Active', kind: 'boolean' },
    ],
    fields: [
      { name: 'name', label: 'Category Name', type: 'text', required: true },
      { name: 'icon', label: 'Icon Key', type: 'text', placeholder: 'Cpu', defaultValue: 'CircleHelp' },
      { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
  },

  'ticket-subcategories': {
    key: 'ticket-subcategories',
    collection: 'ticket_subcategories',
    title: 'Ticket Sub-categories',
    singular: 'Sub-category',
    description: 'Sub-categories grouped under each ticket category.',
    icon: ListTree,
    permissions: { view: 'settings.view', create: 'lookup.manage', update: 'lookup.manage', delete: 'lookup.manage' },
    columns: [
      { key: 'name', header: 'Sub-category' },
      { key: 'categoryId', header: 'Category', kind: 'ref', ref: 'ticket_categories' },
      { key: 'active', header: 'Active', kind: 'boolean' },
    ],
    fields: [
      { name: 'categoryId', label: 'Category', type: 'select', optionsFrom: 'ticket_categories', required: true },
      { name: 'name', label: 'Sub-category Name', type: 'text', required: true },
      { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
    filters: [{ name: 'categoryId', label: 'Category', optionsFrom: 'ticket_categories' }],
  },
}
