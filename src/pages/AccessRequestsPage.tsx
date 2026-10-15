import { Check, Clock, Inbox, RefreshCw, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/apiClient'
import { dataSource } from '@/services/datasource'
import type { AccessRequest, Role } from '@/types'
import { ROLES } from '@/utils/constants'
import { formatDateTime } from '@/utils/format'

const APPROVABLE_ROLES = ROLES.filter((role) => role.value !== 'super_admin')

function statusTone(status: AccessRequest['status']) {
  if (status === 'approved') return 'success' as const
  if (status === 'rejected') return 'destructive' as const
  return 'warning' as const
}

export function AccessRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Record<string, Role>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRequests(await dataSource.listAccessRequests())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pending = requests.filter((request) => request.status === 'pending')
  const processed = requests.filter((request) => request.status !== 'pending')

  async function approve(request: AccessRequest) {
    setBusyId(request.id)
    try {
      await dataSource.approveAccessRequest(request.id, roles[request.id] ?? 'employee', user?.name ?? 'admin')
      toast.success(`Access approved for ${request.email}`)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function reject(request: AccessRequest) {
    setBusyId(request.id)
    try {
      await dataSource.rejectAccessRequest(request.id, user?.name ?? 'admin')
      toast.success(`Access request from ${request.email} rejected`)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Access Requests"
        description="Review and approve account requests submitted from the login screen."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : loading ? (
        <Card className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="No access requests"
            description="When someone requests access from the login screen, it will appear here for review."
          />
        </Card>
      ) : (
        <div className="space-y-5">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Pending ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Check}
                  title="All caught up"
                  description="There are no pending access requests right now."
                />
              </Card>
            ) : (
              pending.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  busy={busyId === request.id}
                  role={roles[request.id] ?? 'employee'}
                  onRoleChange={(value) => setRoles((prev) => ({ ...prev, [request.id]: value }))}
                  onApprove={() => approve(request)}
                  onReject={() => reject(request)}
                />
              ))
            )}
          </section>

          {processed.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Processed ({processed.length})
              </h2>
              {processed.map((request) => (
                <RequestCard key={request.id} request={request} busy={false} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

function RequestCard({
  request,
  busy,
  role,
  onRoleChange,
  onApprove,
  onReject,
}: {
  request: AccessRequest
  busy: boolean
  role?: Role
  onRoleChange?: (value: Role) => void
  onApprove?: () => void
  onReject?: () => void
}) {
  const isPending = request.status === 'pending'
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{request.name}</span>
            <Badge variant={statusTone(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{request.email}</p>
          {request.note ? <p className="text-sm text-foreground">{request.note}</p> : null}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatDateTime(request.createdAt)}
          </p>
        </div>

        {isPending && onApprove && onReject && onRoleChange ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Select value={role} onValueChange={onRoleChange}>
              <SelectTrigger className="h-10 w-[200px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {APPROVABLE_ROLES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="success" size="sm" loading={busy} onClick={onApprove}>
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={onReject}>
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
