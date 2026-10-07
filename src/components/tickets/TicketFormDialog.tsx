import { useEffect, useMemo, useState } from 'react'

import { SelectField, TextField, TextareaField } from '@/components/common/fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { useLookups } from '@/hooks/useLookups'
import { getErrorMessage } from '@/services/apiClient'
import { dataSource } from '@/services/datasource'
import type { Ticket } from '@/types'
import { DEFAULT_SLA_RULES, PRIORITIES } from '@/utils/constants'
import { ticketCode } from '@/utils/id'

interface TicketFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (ticket: Ticket) => void
}

export function TicketFormDialog({ open, onOpenChange, onCreated }: TicketFormDialogProps) {
  const { user } = useAuth()
  const { data: lookups, subcategoriesFor, nameFor } = useLookups()
  const [values, setValues] = useState({
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    priority: 'medium',
    departmentId: '',
    locationId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues({
      title: '',
      description: '',
      categoryId: lookups.ticket_categories[0]?.id ?? '',
      subcategoryId: '',
      priority: 'medium',
      departmentId: user?.departmentId ?? lookups.departments[0]?.id ?? '',
      locationId: '',
    })
    setErrors({})
    setFormError(null)
  }, [open, lookups.ticket_categories, lookups.departments, user?.departmentId])

  const subcategoryOptions = useMemo(
    () => subcategoriesFor(values.categoryId),
    [subcategoriesFor, values.categoryId],
  )

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value, ...(name === 'categoryId' ? { subcategoryId: '' } : {}) }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {}
    if (!values.title.trim()) nextErrors.title = 'Title is required'
    if (!values.description.trim()) nextErrors.description = 'Please describe the issue'
    if (!values.categoryId) nextErrors.categoryId = 'Category is required'
    if (!values.departmentId) nextErrors.departmentId = 'Department is required'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setFormError(null)
    try {
      const sla = DEFAULT_SLA_RULES.find((rule) => rule.priority === values.priority)
      const slaHours = sla?.resolveHours ?? 24
      const due = new Date(Date.now() + slaHours * 3600000).toISOString()
      const payload: Partial<Ticket> = {
        code: ticketCode(),
        title: values.title.trim(),
        description: values.description.trim(),
        requesterId: user?.employeeId ?? user?.id ?? '',
        requesterName: user?.name ?? '',
        employeeId: user?.employeeId,
        departmentId: values.departmentId,
        locationId: values.locationId || undefined,
        categoryId: values.categoryId,
        subcategoryId: values.subcategoryId || undefined,
        priority: values.priority as Ticket['priority'],
        status: 'new',
        slaHours,
        dueDate: due,
        reopenCount: 0,
      }
      const created = await dataSource.create<Ticket>('tickets', payload, user?.name ?? 'system')
      onCreated?.(created)
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
          <DialogTitle>Raise a support ticket</DialogTitle>
          <DialogDescription>
            Describe your IT issue and it will be routed to the service desk.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Title"
            required
            containerClassName="sm:col-span-2"
            error={errors.title}
            placeholder="Short summary of the issue"
            value={values.title}
            onChange={(event) => setValue('title', event.target.value)}
          />
          <TextareaField
            label="Description"
            required
            containerClassName="sm:col-span-2"
            error={errors.description}
            rows={4}
            placeholder="What happened? Any error messages? When did it start?"
            value={values.description}
            onChange={(event) => setValue('description', event.target.value)}
          />
          <SelectField
            label="Category"
            required
            error={errors.categoryId}
            value={values.categoryId}
            onValueChange={(value) => setValue('categoryId', value)}
            options={lookups.ticket_categories.map((category) => ({ value: category.id, label: category.name }))}
          />
          <SelectField
            label="Sub-category"
            value={values.subcategoryId}
            onValueChange={(value) => setValue('subcategoryId', value)}
            options={subcategoryOptions}
            disabled={subcategoryOptions.length === 0}
          />
          <SelectField
            label="Priority"
            value={values.priority}
            onValueChange={(value) => setValue('priority', value)}
            options={PRIORITIES}
          />
          <SelectField
            label="Department"
            required
            error={errors.departmentId}
            value={values.departmentId}
            onValueChange={(value) => setValue('departmentId', value)}
            options={lookups.departments.map((department) => ({ value: department.id, label: department.name }))}
          />
          <SelectField
            label="Location"
            containerClassName="sm:col-span-2"
            value={values.locationId}
            onValueChange={(value) => setValue('locationId', value)}
            options={lookups.locations.map((location) => ({
              value: location.id,
              label: nameFor('locations', location.id),
            }))}
          />
        </div>

        {formError ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
            Submit ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
