import { Check, Inbox, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ResourcePage } from '@/components/resource/ResourcePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RESOURCES } from '@/config/resources'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/apiClient'
import { dataSource } from '@/services/datasource'
import type { AccessRequest, Role } from '@/types'
import { ROLES } from '@/utils/constants'
import { formatDateTime } from '@/utils/format'

const APPROVABLE_ROLES = ROLES.filter((role) => role.value !== 'super_admin')

export function UsersPage() {
  return (
    <div className="space-y-5">
      <ResourcePage config={RESOURCES.users} />
      <PendingAccessRequests />
    </div>
  )
}

function PendingAccessRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)
  const [roles, setRoles] = useState<Record<string, Role>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const all = await dataSource.listAccessRequests()
      setRequests(all.filter((request) => request.status === 'pending'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function approve(request: AccessRequest) {
    setBusyId(request.id)
    try {
      await dataSource.approveAccessRequest(request.id, roles[request.id] ?? 'employee', user?.name ?? 'admin')
      toast.success(`Access approved for ${request.email}`)
      await load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  async function reject(request: AccessRequest) {
    setBusyId(request.id)
    try {
      await dataSource.rejectAccessRequest(request.id, user?.name ?? 'admin')
      toast.success(`Request from ${request.email} rejected`)
      await load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Pending Access Requests</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOpen((prev) => !prev)}>
          <UserPlus className="h-4 w-4" />
          {requests.length} Pending
        </Button>
      </CardHeader>

      {open ? (
        <CardContent>
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading requests…</p>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No pending access requests"
              description="When someone requests access from the login screen, it will appear here."
            />
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium text-foreground">{request.name}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    {request.note ? <p className="text-sm text-foreground">{request.note}</p> : null}
                    <p className="text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Select
                      value={roles[request.id] ?? 'employee'}
                      onValueChange={(value) => setRoles((prev) => ({ ...prev, [request.id]: value as Role }))}
                    >
                      <SelectTrigger className="h-9 w-[180px]">
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
                    <Button variant="success" size="sm" loading={busyId === request.id} onClick={() => approve(request)}>
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" disabled={busyId === request.id} onClick={() => reject(request)}>
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  )
}
