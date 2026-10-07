import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { dataSource } from '@/services/datasource'
import type {
  Asset,
  Department,
  Employee,
  Location,
  Server,
  Software,
  SparePart,
  TicketCategory,
  TicketSubcategory,
  Vendor,
  AppUser,
} from '@/types'
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

interface LookupState {
  departments: Department[]
  locations: Location[]
  employees: Employee[]
  users: AppUser[]
  vendors: Vendor[]
  assets: Asset[]
  servers: Server[]
  software: Software[]
  spare_parts: SparePart[]
  ticket_categories: TicketCategory[]
  ticket_subcategories: TicketSubcategory[]
}

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

function locationLabel(location: Location): string {
  return [location.building, location.floor, location.room].filter(Boolean).join(' · ')
}

export function LookupProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LookupState>(EMPTY)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [
        departments,
        locations,
        employees,
        users,
        vendors,
        assets,
        servers,
        software,
        spare_parts,
        ticket_categories,
        ticket_subcategories,
      ] = await Promise.all([
        dataSource.list<Department>('departments'),
        dataSource.list<Location>('locations'),
        dataSource.list<Employee>('employees'),
        dataSource.list<AppUser>('users'),
        dataSource.list<Vendor>('vendors'),
        dataSource.list<Asset>('assets'),
        dataSource.list<Server>('servers'),
        dataSource.list<Software>('software'),
        dataSource.list<SparePart>('spare_parts'),
        dataSource.list<TicketCategory>('ticket_categories'),
        dataSource.list<TicketSubcategory>('ticket_subcategories'),
      ])
      setData({
        departments,
        locations,
        employees,
        users,
        vendors,
        assets,
        servers,
        software,
        spare_parts,
        ticket_categories,
        ticket_subcategories,
      })
    } catch {
      setData(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
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
