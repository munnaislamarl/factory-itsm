import { Badge } from '@/components/ui/badge'
import type { Tone } from '@/utils/constants'
import { optionLabel, PRIORITIES, PRIORITY_TONES, TICKET_STATUSES, TICKET_STATUS_TONES } from '@/utils/constants'
import type { Option } from '@/utils/constants'

export function StatusBadge({ label, tone = 'default' }: { label: string; tone?: Tone }) {
  return <Badge variant={tone}>{label}</Badge>
}

export function ToneBadgeFromMap({
  value,
  map,
  options,
  fallbackTone = 'muted',
}: {
  value: string
  map: Record<string, Tone>
  options: Option[]
  fallbackTone?: Tone
}) {
  return <Badge variant={map[value] ?? fallbackTone}>{optionLabel(options, value) || value}</Badge>
}

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={TICKET_STATUS_TONES[status] ?? 'muted'}>
      {optionLabel(TICKET_STATUSES, status) || status}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant={PRIORITY_TONES[priority] ?? 'muted'}>
      {optionLabel(PRIORITIES, priority) || priority}
    </Badge>
  )
}
