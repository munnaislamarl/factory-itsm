import { ArrowDownToLine, ArrowUpFromLine, PackagePlus, Pencil, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Column } from '@/components/common/DataTable'
import { DataTable } from '@/components/common/DataTable'
import { ResourceFormDialog } from '@/components/resource/ResourceFormDialog'
import type { FormValues } from '@/components/resource/ResourceFormDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ResourceConfig } from '@/config/resources'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { useDebounce } from '@/hooks/useDebounce'
import { useLookups } from '@/hooks/useLookups'
import { getErrorMessage } from '@/services/apiClient'
import { dataSource } from '@/services/datasource'
import type { SparePart, SpareTransaction } from '@/types'
import { SPARE_CATEGORIES, SPARE_TRANSACTION_TYPES, optionLabel } from '@/utils/constants'
import { formatCurrency, formatDateTime } from '@/utils/format'

const SPARE_CONFIG: ResourceConfig = {
  key: 'spare-parts',
  collection: 'spare_parts',
  title: 'Spare Parts',
  singular: 'Spare Part',
  description: 'IT spare parts stock and transactions.',
  icon: PackagePlus,
  permissions: { view: 'spares.view', create: 'spares.manage', update: 'spares.manage', delete: 'spares.manage' },
  columns: [],
  fields: [
    { name: 'name', label: 'Part Name', type: 'text', required: true },
    { name: 'sku', label: 'SKU', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'select', options: SPARE_CATEGORIES.map((value) => ({ value, label: value })), required: true },
    { name: 'unit', label: 'Unit', type: 'text', defaultValue: 'pcs' },
    { name: 'minimumStock', label: 'Minimum Stock', type: 'number', min: 0, defaultValue: 5, required: true },
    { name: 'unitCost', label: 'Unit Cost', type: 'number', min: 0 },
    { name: 'currentStock', label: 'Opening Stock', type: 'number', min: 0, defaultValue: 0 },
    { name: 'location', label: 'Storage Location', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea', full: true },
  ],
}

export function SparePartsPage() {
  const { user, can } = useAuth()
  const { nameFor } = useLookups()
  const parts = useCollection<SparePart>('spare_parts', { sortBy: 'name', sortDir: 'asc' })
  const transactions = useCollection<SpareTransaction>('spare_transactions', { sortBy: 'createdAt', sortDir: 'desc' })

  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 250)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SparePart | null>(null)
  const [stockOpen, setStockOpen] = useState(false)
  const [stockPart, setStockPart] = useState<SparePart | null>(null)
  const [stockType, setStockType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [stockQty, setStockQty] = useState('1')
  const [stockNote, setStockNote] = useState('')
  const [stockTicket, setStockTicket] = useState('')
  const [busy, setBusy] = useState(false)

  const canManage = can('spares.manage')

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    if (!term) return parts.items
    return parts.items.filter((part) =>
      [part.name, part.sku, part.category].some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [parts.items, debounced])

  function openStock(part: SparePart, type: 'in' | 'out' | 'adjustment') {
    setStockPart(part)
    setStockType(type)
    setStockQty('1')
    setStockNote('')
    setStockTicket('')
    setStockOpen(true)
  }

  async function submitStock() {
    if (!stockPart) return
    const qty = Number(stockQty)
    if (!qty || (stockType !== 'out' && qty <= 0)) {
      toast.error('Enter a valid quantity')
      return
    }
    setBusy(true)
    try {
      await dataSource.spareAction(
        {
          sparePartId: stockPart.id,
          type: stockType,
          quantity: stockType === 'out' ? Math.abs(qty) : qty,
          note: stockNote,
          ticketId: stockTicket || undefined,
        },
        user?.name ?? 'system',
      )
      toast.success('Stock updated')
      setStockOpen(false)
      await Promise.all([parts.refresh(), transactions.refresh()])
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const columns: Column<SparePart>[] = [
    {
      key: 'name',
      header: 'Spare Part',
      render: (part) => (
        <div>
          <span className="font-medium text-foreground">{part.name}</span>
          <span className="block text-xs text-muted-foreground">{part.sku} · {part.category}</span>
        </div>
      ),
    },
    { key: 'currentStock', header: 'Stock', render: (part) => <span className="tabular-nums font-semibold">{part.currentStock} {part.unit}</span> },
    { key: 'minimumStock', header: 'Min', hideBelow: 'sm', render: (part) => <span className="tabular-nums text-muted-foreground">{part.minimumStock}</span> },
    { key: 'unitCost', header: 'Unit Cost', hideBelow: 'md', render: (part) => <span className="tabular-nums">{formatCurrency(part.unitCost)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (part) => (
        <StatusBadge
          label={part.currentStock <= part.minimumStock ? 'Low Stock' : 'In Stock'}
          tone={part.currentStock <= part.minimumStock ? 'destructive' : 'success'}
        />
      ),
    },
  ]

  if (canManage) {
    columns.push({
      key: '__actions',
      header: '',
      render: (part) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Stock in" title="Stock in" onClick={() => openStock(part, 'in')}>
            <ArrowDownToLine className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Stock out" title="Stock out" onClick={() => openStock(part, 'out')}>
            <ArrowUpFromLine className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Adjust" title="Adjust" onClick={() => openStock(part, 'adjustment')}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => { setEditing(part); setDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    })
  }

  async function handleSubmit(values: FormValues) {
    const actor = user?.name ?? 'system'
    if (editing) {
      await parts.update(editing.id, values, actor)
      toast.success('Spare part updated')
    } else {
      await parts.create(values, actor)
      toast.success('Spare part created')
    }
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="IT Spare Parts"
        description="Track IT spare stock, minimum levels and every stock movement."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => { parts.refresh(); transactions.refresh() }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {canManage ? (
              <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }}>
                <PackagePlus className="h-4 w-4" /> New Part
              </Button>
            ) : null}
          </>
        }
      />

      <Tabs defaultValue="parts">
        <TabsList>
          <TabsTrigger value="parts">Stock</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="parts" className="space-y-4">
          <Card className="p-4">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search spare parts…"
              className="lg:max-w-xs"
            />
          </Card>
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(part) => part.id}
            loading={parts.loading}
            error={parts.error}
            onRetry={parts.refresh}
            emptyTitle="No spare parts"
            emptyDescription="Add spare parts to track stock levels."
          />
        </TabsContent>

        <TabsContent value="transactions">
          <DataTable
            columns={[
              { key: 'createdAt', header: 'Date', render: (txn) => <span className="text-muted-foreground">{formatDateTime(txn.createdAt)}</span> },
              { key: 'sparePartId', header: 'Spare Part', render: (txn) => nameFor('spare_parts', txn.sparePartId) },
              { key: 'type', header: 'Type', render: (txn) => <StatusBadge label={optionLabel(SPARE_TRANSACTION_TYPES, txn.type)} tone={txn.type === 'in' ? 'success' : txn.type === 'out' ? 'warning' : 'info'} /> },
              { key: 'quantity', header: 'Qty', render: (txn) => <span className="tabular-nums">{txn.quantity}</span> },
              { key: 'ticketId', header: 'Ticket', hideBelow: 'md', render: (txn) => txn.ticketId ?? '—' },
              { key: 'actor', header: 'By', hideBelow: 'lg', render: (txn) => txn.actor },
              { key: 'note', header: 'Note', hideBelow: 'lg', render: (txn) => <span className="text-muted-foreground">{txn.note || '—'}</span> },
            ]}
            data={transactions.items}
            rowKey={(txn) => txn.id}
            loading={transactions.loading}
            error={transactions.error}
            onRetry={transactions.refresh}
            emptyTitle="No transactions"
            emptyDescription="Stock in/out movements will appear here."
          />
        </TabsContent>
      </Tabs>

      <ResourceFormDialog
        config={SPARE_CONFIG}
        open={dialogOpen}
        onOpenChange={(next) => { setDialogOpen(next); if (!next) setEditing(null) }}
        initial={editing as unknown as Record<string, unknown> | null}
        onSubmit={handleSubmit}
      />

      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {stockType === 'in' ? 'Stock In' : stockType === 'out' ? 'Stock Out' : 'Stock Adjustment'}
            </DialogTitle>
            <DialogDescription>
              {stockPart?.name} — current stock {stockPart?.currentStock} {stockPart?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={stockType} onValueChange={(value) => setStockType(value as typeof stockType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPARE_TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty">Quantity {stockType === 'adjustment' ? '(use negative to decrease)' : ''}</Label>
              <Input id="qty" type="number" value={stockQty} onChange={(event) => setStockQty(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticket">Linked Ticket (optional)</Label>
              <Input id="ticket" value={stockTicket} onChange={(event) => setStockTicket(event.target.value)} placeholder="tkt_003" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note</Label>
              <Input id="note" value={stockNote} onChange={(event) => setStockNote(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submitStock} loading={busy} disabled={busy}>Save movement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
