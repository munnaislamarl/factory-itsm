function pad(value: number, size = 2): string {
  return String(value).padStart(size, '0')
}

export function generateId(prefix = 'id'): string {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${random}`
}

export function generateCode(prefix: string): string {
  const now = new Date()
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${date}-${random}`
}

export function ticketCode(): string {
  return generateCode('TK')
}

export function assetTag(): string {
  return generateCode('AST')
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
