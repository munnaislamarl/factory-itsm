import {
  ArrowLeft,
  Building2,
  Calendar,
  Hash,
  MapPin,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Tag,
  User,
  Wrench,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Timeline } from '@/components/common/Timeline'
import type { TimelineItem } from '@/components/common/Timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { useAuth } from '@/hooks/useAuth'
import { useLookups } from '@/hooks/useLookups'
import { getErrorMessage } from '@/services/apiClient'
import { dataSource } from '@/services/datasource'
import type { Asset, AssetAssignment, AssetHistory, AssetTransfer, Maintenance } from '@/types'
import { ASSET_STATUS_TONES, MAINTENANCE_TYPES, optionLabel } from '@/utils/constants'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || '—'}</p>
      </div>
    </div>
  )
}

export function AssetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const { data: lookups, nameFor } = useLookups()

  const assetRes = useAsyncResource<Asset>(() => dataSource.get<Asset>('assets', id as string), [id])
  const assignmentsRes = useAsyncResource<AssetAssignment[]>(
    () => dataSource.list<AssetAssignment>('asset_assignments', { filters: { assetId: id } }),
    [id],
  )
  const transfersRes = useAsyncResource<AssetTransfer[]>(
    () => dataSource.list<AssetTransfer>('asset_transfers', { filters: { assetId: id } }),
    [id],
  )
  const historyRes = useAsyncResource<AssetHistory[]>(
    () => dataSource.list<AssetHistory>('asset_history', { filters: { assetId: id } }),
    [id],
  )
  const maintenanceRes = useAsyncResource<Maintenance[]>(
    () => dataSource.list<Maintenance>('maintenance', { filters: { assetId: id } }),
    [id],
  )

  const [qr, setQr] = useState('')
  const [employee, setEmployee] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const asset = assetRes.data

  useEffect(() => {
    if (!asset) return
    QRCode.toDataURL(asset.assetTag, { margin: 1, width: 220 }).then(setQr).catch(() => setQr(''))
  }, [asset])

  async function refreshAll() {
    await Promise.all([assetRes.refresh(), assignmentsRes.refresh(), transfersRes.refresh(), historyRes.refresh(), maintenanceRes.refresh()])
  }

  async function runAction(action: Parameters<typeof dataSource.assetAction>[0], payload: Record<string, unknown> = {}) {
    if (!asset) return
    setBusy(true)
    try {
      await dataSource.assetAction(action, { assetId: asset.id, ...payload }, user?.name ?? 'system')
      toast.success(`Asset ${action.replace('_', ' ')} successful`)
      await refreshAll()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  function printLabel() {
    if (!asset) return
    const win = window.open('', '_blank', 'width=420,height=520')
    if (!win) return
    win.document.write(`
      <html><head><title>${asset.assetTag}</title>
      <style>body{font-family:Inter,Arial,sans-serif;padding:24px;text-align:center}
      .tag{font-size:20px;font-weight:700;margin-bottom:4px}
      .name{font-size:14px;color:#444;margin-bottom:12px}
      .meta{font-size:12px;color:#666;margin-top:12px;text-align:left;line-height:1.6}</style></head>
      <body onload="window.print()">
        <div class="tag">${asset.assetTag}</div>
        <div class="name">${asset.name}</div>
        <img src="${qr}" width="200" height="200" alt="QR" />
        <div class="meta">
          <div>Brand / Model: ${asset.brand || '—'} ${asset.model || ''}</div>
          <div>Serial: ${asset.serialNumber || '—'}</div>
          <div>Department: ${nameFor('departments', asset.departmentId) || '—'}</div>
          <div>Warranty: ${formatDate(asset.warrantyEnd)}</div>
        </div>
      </body></html>
    `)
    win.document.close()
  }

  if (assetRes.loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (assetRes.error || !asset) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/assets')}>
          <ArrowLeft className="h-4 w-4" /> Back to assets
        </Button>
        <Card className="p-10 text-center text-sm text-muted-foreground">{assetRes.error ?? 'Asset not found.'}</Card>
      </div>
    )
  }

  const canManage = can('assets.update')
  const activeAssignment = (assignmentsRes.data ?? []).find((item) => !item.returnedAt)

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate('/app/assets')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to assets
      </button>

      <PageHeader
        title={asset.name}
        description={`${asset.assetTag} · ${asset.typeId}`}
        actions={
          <>
            <StatusBadge label={optionLabel(
              [
                { value: 'available', label: 'Available' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'in_repair', label: 'In Repair' },
                { value: 'under_maintenance', label: 'Under Maintenance' },
                { value: 'lost', label: 'Lost' },
                { value: 'damaged', label: 'Damaged' },
                { value: 'retired', label: 'Retired' },
                { value: 'disposed', label: 'Disposed' },
              ],
              asset.status,
            )} tone={ASSET_STATUS_TONES[asset.status] ?? 'muted'} />
            <Button variant="outline" size="sm" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="pb-0"><CardTitle>Asset Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
              <div>
                <Info icon={Tag} label="Asset Tag" value={asset.assetTag} />
                <Info icon={Hash} label="Serial Number" value={asset.serialNumber} />
                <Info icon={Building2} label="Department" value={nameFor('departments', asset.departmentId)} />
                <Info icon={MapPin} label="Location" value={nameFor('locations', asset.locationId)} />
                <Info icon={Calendar} label="Purchase Date" value={formatDate(asset.purchaseDate)} />
                <Info icon={Tag} label="Purchase Cost" value={formatCurrency(asset.purchaseCost)} />
              </div>
              <div>
                <Info icon={User} label="Assigned To" value={asset.assignedEmployeeId ? nameFor('employees', asset.assignedEmployeeId) : 'Unassigned'} />
                <Info icon={ShieldCheck} label="Warranty" value={`${formatDate(asset.warrantyStart)} → ${formatDate(asset.warrantyEnd)}`} />
                <Info icon={Tag} label="Brand / Model" value={`${asset.brand || '—'} ${asset.model || ''}`} />
                <Info icon={Tag} label="Condition" value={asset.condition} />
                <Info icon={Tag} label="Vendor" value={nameFor('vendors', asset.vendorId)} />
                <Info icon={Wrench} label="Type" value={asset.typeId} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="history">
                <TabsList>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                  <TabsTrigger value="transfers">Transfers</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>
                <TabsContent value="history">
                  <Timeline
                    items={(historyRes.data ?? []).map<TimelineItem>((item) => ({
                      id: item.id,
                      title: item.action,
                      description: item.detail,
                      actor: item.actor,
                      timestamp: item.createdAt,
                      tone: item.action.toLowerCase().includes('repair') ? 'warning' : 'default',
                    }))}
                    emptyLabel="No asset history yet."
                  />
                </TabsContent>
                <TabsContent value="assignments">
                  <Timeline
                    items={(assignmentsRes.data ?? []).map<TimelineItem>((item) => ({
                      id: item.id,
                      title: `Assigned to ${item.employeeName ?? nameFor('employees', item.employeeId)}`,
                      description: item.returnedAt ? `Returned ${formatDate(item.returnedAt)}` : 'Currently assigned',
                      actor: item.assignedBy,
                      timestamp: item.assignedAt,
                      tone: item.returnedAt ? 'muted' : 'success',
                    }))}
                    emptyLabel="No assignments yet."
                  />
                </TabsContent>
                <TabsContent value="transfers">
                  <Timeline
                    items={(transfersRes.data ?? []).map<TimelineItem>((item) => ({
                      id: item.id,
                      title: `Transferred to ${nameFor('employees', item.toEmployeeId)}`,
                      description: item.reason,
                      actor: item.by,
                      timestamp: item.transferredAt,
                      tone: 'info',
                    }))}
                    emptyLabel="No transfers recorded."
                  />
                </TabsContent>
                <TabsContent value="maintenance">
                  <Timeline
                    items={(maintenanceRes.data ?? []).map<TimelineItem>((item) => ({
                      id: item.id,
                      title: `${optionLabel(MAINTENANCE_TYPES, item.maintenanceType)} — ${item.status}`,
                      description: `${item.description}${item.technician ? ` · ${item.technician}` : ''}`,
                      timestamp: item.scheduledDate,
                      tone: item.status === 'completed' ? 'success' : 'warning',
                    }))}
                    emptyLabel="No maintenance records."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle>Asset Label</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {qr ? <img src={qr} alt="Asset QR code" className="h-40 w-40 rounded-lg border border-border bg-white p-2" /> : <QrCode className="h-16 w-16 text-muted-foreground" />}
              <p className="font-mono text-xs text-muted-foreground">{asset.assetTag}</p>
              <Button variant="outline" size="sm" onClick={printLabel}>
                <Printer className="h-4 w-4" /> Print label
              </Button>
            </CardContent>
          </Card>

          {canManage ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle>Asset Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={employee} onValueChange={setEmployee}>
                  <SelectTrigger><SelectValue placeholder={activeAssignment ? 'Transfer to employee…' : 'Assign to employee…'} /></SelectTrigger>
                  <SelectContent>
                    {lookups.employees.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Reason / note (optional)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!employee || busy}
                    onClick={() => runAction(activeAssignment ? 'transfer' : 'assign', activeAssignment
                      ? { toEmployeeId: employee, reason }
                      : { employeeId: employee, employeeName: nameFor('employees', employee), note: reason })}
                  >
                    {activeAssignment ? 'Transfer' : 'Assign'}
                  </Button>
                  {activeAssignment ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => runAction('return', { note: reason })}>Return</Button>
                  ) : null}
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => runAction('send_repair', { note: reason })}>Send to repair</Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => runAction('repair_done', { note: reason })}>Repair done</Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => runAction('retire', { note: reason })}>Retire</Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => runAction('dispose', { note: reason })}>Dispose</Button>
                </div>
                {activeAssignment ? (
                  <p className="text-xs text-muted-foreground">
                    Assigned to {activeAssignment.employeeName ?? nameFor('employees', activeAssignment.employeeId)} since {formatDateTime(activeAssignment.assignedAt)}.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
