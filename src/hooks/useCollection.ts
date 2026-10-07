import { useCallback } from 'react'

import { useAsyncResource } from '@/hooks/useAsyncResource'
import { cacheClear, CACHE_KEYS, isLookupCollection } from '@/services/cache'
import { dataSource } from '@/services/datasource'
import type { CollectionName, QueryOptions } from '@/types'

export interface CollectionApi<T> {
  items: T[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setItems: (updater: T[] | ((prev: T[]) => T[])) => void
  create: (data: Partial<T>, actor: string) => Promise<T>
  update: (id: string, patch: Partial<T>, actor: string) => Promise<T>
  remove: (id: string, actor: string) => Promise<void>
}

function invalidate(collection: CollectionName): void {
  cacheClear(`list:${collection}:`)
  cacheClear(CACHE_KEYS.dashboard(''))
  if (isLookupCollection(collection)) cacheClear('lookups:')
}

export function useCollection<T>(collection: CollectionName, options: QueryOptions = {}): CollectionApi<T> {
  const optionsKey = JSON.stringify(options)
  const cacheKey = CACHE_KEYS.list(collection, optionsKey)
  const resource = useAsyncResource<T[]>(
    () => dataSource.list<T>(collection, options),
    [collection, optionsKey],
    cacheKey,
  )

  const items = Array.isArray(resource.data) ? resource.data : []

  const create = useCallback(
    async (data: Partial<T>, actor: string) => {
      const created = await dataSource.create<T>(collection, data, actor)
      invalidate(collection)
      resource.setData((prev) => [created, ...(prev ?? [])])
      return created
    },
    [collection, resource],
  )

  const update = useCallback(
    async (id: string, patch: Partial<T>, actor: string) => {
      const updated = await dataSource.update<T>(collection, id, patch, actor)
      invalidate(collection)
      resource.setData((prev) => (prev ?? []).map((item) => ((item as { id: string }).id === id ? updated : item)))
      return updated
    },
    [collection, resource],
  )

  const remove = useCallback(
    async (id: string, actor: string) => {
      await dataSource.remove(collection, id, actor)
      invalidate(collection)
      resource.setData((prev) => (prev ?? []).filter((item) => (item as { id: string }).id !== id))
    },
    [collection, resource],
  )

  const setItems = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      resource.setData((prev) =>
        typeof updater === 'function' ? (updater as (p: T[]) => T[])(prev ?? []) : updater,
      )
    },
    [resource],
  )

  return {
    items,
    loading: resource.loading,
    error: resource.error,
    refresh: resource.refresh,
    setItems,
    create,
    update,
    remove,
  }
}
