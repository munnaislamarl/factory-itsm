import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import type { Permission } from '@/utils/permissions'

interface RoleGuardProps {
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  children: ReactNode
}

export function RoleGuard({ permission, permissions, requireAll = false, children }: RoleGuardProps) {
  const { can } = useAuth()
  const required = permissions ?? (permission ? [permission] : [])
  const allowed = required.length === 0
    ? true
    : requireAll
      ? required.every((item) => can(item))
      : required.some((item) => can(item))

  if (!allowed) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={ShieldAlert}
          title="Access restricted"
          description="You do not have permission to view this page. Contact your IT administrator if you believe this is a mistake."
        />
      </div>
    )
  }

  return <>{children}</>
}
