import type { Role } from '@/types'

export const PERMISSIONS = [
  'dashboard.view',
  'tickets.view',
  'tickets.view_all',
  'tickets.create',
  'tickets.update',
  'tickets.assign',
  'tickets.resolve',
  'tickets.close',
  'tickets.delete',
  'tickets.comment',
  'assets.view',
  'assets.view_all',
  'assets.create',
  'assets.update',
  'assets.delete',
  'assets.assign',
  'employees.view',
  'employees.manage',
  'locations.manage',
  'network.view',
  'network.manage',
  'servers.view',
  'servers.manage',
  'software.view',
  'software.manage',
  'maintenance.view',
  'maintenance.manage',
  'spares.view',
  'spares.manage',
  'spares.consume',
  'vendors.view',
  'vendors.manage',
  'documents.view',
  'documents.manage',
  'reports.view',
  'reports.export',
  'notifications.view',
  'audit.view',
  'settings.view',
  'users.manage',
  'roles.manage',
  'lookup.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ALL = [...PERMISSIONS]

const IT_OFFICER: Permission[] = [
  'dashboard.view',
  'tickets.view',
  'tickets.view_all',
  'tickets.create',
  'tickets.update',
  'tickets.resolve',
  'tickets.comment',
  'assets.view',
  'assets.view_all',
  'assets.update',
  'assets.assign',
  'employees.view',
  'network.view',
  'network.manage',
  'servers.view',
  'servers.manage',
  'software.view',
  'software.manage',
  'maintenance.view',
  'maintenance.manage',
  'spares.view',
  'spares.manage',
  'spares.consume',
  'vendors.view',
  'vendors.manage',
  'documents.view',
  'documents.manage',
  'reports.view',
  'notifications.view',
]

const IT_MANAGER: Permission[] = [
  ...IT_OFFICER,
  'tickets.assign',
  'tickets.close',
  'tickets.delete',
  'assets.create',
  'assets.delete',
  'settings.view',
  'users.manage',
  'lookup.manage',
  'reports.export',
  'audit.view',
]

const EMPLOYEE: Permission[] = [
  'dashboard.view',
  'tickets.view',
  'tickets.create',
  'tickets.comment',
  'assets.view',
  'notifications.view',
]

const VIEWER: Permission[] = ['dashboard.view', 'reports.view']

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  it_manager: IT_MANAGER,
  it_officer: IT_OFFICER,
  employee: EMPLOYEE,
  viewer: VIEWER,
}

export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(
  role: Role | undefined | null,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

export function canViewAllTickets(role: Role | undefined | null): boolean {
  return hasPermission(role, 'tickets.view_all')
}

export function canViewAllAssets(role: Role | undefined | null): boolean {
  return hasPermission(role, 'assets.view_all')
}
