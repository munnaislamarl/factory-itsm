import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { dataSource } from '@/services/datasource'
import { cacheGet, cacheSet, CACHE_KEYS } from '@/services/cache'
import type { LookupBundle } from '@/services/types'
import type { Option } from '@/utils/constants'

export type LookupSource =
  | 'departments'
  | 'locations'
  | 'employees'
  | 'users'
  | 'vendors'
  | 'assets'
  | 'servers'
  | 'software'
  | 'spare_parts'
  | 'ticket_categories'
  | 'ticket_subcategories'

export type LookupState = LookupBundle

const EMPTY: LookupState = {
  departments: [],
  locations: [],
  employees: [],
  users: [],
  vendors: [],
  assets: [],
  servers: [],
  software: [],
  spare_parts: [],
  ticket_categories: [],
  ticket_subcategories: [],
}

interface LookupContextValue {
  loading: boolean
  data: LookupState
  refresh: () => Promise<void>
  nameFor: (source: LookupSource, id?: string | null) => string
  optionsFor: (source: LookupSource) => Option[]
  subcategoriesFor: (categoryId?: string) => Option[]
}

const LookupContext = createContext<LookupContextValue | null>(null)

function locationLabel(location: LookupState['locations'][number]): string {
  return [location.building, location.floor, location.room].filter(Boolean).join(' · ')
}

export function LookupProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LookupState>(
    () => cacheGet<LookupState>(CACHE_KEYS.lookups) ?? EMPTY,
  )
  const [loading, setLoading] = useState(() => cacheGet(CACHE_KEYS.lookups) === null)

  const load = useCallback(async () => {
    try {
      const bundle = await dataSource.getLookups()
      const next: LookupState = { ...EMPTY, ...bundle }
      cacheSet(CACHE_KEYS.lookups, next)
      setData(next)
    } catch {
      // Backend may not support the batched action yet — fall back to
      // individual collection requests so the app keeps working.
      try {
        const names = [
          'departments',
          'locations',
          'employees',
          'users',
          'vendors',
          'assets',
          'servers',
          'software',
          'spare_parts',
          'ticket_categories',
          'ticket_subcategories',
        ] as const
        const results = await Promise.all(names.map((name) => dataSource.list(name)))
        const next = { ...EMPTY } as unknown as Record<string, unknown>
        names.forEach((name, index) => {
          next[name] = results[index]
        })
        cacheSet(CACHE_KEYS.lookups, next as unknown as LookupState)
        setData(next as unknown as LookupState)
      } catch {
        // keep whatever is cached so the UI stays usable
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (cacheGet(CACHE_KEYS.lookups)) {
      setLoading(false)
      return
    }
    void load()
  }, [load])

  useEffect(() => {
    const onFocus = () => {
      if (!cacheGet(CACHE_KEYS.lookups)) void load()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const maps = useMemo(
    () => ({
      departments: new Map(data.departments.map((item) => [item.id, item.name])),
      locations: new Map(data.locations.map((item) => [item.id, locationLabel(item)])),
      employees: new Map(data.employees.map((item) => [item.id, item.name])),
      users: new Map(data.users.map((item) => [item.id, item.name])),
      vendors: new Map(data.vendors.map((item) => [item.id, item.name])),
      assets: new Map(data.assets.map((item) => [item.id, `${item.assetTag} · ${item.name}`])),
      servers: new Map(data.servers.map((item) => [item.id, item.name])),
      software: new Map(data.software.map((item) => [item.id, item.name])),
      spare_parts: new Map(data.spare_parts.map((item) => [item.id, item.name])),
      ticket_categories: new Map(data.ticket_categories.map((item) => [item.id, item.name])),
      ticket_subcategories: new Map(data.ticket_subcategories.map((item) => [item.id, item.name])),
    }),
    [data],
  )

  const optionsMap = useMemo<Record<LookupSource, Option[]>>(
    () => ({
      departments: data.departments.map((item) => ({ value: item.id, label: item.name })),
      locations: data.locations.map((item) => ({ value: item.id, label: locationLabel(item) })),
      employees: data.employees.map((item) => ({ value: item.id, label: `${item.name} (${item.employeeId})` })),
      users: data.users.map((item) => ({ value: item.id, label: item.name })),
      vendors: data.vendors.map((item) => ({ value: item.id, label: item.name })),
      assets: data.assets.map((item) => ({ value: item.id, label: `${item.assetTag} · ${item.name}` })),
      servers: data.servers.map((item) => ({ value: item.id, label: item.name })),
      software: data.software.map((item) => ({ value: item.id, label: item.name })),
      spare_parts: data.spare_parts.map((item) => ({ value: item.id, label: `${item.name} (${item.sku})` })),
      ticket_categories: data.ticket_categories.map((item) => ({ value: item.id, label: item.name })),
      ticket_subcategories: data.ticket_subcategories.map((item) => ({ value: item.id, label: item.name })),
    }),
    [data],
  )

  const nameFor = useCallback(
    (source: LookupSource, id?: string | null) => {
      if (!id) return ''
      return maps[source].get(id) ?? id
    },
    [maps],
  )

  const optionsFor = useCallback((source: LookupSource) => optionsMap[source] ?? [], [optionsMap])

  const subcategoriesFor = useCallback(
    (categoryId?: string) =>
      data.ticket_subcategories
        .filter((sub) => !categoryId || sub.categoryId === categoryId)
        .map((sub) => ({ value: sub.id, label: sub.name })),
    [data.ticket_subcategories],
  )

  const value = useMemo(
    () => ({ loading, data, refresh: load, nameFor, optionsFor, subcategoriesFor }),
    [loading, data, load, nameFor, optionsFor, subcategoriesFor],
  )

  return <LookupContext.Provider value={value}>{children}</LookupContext.Provider>
}

export function useLookups(): LookupContextValue {
  const context = useContext(LookupContext)
  if (!context) throw new Error('useLookups must be used within a LookupProvider')
  return context
}

export { locationLabel }
