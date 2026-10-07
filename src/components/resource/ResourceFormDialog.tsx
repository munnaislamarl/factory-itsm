import { useEffect, useMemo, useState } from 'react'

import { DateField, SelectField, TextField, TextareaField } from '@/components/common/fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { FieldConfig, ResourceConfig } from '@/config/resources'
import { useLookups } from '@/hooks/useLookups'
import { getErrorMessage } from '@/services/apiClient'
import type { Option } from '@/utils/constants'

export type FormValues = Record<string, unknown>

interface ResourceFormDialogProps {
  config: ResourceConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Record<string, unknown> | null
  onSubmit: (values: FormValues) => Promise<void>
}

function defaultsFor(config: ResourceConfig): FormValues {
  const values: FormValues = {}
  config.fields.forEach((field) => {
    if (field.defaultValue !== undefined) values[field.name] = field.defaultValue
    else if (field.type === 'checkbox') values[field.name] = false
    else values[field.name] = ''
  })
  return values
}

export function ResourceFormDialog({ config, open, onOpenChange, initial, onSubmit }: ResourceFormDialogProps) {
  const { optionsFor, subcategoriesFor } = useLookups()
  const [values, setValues] = useState<FormValues>(defaultsFor(config))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      const base = defaultsFor(config)
      config.fields.forEach((field) => {
        const value = initial[field.name]
        base[field.name] = value ?? base[field.name]
      })
      setValues(base)
    } else {
      setValues(defaultsFor(config))
    }
    setErrors({})
    setFormError(null)
  }, [open, initial, config])

  const optionsForField = useMemo(
    () => (field: FieldConfig): Option[] => {
      if (field.options) return field.options
      if (field.optionsFrom === 'subcategories') return subcategoriesFor(String(values.categoryId ?? ''))
      if (field.optionsFrom) return optionsFor(field.optionsFrom)
      return []
    },
    [optionsFor, subcategoriesFor, values.categoryId],
  )

  function setValue(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    config.fields.forEach((field) => {
      const value = values[field.name]
      if (field.required && (value === '' || value == null)) {
        next[field.name] = 'This field is required'
      }
      if (field.type === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value))) {
        next[field.name] = 'Enter a valid email address'
      }
      if (field.type === 'number' && value !== '' && value != null && Number.isNaN(Number(value))) {
        next[field.name] = 'Enter a valid number'
      }
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    setFormError(null)
    try {
      const payload: FormValues = {}
      config.fields.forEach((field) => {
        const value = values[field.name]
        if (field.type === 'number') payload[field.name] = value === '' || value == null ? undefined : Number(value)
        else payload[field.name] = value
      })
      await onSubmit(payload)
      onOpenChange(false)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? `Edit ${config.singular}` : `New ${config.singular}`}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {config.fields.map((field) => {
            const commonClass = field.full ? 'sm:col-span-2' : undefined
            const value = values[field.name]

            if (field.type === 'checkbox') {
              return (
                <div key={field.name} className={`flex items-center justify-between rounded-lg border border-border px-3 py-2.5 ${field.full ? 'sm:col-span-2' : ''}`}>
                  <div>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
                  </div>
                  <Switch
                    id={field.name}
                    checked={Boolean(value)}
                    onCheckedChange={(checked) => setValue(field.name, checked)}
                  />
                </div>
              )
            }

            if (field.type === 'select') {
              return (
                <SelectField
                  key={field.name}
                  label={field.label}
                  required={field.required}
                  error={errors[field.name]}
                  hint={field.help}
                  containerClassName={commonClass}
                  value={value == null ? '' : String(value)}
                  onValueChange={(next) => setValue(field.name, next)}
                  options={optionsForField(field)}
                  placeholder={`Select ${field.label.toLowerCase()}…`}
                />
              )
            }

            if (field.type === 'textarea') {
              return (
                <TextareaField
                  key={field.name}
                  label={field.label}
                  required={field.required}
                  error={errors[field.name]}
                  hint={field.help}
                  containerClassName={commonClass}
                  value={value == null ? '' : String(value)}
                  onChange={(event) => setValue(field.name, event.target.value)}
                  rows={3}
                />
              )
            }

            if (field.type === 'date') {
              return (
                <DateField
                  key={field.name}
                  label={field.label}
                  required={field.required}
                  error={errors[field.name]}
                  hint={field.help}
                  containerClassName={commonClass}
                  value={value == null ? '' : String(value)}
                  onChange={(event) => setValue(field.name, event.target.value)}
                />
              )
            }

            return (
              <TextField
                key={field.name}
                label={field.label}
                required={field.required}
                error={errors[field.name]}
                hint={field.help}
                containerClassName={commonClass}
                type={field.type === 'number' ? 'number' : field.type}
                min={field.min}
                placeholder={field.placeholder}
                value={value == null ? '' : String(value)}
                onChange={(event) => setValue(field.name, event.target.value)}
              />
            )
          })}
        </div>

        {formError ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
            {initial ? 'Save changes' : `Create ${config.singular}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
