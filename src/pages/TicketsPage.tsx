import { Download, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import type { Column } from '@/components/common/DataTable'
import { DataTable } from '@/components/common/DataTable'
import { DataTablePagination } from '@/components/common/DataTablePagination'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { PriorityBadge, TicketStatusBadge } from '@/components/common/StatusBadge'
import { TicketFormDialog } from '@/components/tickets/TicketFormDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { useDebounce } from '@/hooks/useDebounce'
import { useLookups } from '@/hooks/useLookups'
import type { Ticket } from '@/types'
import { OPEN_STATUSES, PRIORITIES, TICKET_STATUSES } from '@/utils/constants'
import { downloadCsv } from '@/utils/csv'
import { formatDate, formatRelative } from '@/utils/format'
import { canViewAllTickets } from '@/utils/permissions'

export function TicketsPage() {
  const { user, can } = useAuth()
  const navigate = useNavigate()
  const { nameFor } = useLookups()
  const api = useCollection<Ticket>('tickets', { sortBy: 'createdAt', sortDir: 'desc' })
  const canViewAll = canViewAllTickets(user?.role)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)

  const scoped = useMemo(() => {
    if (canViewAll) return api.items
    return api.items.filter((ticket) => ticket.requesterId === user?.employeeId || ticket.assignedTo === user?.id)
  }, [api.items, canViewAll, user?.employeeId, user?.id])

  const filtered = useMemo(() => {
    let rows = scoped.slice()
    const term = debouncedSearch.trim().toLowerCase()
    if (term) {
      rows = rows.filter((ticket) =>
        [ticket.code, ticket.title, ticket.requesterName, ticket.assignedToName]
          .some((value) => String(value ?? '').toLowerCase().includes(term)),
      )
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return
      rows = rows.filter((ticket) => String((ticket as unknown as Record<string, unknown>)[key] ?? '') === value)
    })
    return rows
  }, [scoped, debouncedSearch, filters])

  const total = filtered.length
  const paged = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  const columns: Column<Ticket>[] = [
    {
      key: 'code',
      header: 'Ticket',
      render: (ticket) => (
        <div className="min-w-0">
          <span className="font-mono text-xs text-muted-foreground">{ticket.code}</span>
          <span className="block max-w-[320px] truncate font-medium text-foreground" title={ticket.title}>
            {ticket.title}
          </span>
        </div>
      ),
    },
    { key: 'requesterName', header: 'Requester', hideBelow: 'md', render: (ticket) => ticket.requesterName },
    {
      key: 'categoryId',
      header: 'Category',
      hideBelow: 'lg',
      render: (ticket) => nameFor('ticket_categories', ticket.categoryId),
    },
    { key: 'priority', header: 'Priority', render: (ticket) => <PriorityBadge priority={ticket.priority} /> },
    { key: 'status', header: 'Status', render: (ticket) => <TicketStatusBadge status={ticket.status} /> },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      hideBelow: 'md',
      render: (ticket) => ticket.assignedToName || (ticket.assignedTo ? nameFor('users', ticket.assignedTo) : '—'),
    },
    {
      key: 'dueDate',
      header: 'Due',
      hideBelow: 'lg',
      render: (ticket) => {
        const breached = ticket.dueDate && new Date(ticket.dueDate).getTime() < Date.now() && OPEN_STATUSES.includes(ticket.status)
        return (
          <span className={breached ? 'font-medium text-destructive' : 'text-muted-foreground'}>
            {formatRelative(ticket.dueDate)}
          </span>
        )
      },
    },
  ]

  const activeFilters = Object.entries(filters).filter(([, value]) => value)

  return (
    <div className="space-y-5">
      <PageHeader
        title="IT Service Desk"
        description={canViewAll ? 'All support tickets across the factory.' : 'Your support tickets.'}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => api.refresh()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadCsv('tickets-export', filtered, [
                  { header: 'Ticket', value: (row) => row.code },
                  { header: 'Title', value: (row) => row.title },
                  { header: 'Requester', value: (row) => row.requesterName },
                  { header: 'Priority', value: (row) => row.priority },
                  { header: 'Status', value: (row) => row.status },
                  { header: 'Assigned To', value: (row) => row.assignedToName ?? '' },
                  { header: 'Due', value: (row) => formatDate(row.dueDate) },
                ])
                toast.success('Tickets exported')
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            {can('tickets.create') ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            ) : null}
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            onClear={() => setSearch('')}
            placeholder="Search tickets…"
            className="lg:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Select value={filters.status ?? 'all'} onValueChange={(value) => { setFilters((prev) => ({ ...prev, status: value === 'all' ? '' : value })); setPage(1) }}>
              <SelectTrigger className="h-10 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {TICKET_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.priority ?? 'all'} onValueChange={(value) => { setFilters((prev) => ({ ...prev, priority: value === 'all' ? '' : value })); setPage(1) }}>
              <SelectTrigger className="h-10 w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activeFilters.length > 0 ? (
            <span className="text-xs text-muted-foreground">{total} matching ticket(s)</span>
          ) : null}
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl">
        <DataTable
          columns={columns}
          data={paged}
          rowKey={(ticket) => ticket.id}
          loading={api.loading}
          error={api.error}
          onRetry={api.refresh}
          onRowClick={(ticket) => navigate(`/app/tickets/${ticket.id}`)}
          emptyTitle="No tickets found"
          emptyDescription={can('tickets.create') ? 'Raise a new ticket to get IT support.' : 'Nothing to show right now.'}
        />
        <div className="rounded-b-xl border border-t-0 border-border bg-card">
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
            loading={api.loading}
          />
        </div>
      </div>

      <TicketFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
