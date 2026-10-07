import { useCallback } from 'react'

import { useCollection } from '@/hooks/useCollection'
import { dataSource } from '@/services/datasource'
import { useAuth } from '@/hooks/useAuth'
import type { AppNotification } from '@/types'

export function useNotifications() {
  const { user } = useAuth()
  const resource = useCollection<AppNotification>('notifications', {
    sortBy: 'timestamp',
    sortDir: 'desc',
  })

  const notifications = resource.items
  const unreadCount = notifications.filter((item) => !item.read).length

  const markAsRead = useCallback(
    (id: string) => {
      resource.setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      )
      void dataSource.update<AppNotification>('notifications', id, { read: true }, user?.name ?? 'system')
    },
    [resource, user],
  )

  const markAllAsRead = useCallback(() => {
    resource.setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    notifications
      .filter((item) => !item.read)
      .forEach((item) => {
        void dataSource.update<AppNotification>('notifications', item.id, { read: true }, user?.name ?? 'system')
      })
  }, [notifications, resource, user])

  return {
    notifications,
    unreadCount,
    loading: resource.loading,
    error: resource.error,
    refresh: resource.refresh,
    markAsRead,
    markAllAsRead,
  }
}
