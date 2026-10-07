import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  KeyRound,
  LifeBuoy,
  PackageX,
  ShieldAlert,
  TimerOff,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/common/PageHeader'
import { PriorityBadge, TicketStatusBadge } from '@/components/common/StatusBadge'
import { StatCard } from '@/components/common/StatCard'
import { Timeline } from '@/components/common/Timeline'
import type { TimelineItem } from '@/components/common/Timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { useAuth } from '@/hooks/useAuth'
import { dataSource } from '@/services/datasource'
import type { ChartDatum, DashboardData } from '@/types'
import { canViewAllTickets } from '@/utils/permissions'
import { formatRelative } from '@/utils/format'

const PALETTE = ['#287a57', '#205c8a', '#c98a12', '#b23c3c', '#6b7a8f', '#4ea27c', '#8a5cf6', '#0f766e', '#d97706']

const AXIS_STYLE = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function DonutChart({ data }: { data: ChartDatum[] }) {
  if (data.length === 0) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function BarsChart({ data, vertical }: { data: ChartDatum[]; vertical?: boolean }) {
  if (data.length === 0) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout={vertical ? 'vertical' : 'horizontal'}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        {vertical ? (
          <>
            <XAxis type="number" tick={AXIS_STYLE} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={90} tick={AXIS_STYLE} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={AXIS_STYLE} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={AXIS_STYLE} allowDecimals={false} />
          </>
        )}
        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#287a57" />
      </BarChart>
    </ResponsiveContainer>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      No data available
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const canViewAll = canViewAllTickets(user?.role)
  const resource = useAsyncResource<DashboardData>(
    () => dataSource.getDashboard({ userId: user?.id, canViewAll }),
    [user?.id, canViewAll],
  )

  const data = resource.data

  if (resource.error && !resource.loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Dashboard" description="IT operations overview." />
        <Card className="p-10 text-center text-sm text-muted-foreground">{resource.error}</Card>
      </div>
    )
  }

  const stats = data?.stats

  const statCards: { title: string; value: number; icon: LucideIcon; tone: 'primary' | 'info' | 'warning' | 'success' | 'destructive' }[] = [
    { title: 'Open Tickets', value: stats?.openTickets ?? 0, icon: LifeBuoy, tone: 'info' },
    { title: 'Pending', value: stats?.pendingTickets ?? 0, icon: Clock, tone: 'warning' },
    { title: 'Critical', value: stats?.criticalTickets ?? 0, icon: AlertTriangle, tone: 'destructive' },
    { title: 'Due Today', value: stats?.ticketsDueToday ?? 0, icon: CalendarClock, tone: 'info' },
    { title: 'SLA Breaching', value: stats?.slaBreaching ?? 0, icon: TimerOff, tone: 'destructive' },
    { title: 'Total Assets', value: stats?.totalAssets ?? 0, icon: Cpu, tone: 'primary' },
    { title: 'Active Assets', value: stats?.activeAssets ?? 0, icon: CheckCircle2, tone: 'success' },
    { title: 'Under Repair', value: stats?.assetsUnderRepair ?? 0, icon: Wrench, tone: 'warning' },
    { title: 'Warranty Expiring', value: stats?.warrantyExpiringSoon ?? 0, icon: ShieldAlert, tone: 'warning' },
    { title: 'Licenses Expiring', value: stats?.licensesExpiringSoon ?? 0, icon: KeyRound, tone: 'warning' },
    { title: 'Maintenance Due', value: stats?.maintenanceDue ?? 0, icon: CalendarCheck2, tone: 'info' },
    { title: 'Low Spare Stock', value: stats?.lowSpareStock ?? 0, icon: PackageX, tone: 'warning' },
    { title: 'Backup Failures', value: stats?.backupFailures ?? 0, icon: Database, tone: 'destructive' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? ''}`}
        description={canViewAll ? 'IT service desk and asset health across the factory.' : 'Your tickets and assigned IT assets.'}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
            loading={resource.loading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard title="Monthly Ticket Trend" className="lg:col-span-2">
          {resource.loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data?.monthlyTrend ?? []}>
                <defs>
                  <linearGradient id="opened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#287a57" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#287a57" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="closed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#205c8a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#205c8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={AXIS_STYLE} />
                <YAxis tick={AXIS_STYLE} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="opened" name="Opened" stroke="#287a57" fill="url(#opened)" strokeWidth={2} />
                <Area type="monotone" dataKey="closed" name="Closed" stroke="#205c8a" fill="url(#closed)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Tickets by Status">
          {resource.loading ? <Skeleton className="h-[260px] w-full" /> : <DonutChart data={data?.ticketsByStatus ?? []} />}
        </ChartCard>

        <ChartCard title="Tickets by Category">
          {resource.loading ? <Skeleton className="h-[260px] w-full" /> : <DonutChart data={data?.ticketsByCategory ?? []} />}
        </ChartCard>

        <ChartCard title="Tickets by Priority">
          {resource.loading ? <Skeleton className="h-[260px] w-full" /> : <BarsChart data={data?.ticketsByPriority ?? []} />}
        </ChartCard>

        <ChartCard title="Tickets by Department">
          {resource.loading ? <Skeleton className="h-[260px] w-full" /> : <BarsChart data={data?.ticketsByDepartment ?? []} vertical />}
        </ChartCard>

        <ChartCard title="Asset Distribution" className="lg:col-span-2">
          {resource.loading ? <Skeleton className="h-[260px] w-full" /> : <BarsChart data={data?.assetDistribution ?? []} />}
        </ChartCard>

        <ChartCard title="Recent Activity">
          <Timeline
            items={(data?.recentActivity ?? []).map<TimelineItem>((entry) => ({
              id: entry.id,
              title: entry.detail,
              description: entry.action,
              timestamp: entry.timestamp,
              actor: entry.actor,
              tone: entry.action.includes('fail') || entry.action.includes('delete') ? 'destructive' : 'default',
            }))}
          />
        </ChartCard>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resource.loading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)
          ) : (data?.recentTickets ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            (data?.recentTickets ?? []).map((ticket) => (
              <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.code} · {ticket.requesterName} · {formatRelative(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <TicketStatusBadge status={ticket.status} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
