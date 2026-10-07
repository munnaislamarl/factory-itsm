import type { Tone } from '@/utils/constants'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/utils/format'

export interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp?: string
  tone?: Tone
  actor?: string
}

const DOT_TONES: Record<Tone, string> = {
  default: 'bg-primary',
  secondary: 'bg-muted-foreground',
  outline: 'bg-muted-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground',
}

export function Timeline({ items, emptyLabel = 'No activity yet.' }: { items: TimelineItem[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={cn(
              'absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-card',
              DOT_TONES[item.tone ?? 'default'],
            )}
          />
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.timestamp ? (
              <span className="text-xs text-muted-foreground">{formatRelative(item.timestamp)}</span>
            ) : null}
          </div>
          {item.description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
          ) : null}
          {item.actor ? (
            <p className="mt-0.5 text-xs text-muted-foreground">by {item.actor}</p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
