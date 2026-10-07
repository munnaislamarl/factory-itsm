import { apiRequest } from '@/services/apiClient'
import type {
  AssetAction,
  AssetActionPayload,
  DataSource,
  SpareActionPayload,
  TicketActionPayload,
  TicketTransition,
} from '@/services/types'
import type {
  ActivityLogEntry,
  Asset,
  CollectionName,
  DashboardData,
  QueryOptions,
  ReportFilter,
  ReportPayload,
  SessionUser,
  SparePart,
  SpareTransaction,
  Ticket,
} from '@/types'

async function unwrap<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const response = await apiRequest<T>(action, payload)
  return response.data as T
}

export const remoteDataSource: DataSource = {
  list: <T>(collection: CollectionName, options?: QueryOptions) =>
    unwrap<T[]>('list', { collection, options: options ?? {} }),
  get: <T>(collection: CollectionName, id: string) => unwrap<T>('get', { collection, id }),
  create: <T>(collection: CollectionName, data: Partial<T>, actor: string) =>
    unwrap<T>('create', { collection, data, actor }),
  update: <T>(collection: CollectionName, id: string, patch: Partial<T>, actor: string) =>
    unwrap<T>('update', { collection, id, patch, actor }),
  remove: async (collection: CollectionName, id: string, actor: string) => {
    await unwrap<{ id: string }>('delete', { collection, id, actor })
  },

  ticketAction: (action: TicketTransition, payload: TicketActionPayload, actor: string) =>
    unwrap<Ticket>('ticketAction', { transition: action, payload, actor }),
  rateTicket: (ticketId: string, rating: number, comment: string, actor: string) =>
    unwrap<Ticket>('rateTicket', { ticketId, rating, comment, actor }),
  assetAction: (action: AssetAction, payload: AssetActionPayload, actor: string) =>
    unwrap<Asset>('assetAction', { op: action, payload, actor }),
  spareAction: (payload: SpareActionPayload, actor: string) =>
    unwrap<{ part: SparePart; transaction: SpareTransaction }>('spareAction', { payload, actor }),

  authenticate: (identifier: string, password: string) =>
    unwrap<SessionUser>('authenticate', { identifier, password }),
  listActivity: () => unwrap<ActivityLogEntry[]>('listActivity'),
  getDashboard: (scope: { userId?: string; canViewAll: boolean }) =>
    unwrap<DashboardData>('getDashboard', { scope }),
  getReport: (report: string, filter: ReportFilter) =>
    unwrap<ReportPayload>('getReport', { report, filter }),
}
