import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '0'
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatCurrency(
  value: number | null | undefined,
  currency = 'BDT',
): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return isValid(value) ? value : null
  if (typeof value === 'number') {
    const d = new Date(value)
    return isValid(d) ? d : null
  }
  const text = String(value)
  const parsed = parseISO(text)
  if (isValid(parsed)) return parsed
  const fallback = new Date(text)
  return isValid(fallback) ? fallback : null
}

export function formatDate(value: unknown, pattern = 'dd MMM yyyy'): string {
  const date = toDate(value)
  return date ? format(date, pattern) : '—'
}

export function formatDateTime(value: unknown): string {
  const date = toDate(value)
  return date ? format(date, 'dd MMM yyyy, HH:mm') : '—'
}

export function formatTime(value: unknown): string {
  const date = toDate(value)
  return date ? format(date, 'HH:mm') : '—'
}

export function formatRelative(value: unknown): string {
  const date = toDate(value)
  if (!date) return '—'
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function daysUntil(value: unknown): number | null {
  const date = toDate(value)
  if (!date) return null
  const diff = date.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isWithinDays(value: unknown, days: number): boolean {
  const remaining = daysUntil(value)
  return remaining != null && remaining >= 0 && remaining <= days
}

export function isOverdue(value: unknown): boolean {
  const remaining = daysUntil(value)
  return remaining != null && remaining < 0
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
