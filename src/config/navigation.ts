import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bell,
  Building2,
  Cpu,
  FileText,
  HardHat,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Network,
  Package,
  ReceiptText,
  Server,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'

import type { Permission } from '@/utils/permissions'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission?: Permission
  end?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
      { to: '/app/tickets', label: 'Service Desk', icon: LifeBuoy, permission: 'tickets.view' },
      { to: '/app/notifications', label: 'Notifications', icon: Bell, permission: 'notifications.view' },
    ],
  },
  {
    label: 'IT Assets',
    items: [
      { to: '/app/assets', label: 'Assets', icon: Cpu, permission: 'assets.view' },
      { to: '/app/maintenance', label: 'Maintenance', icon: Wrench, permission: 'maintenance.view' },
      { to: '/app/spare-parts', label: 'Spare Parts', icon: Package, permission: 'spares.view' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { to: '/app/network', label: 'Network', icon: Network, permission: 'network.view' },
      { to: '/app/servers', label: 'Servers', icon: Server, permission: 'servers.view' },
      { to: '/app/backups', label: 'Backups', icon: HardHat, permission: 'servers.view' },
      { to: '/app/software', label: 'Software & Licenses', icon: ShieldCheck, permission: 'software.view' },
    ],
  },
  {
    label: 'Organisation',
    items: [
      { to: '/app/employees', label: 'Employees', icon: Users, permission: 'employees.view' },
      { to: '/app/departments', label: 'Departments', icon: Building2, permission: 'employees.view' },
      { to: '/app/locations', label: 'Locations', icon: MapPin, permission: 'employees.view' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/app/vendors', label: 'Vendors', icon: ReceiptText, permission: 'vendors.view' },
      { to: '/app/documents', label: 'Documents', icon: FileText, permission: 'documents.view' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/app/reports', label: 'Reports', icon: Activity, permission: 'reports.view' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/app/users', label: 'Users', icon: UserCog, permission: 'users.manage' },
      { to: '/app/settings', label: 'Settings', icon: Settings, permission: 'settings.view' },
    ],
  },
]
