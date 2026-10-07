import { Download, FileBarChart, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { useLookups } from '@/hooks/useLookups'
import { dataSource } from '@/services/datasource'
import type { ReportFilter, ReportPayload } from '@/types'
import { TICKET_STATUSES } from '@/utils/constants'
import { downloadCsv } from '@/utils/csv'

const REPORTS = [
  { value: 'tickets', label: 'Ticket Report' },
  { value: 'open_tickets', label: 'Open Ticket Report' },
  { value: 'sla', label: 'SLA Report' },
  { value: 'assets', label: 'Asset Report' },
  { value: 'warranty', label: 'Asset Warranty Report' },
  { value: 'maintenance', label: 'Maintenance Report' },
  { value: 'licenses', label: 'Software License Report' },
  { value: 'network', label: 'Network Device Report' },
  { value: 'spares', label: 'Spare Stock Report' },
  { value: 'spare_consumption', label: 'Spare Consumption Report' },
  { value: 'vendors', label: 'Vendor Service Report' },
  { value: 'backups', label: 'Server Backup Report' },
  { value: 'employees', label: 'Employee Report' },
]

export function ReportsPage() {
  const { data: lookups } = useLookups()
  const [report, setReport] = useState('tickets')
  const [filter, setFilter] = useState<ReportFilter>({})

  const resource = useAsyncResource<ReportPayload>(
    () => dataSource.getReport(report, filter),
    [report, JSON.stringify(filter)],
  )

  const payload = resource.data

  function setFilterValue(key: keyof ReportFilter, value: string) {
    setFilter((prev) => ({ ...prev, [key]: value || undefined }))
  }

  const activeFilterCount = useMemo(
    () => Object.values(filter).filter(Boolean).length,
    [filter],
  )

  function handleExport() {
    if (!payload) return
    downloadCsv(
      `${report}-report`,
      payload.rows,
      payload.columns.map((column) => ({
        header: column.header,
        value: (row: Record<string, string | number | null>) => row[column.key] ?? '',
      })),
    )
    toast.success('Report exported as CSV')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Generate, filter and export IT operational reports."
        actions={
          <>
            <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="outline" size="sm" className="no-print" onClick={handleExport} disabled={!payload}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      <Card className="no-print p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1.5 xl:col-span-2">
            <Label>Report</Label>
            <Select value={report} onValueChange={setReport}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPORTS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>From</Label>
            <Input type="date" value={filter.from ?? ''} onChange={(event) => setFilterValue('from', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input type="date" value={filter.to ?? ''} onChange={(event) => setFilterValue('to', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={filter.departmentId ?? 'all'} onValueChange={(value) => setFilterValue('departmentId', value === 'all' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {lookups.departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={filter.status ?? 'all'} onValueChange={(value) => setFilterValue('status', value === 'all' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {TICKET_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {activeFilterCount > 0 ? (
          <button type="button" className="mt-3 text-xs text-primary hover:underline" onClick={() => setFilter({})}>
            Clear filters
          </button>
        ) : null}
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">{payload?.title ?? 'Report'}</h3>
            <span className="text-xs text-muted-foreground">{payload?.rows.length ?? 0} row(s)</span>
          </div>

          {resource.loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-9 w-full" />)}
            </div>
          ) : resource.error ? (
            <p className="py-8 text-center text-sm text-destructive">{resource.error}</p>
          ) : !payload || payload.rows.length === 0 ? (
            <EmptyState icon={FileBarChart} title="No data for this report" description="Try changing the filters or date range." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    {payload.columns.map((column) => (
                      <TableHead key={column.key}>{column.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payload.rows.map((row, index) => (
                    <TableRow key={index}>
                      {payload.columns.map((column) => (
                        <TableCell key={column.key}>
                          {row[column.key] === null || row[column.key] === '' ? '—' : String(row[column.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
