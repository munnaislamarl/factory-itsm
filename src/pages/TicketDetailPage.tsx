import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  History as HistoryIcon,
  ListChecks,
  MapPin,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Star,
  Tag,
  User,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { PriorityBadge, StatusBadge, TicketStatusBadge } from '@/components/common/StatusBadge'
import { Timeline } from '@/components/common/Timeline'
import type { TimelineItem } from '@/components/common/Timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
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
import type { Ticket, TicketComment, TicketHistory, TicketWorkLog } from '@/types'
import { PRIORITY_TONES } from '@/utils/constants'
import { formatDateTime, formatRelative } from '@/utils/format'

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
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

export function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const { nameFor } = useLookups()

  const ticketRes = useAsyncResource<Ticket>(() => dataSource.get<Ticket>('tickets', id as string), [id])
  const commentsRes = useAsyncResource<TicketComment[]>(
    () => dataSource.list<TicketComment>('ticket_comments', { filters: { ticketId: id }, sortBy: 'createdAt', sortDir: 'desc' }),
    [id],
  )
  const worklogsRes = useAsyncResource<TicketWorkLog[]>(
    () => dataSource.list<TicketWorkLog>('ticket_worklogs', { filters: { ticketId: id }, sortBy: 'createdAt', sortDir: 'desc' }),
    [id],
  )
  const historyRes = useAsyncResource<TicketHistory[]>(
    () => dataSource.list<TicketHistory>('ticket_history', { filters: { ticketId: id }, sortBy: 'createdAt', sortDir: 'desc' }),
    [id],
  )
  const usersRes = useAsyncResource(
    () => dataSource.list<{ id: string; name: string; role: string }>('users'),
    [],
  )

  const [comment, setComment] = useState('')
  const [workNote, setWorkNote] = useState('')
  const [workMinutes, setWorkMinutes] = useState('30')
  const [assignee, setAssignee] = useState('')
  const [resolution, setResolution] = useState('')
  const [rating, setRating] = useState(0)
  const [busy, setBusy] = useState(false)

  const ticket = ticketRes.data
  const officers = (usersRes.data ?? []).filter((u) => ['it_officer', 'it_manager', 'super_admin'].includes(u.role))

  async function runTransition(action: Parameters<typeof dataSource.ticketAction>[0], payload: Record<string, unknown> = {}) {
    if (!ticket) return
    setBusy(true)
    try {
      await dataSource.ticketAction(action, { ticketId: ticket.id, ...payload }, user?.name ?? 'system')
      toast.success('Ticket updated')
      await Promise.all([ticketRes.refresh(), commentsRes.refresh(), historyRes.refresh(), worklogsRes.refresh()])
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function addComment() {
    if (!ticket || !comment.trim()) return
    setBusy(true)
    try {
      await dataSource.create<TicketComment>('ticket_comments', {
        ticketId: ticket.id,
        authorId: user?.id,
        authorName: user?.name,
        body: comment.trim(),
        internal: false,
      }, user?.name ?? 'system')
      setComment('')
      await commentsRes.refresh()
      toast.success('Comment added')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function addWorkLog() {
    if (!ticket || !workNote.trim()) return
    setBusy(true)
    try {
      await dataSource.create<TicketWorkLog>('ticket_worklogs', {
        ticketId: ticket.id,
        officerId: user?.id,
        officerName: user?.name,
        minutes: Number(workMinutes) || 0,
        note: workNote.trim(),
      }, user?.name ?? 'system')
      setWorkNote('')
      await worklogsRes.refresh()
      toast.success('Work log added')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function submitRating() {
    if (!ticket || rating < 1) return
    setBusy(true)
    try {
      await dataSource.rateTicket(ticket.id, rating, 'Confirmed by requester', user?.name ?? 'system')
      await ticketRes.refresh()
      toast.success('Thank you for your feedback')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if (ticketRes.loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (ticketRes.error || !ticket) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/tickets')}>
          <ArrowLeft className="h-4 w-4" /> Back to tickets
        </Button>
        <Card className="p-10 text-center text-sm text-muted-foreground">{ticketRes.error ?? 'Ticket not found.'}</Card>
      </div>
    )
  }

  const isRequester = user?.employeeId === ticket.requesterId
  const canManage = can('tickets.update') || can('tickets.resolve')
  const openStatus = ['new', 'assigned', 'in_progress', 'pending_user', 'pending_vendor', 'reopened'].includes(ticket.status)

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate('/app/tickets')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </button>

      <PageHeader
        title={ticket.title}
        description={`${ticket.code} · raised ${formatRelative(ticket.createdAt)} by ${ticket.requesterName}`}
        actions={
          <div className="flex items-center gap-2">
            <PriorityBadge priority={ticket.priority} />
            <TicketStatusBadge status={ticket.status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-foreground">{ticket.description}</p>
              {ticket.resolution ? (
                <div className="mt-4 rounded-lg border border-success/30 bg-success/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-success">Resolution</p>
                  <p className="mt-1 text-sm text-foreground">{ticket.resolution}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="activity">
                <TabsList>
                  <TabsTrigger value="activity"><MessageSquare className="h-4 w-4" /> Activity</TabsTrigger>
                  <TabsTrigger value="worklogs"><ListChecks className="h-4 w-4" /> Work Logs</TabsTrigger>
                  <TabsTrigger value="history"><HistoryIcon className="h-4 w-4" /> History</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="space-y-4">
                  {can('tickets.comment') ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a comment…"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={addComment} loading={busy} disabled={busy || !comment.trim()}>
                          <Send className="h-4 w-4" /> Comment
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    {(commentsRes.data ?? []).map((item) => (
                      <div key={item.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{item.authorName}</p>
                          <span className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
                      </div>
                    ))}
                    {(commentsRes.data ?? []).length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">No comments yet.</p>
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value="worklogs" className="space-y-4">
                  {canManage ? (
                    <div className="space-y-2 rounded-lg border border-border p-3">
                      <Textarea
                        placeholder="What did you do?"
                        value={workNote}
                        onChange={(event) => setWorkNote(event.target.value)}
                        rows={2}
                      />
                      <div className="flex items-end justify-between gap-2">
                        <label className="text-xs text-muted-foreground">
                          Minutes
                          <input
                            type="number"
                            min={0}
                            value={workMinutes}
                            onChange={(event) => setWorkMinutes(event.target.value)}
                            className="ml-2 h-8 w-20 rounded-md border border-input bg-card px-2 text-sm"
                          />
                        </label>
                        <Button size="sm" onClick={addWorkLog} loading={busy} disabled={busy || !workNote.trim()}>
                          <ListChecks className="h-4 w-4" /> Log work
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <Timeline
                    items={(worklogsRes.data ?? []).map<TimelineItem>((log) => ({
                      id: log.id,
                      title: `${log.minutes} min — ${log.note}`,
                      actor: log.officerName,
                      timestamp: log.createdAt,
                      tone: 'info',
                    }))}
                    emptyLabel="No work logs yet."
                  />
                </TabsContent>

                <TabsContent value="history">
                  <Timeline
                    items={(historyRes.data ?? []).map<TimelineItem>((entry) => ({
                      id: entry.id,
                      title: `${entry.field}: ${entry.oldValue || '—'} → ${entry.newValue || '—'}`,
                      actor: entry.actor,
                      timestamp: entry.createdAt,
                      tone: 'muted',
                    }))}
                    emptyLabel="No history recorded."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-0"><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="divide-y divide-border">
              <div className="space-y-1 py-2">
                <DetailRow icon={User} label="Requester" value={ticket.requesterName} />
                <DetailRow icon={Tag} label="Category" value={`${nameFor('ticket_categories', ticket.categoryId)}${ticket.subcategoryId ? ` / ${nameFor('ticket_subcategories', ticket.subcategoryId)}` : ''}`} />
                <DetailRow icon={MapPin} label="Department" value={nameFor('departments', ticket.departmentId)} />
                <DetailRow icon={Clock} label="Due" value={`${formatDateTime(ticket.dueDate)} (${formatRelative(ticket.dueDate)})`} />
                <DetailRow icon={Calendar} label="Created" value={formatDateTime(ticket.createdAt)} />
                <DetailRow icon={UserPlus} label="Assigned To" value={ticket.assignedToName || (ticket.assignedTo ? nameFor('users', ticket.assignedTo) : 'Unassigned')} />
              </div>
            </CardContent>
          </Card>

          {canManage ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle>Workflow</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {can('tickets.assign') ? (
                  <div className="flex gap-2">
                    <Select value={assignee} onValueChange={setAssignee}>
                      <SelectTrigger><SelectValue placeholder="Assign to officer…" /></SelectTrigger>
                      <SelectContent>
                        {officers.map((officer) => (
                          <SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!assignee || busy}
                      onClick={() => runTransition('assign', {
                        assignedTo: assignee,
                        assignedToName: officers.find((o) => o.id === assignee)?.name,
                      })}
                    >
                      Assign
                    </Button>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {openStatus && (ticket.status === 'new' || ticket.status === 'assigned') ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => runTransition('start')}>
                      <Play className="h-4 w-4" /> Start
                    </Button>
                  ) : null}
                  {openStatus && ticket.status !== 'pending_user' ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => runTransition('pending_user')}>Pending User</Button>
                  ) : null}
                  {openStatus && ticket.status !== 'pending_vendor' ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => runTransition('pending_vendor')}>Pending Vendor</Button>
                  ) : null}
                  {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => runTransition('reopen')}>
                      <RotateCcw className="h-4 w-4" /> Reopen
                    </Button>
                  ) : null}
                  {openStatus && can('tickets.close') ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => runTransition('close')}>
                      <CheckCircle2 className="h-4 w-4" /> Close
                    </Button>
                  ) : null}
                  {openStatus ? (
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => runTransition('cancel')}>
                      <XCircle className="h-4 w-4" /> Cancel
                    </Button>
                  ) : null}
                </div>

                {openStatus ? (
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    <Textarea
                      placeholder="Resolution notes…"
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                      rows={2}
                    />
                    <Button
                      size="sm"
                      variant="success"
                      disabled={busy}
                      onClick={() => runTransition('resolve', { resolution: resolution.trim() || 'Issue resolved.' })}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark resolved
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {isRequester && (ticket.status === 'resolved' || ticket.status === 'closed') && !ticket.rating ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle>Rate resolution</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`}>
                      <Star className={`h-7 w-7 ${value <= rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>
                <Button size="sm" disabled={rating < 1 || busy} onClick={submitRating}>Submit feedback</Button>
              </CardContent>
            </Card>
          ) : null}

          {ticket.rating ? (
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">User rating</p>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className={`h-4 w-4 ${index < (ticket.rating ?? 0) ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                {ticket.ratingComment ? <p className="mt-1 text-sm text-muted-foreground">{ticket.ratingComment}</p> : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</p>
              <div className="mt-2">
                <StatusBadge label={ticket.priority.toUpperCase()} tone={PRIORITY_TONES[ticket.priority] ?? 'muted'} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
