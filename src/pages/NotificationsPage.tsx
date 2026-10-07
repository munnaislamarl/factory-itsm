import { Bell, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/utils/format'

const TONE_DOT: Record<string, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  destructive: 'bg-destructive',
}

export function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [onlyUnread, setOnlyUnread] = useState(false)
  const navigate = useNavigate()

  const visible = onlyUnread ? notifications.filter((item) => !item.read) : notifications

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Alerts for tickets, SLA, warranty, licenses, stock and backups."
        actions={
          <>
            <Button variant={onlyUnread ? 'default' : 'outline'} size="sm" onClick={() => setOnlyUnread((prev) => !prev)}>
              {onlyUnread ? 'Showing unread' : 'Show unread'}
            </Button>
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          </>
        }
      />

      {visible.length === 0 && !loading ? (
        <Card>
          <CardContent>
            <EmptyState icon={Bell} title="No notifications" description="You are all caught up." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((item) => (
            <Card key={item.id} className={cn('transition-colors', !item.read && 'border-primary/30')}>
              <CardContent className="flex items-start gap-3 py-4">
                <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', TONE_DOT[item.tone] ?? 'bg-primary')} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {!item.read ? <Badge variant="default">New</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatRelative(item.timestamp)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {item.link ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        markAsRead(item.id)
                        navigate(item.link as string)
                      }}
                    >
                      Open
                    </Button>
                  ) : null}
                  {!item.read ? (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(item.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
