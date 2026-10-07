import { Download, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import type { Column } from '@/components/common/DataTable'
import { DataTable } from '@/components/common/DataTable'
import { DataTablePagination } from '@/components/common/DataTablePagination'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ResourceFormDialog } from '@/components/resource/ResourceFormDialog'
import type { FormValues } from '@/components/resource/ResourceFormDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ColumnConfig, ResourceConfig } from '@/config/resources'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { useDebounce } from '@/hooks/useDebounce'
import { useLookups } from '@/hooks/useLookups'
import { getErrorMessage } from '@/services/apiClient'
import type { Option } from '@/utils/constants'
import { optionLabel } from '@/utils/constants'
import { downloadCsv } from '@/utils/csv'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

type Row = Record<string, unknown>

export function ResourcePage({ config }: { config: ResourceConfig }) {
  const { can, user } = useAuth()
  const navigate = useNavigate()
  const { nameFor, optionsFor } = useLookups()
  const api = useCollection<Row>(config.collection)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<string | undefined>(config.defaultSort?.by)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(config.defaultSort?.dir ?? 'desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [busy, setBusy] = useState(false)

  const permissions = config.permissions
  const canCreate = permissions.create ? can(permissions.create) : false
  const canUpdate = permissions.update ? can(permissions.update) : false
  const canDelete = permissions.delete ? can(permissions.delete) : false

  function filterOptions(options?: Option[], optionsFrom?: string): Option[] {
    if (options) return options
    if (optionsFrom) return optionsFor(optionsFrom as never)
    return []
  }

  const filtered = useMemo(() => {
    let rows = api.items.slice()
    const term = debouncedSearch.trim().toLowerCase()
    if (term) {
      const keys = config.searchable
      rows = rows.filter((row) => {
        if (keys?.length) return keys.some((key) => String(row[key] ?? '').toLowerCase().includes(term))
        return Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(term))
      })
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return
      rows = rows.filter((row) => String(row[key] ?? '') === value)
    })
    if (sortBy) {
      const dir = sortDir === 'asc' ? 1 : -1
      rows.sort((a, b) => {
        const av = a[sortBy]
        const bv = b[sortBy]
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
        return String(av).localeCompare(String(bv)) * dir
      })
    }
    return rows
  }, [api.items, debouncedSearch, filters, sortBy, sortDir, config.searchable])

  const total = filtered.length
  const paged = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  function renderCell(column: ColumnConfig, row: Row) {
    const value = row[column.key]
    switch (column.kind) {
      case 'code':
        return <span className="font-mono text-xs text-muted-foreground">{String(value ?? '—')}</span>
      case 'number':
        return <span className="tabular-nums">{value == null || value === '' ? '—' : String(value)}</span>
      case 'currency':
        return <span className="tabular-nums">{formatCurrency(Number(value ?? 0))}</span>
      case 'date':
        return <span className="text-muted-foreground">{formatDate(value)}</span>
      case 'datetime':
        return <span className="text-muted-foreground">{formatDateTime(value)}</span>
      case 'ref':
        return <span>{value ? nameFor(column.ref as never, String(value)) : '—'}</span>
      case 'boolean':
        return <StatusBadge label={value ? 'Yes' : 'No'} tone={value ? 'success' : 'muted'} />
      case 'badge':
        return <StatusBadge label={optionLabel(column.options ?? [], String(value)) || String(value ?? '—')} tone={column.tones?.[String(value)] ?? 'muted'} />
      default:
        return (
          <span className="block max-w-[280px] truncate" title={String(value ?? '')}>
            {value == null || value === '' ? '—' : String(value)}
            {column.secondaryKey && row[column.secondaryKey] ? (
              <span className="block text-xs text-muted-foreground">{String(row[column.secondaryKey])}</span>
            ) : null}
          </span>
        )
    }
  }

  const columns: Column<Row>[] = config.columns.map((column) => ({
    key: column.key,
    header: column.header,
    sortable: true,
    hideBelow: column.hideBelow,
    render: (row) => renderCell(column, row),
  }))

  if (canUpdate || canDelete) {
    columns.push({
      key: '__actions',
      header: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          {canUpdate ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit"
              onClick={() => {
                setEditing(row)
                setDialogOpen(true)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(row)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      ),
    })
  }

  async function handleSubmit(values: FormValues) {
    const actor = user?.name ?? 'system'
    if (editing) {
      await api.update(String(editing.id), values, actor)
      toast.success(`${config.singular} updated`)
    } else {
      await api.create(values, actor)
      toast.success(`${config.singular} created`)
    }
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await api.remove(String(deleting.id), user?.name ?? 'system')
      toast.success(`${config.singular} deleted`)
      setDeleting(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  function handleExport() {
    const csvColumns = config.columns.map((column) => ({
      header: column.header,
      value: (row: Row) => {
        const value = row[column.key]
        if (column.kind === 'ref' && value) return nameFor(column.ref as never, String(value))
        if (column.kind === 'badge') return optionLabel(column.options ?? [], String(value))
        if (column.kind === 'boolean') return value ? 'Yes' : 'No'
        return value == null ? '' : String(value)
      },
    }))
    downloadCsv(`${config.key}-export`, filtered, csvColumns)
    toast.success('Export downloaded')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => api.refresh()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            {canCreate ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                New {config.singular}
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
            placeholder={`Search ${config.title.toLowerCase()}…`}
            className="lg:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {(config.filters ?? []).map((filter) => {
              const options = filterOptions(filter.options, filter.optionsFrom)
              return (
                <Select
                  key={filter.name}
                  value={filters[filter.name] ?? 'all'}
                  onValueChange={(value) => {
                    setFilters((prev) => ({ ...prev, [filter.name]: value === 'all' ? '' : value }))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-10 w-[190px]">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            })}
          </div>
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl">
        <DataTable
          columns={columns}
          data={paged}
          rowKey={(row) => String(row.id)}
          loading={api.loading}
          error={api.error}
          onRetry={api.refresh}
          sortBy={sortBy}
          sortDir={sortDir}
          onRowClick={config.detailRoute ? (row) => navigate(config.detailRoute!(row)) : undefined}
          onSortChange={(key) => {
            if (key === '__actions') return
            if (sortBy === key) setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            else {
              setSortBy(key)
              setSortDir('asc')
            }
          }}
          emptyTitle={`No ${config.title.toLowerCase()} found`}
          emptyDescription={`Try adjusting your search or filters${canCreate ? `, or add a new ${config.singular.toLowerCase()}.` : '.'}`}
        />
        <div className="rounded-b-xl border border-t-0 border-border bg-card">
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            loading={api.loading}
          />
        </div>
      </div>

      <ResourceFormDialog
        config={config}
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next)
          if (!next) setEditing(null)
        }}
        initial={editing}
        onSubmit={handleSubmit}
      />

      {deleting ? (
        <ConfirmDelete
          label={`${config.singular}`}
          name={String(deleting.name ?? deleting.assetTag ?? deleting.code ?? deleting.id)}
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  )
}

function ConfirmDelete({
  label,
  name,
  busy,
  onCancel,
  onConfirm,
}: {
  label: string
  name: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button type="button" aria-label="Cancel" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-card p-6 shadow-elevated">
        <h3 className="text-lg font-semibold">Delete {label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-medium text-foreground">{name}</span>? It will be moved to the recycle bin and hidden from lists.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={busy} disabled={busy}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
