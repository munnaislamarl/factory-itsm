import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FieldConfig, ResourceConfig } from '@/config/resources'
import { useLookups } from '@/hooks/useLookups'
import { optionLabel } from '@/utils/constants'

interface ResourceViewDialogProps {
  config: ResourceConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  data: Record<string, unknown> | null
}

export function ResourceViewDialog({ config, open, onOpenChange, data }: ResourceViewDialogProps) {
  const { optionsFor } = useLookups()

  function renderValue(field: FieldConfig): string {
    const value = data?.[field.name]
    if (field.type === 'checkbox') return value ? 'Yes' : 'No'
    if (value == null || value === '') return '—'
    if (field.type === 'select') {
      if (field.options) return optionLabel(field.options, String(value))
      if (field.optionsFrom && field.optionsFrom !== 'subcategories') {
        const option = optionsFor(field.optionsFrom).find((item) => item.value === String(value))
        return option?.label ?? String(value)
      }
    }
    return String(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{config.singular} Details</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {config.fields.map((field) => (
            <div key={field.name} className={field.full ? 'sm:col-span-2' : undefined}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {field.label}
              </p>
              <p className="mt-1 break-words text-sm text-foreground">{renderValue(field)}</p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
