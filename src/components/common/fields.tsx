import type { ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import type { InputProps } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { TextareaProps } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Option } from '@/utils/constants'

interface FieldShellProps {
  label?: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, error, hint, required, className, children }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

interface TextFieldProps extends InputProps {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

export function TextField({ label, error, hint, required, containerClassName, className, ...props }: TextFieldProps) {
  return (
    <FormField label={label} htmlFor={props.id} error={error} hint={hint} required={required} className={containerClassName}>
      <Input className={cn(error && 'border-destructive', className)} {...props} />
    </FormField>
  )
}

interface TextareaFieldProps extends TextareaProps {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

export function TextareaField({ label, error, hint, required, containerClassName, className, ...props }: TextareaFieldProps) {
  return (
    <FormField label={label} htmlFor={props.id} error={error} hint={hint} required={required} className={containerClassName}>
      <Textarea className={cn(error && 'border-destructive', className)} {...props} />
    </FormField>
  )
}

interface SelectFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  containerClassName?: string
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options: Option[]
  disabled?: boolean
}

export function SelectField({
  label,
  error,
  hint,
  required,
  containerClassName,
  value,
  onValueChange,
  placeholder = 'Select…',
  options,
  disabled,
}: SelectFieldProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <Select value={value ?? ''} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn(error && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}

interface DateFieldProps extends Omit<InputProps, 'type'> {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

export function DateField({ label, error, hint, required, containerClassName, className, ...props }: DateFieldProps) {
  return (
    <FormField label={label} htmlFor={props.id} error={error} hint={hint} required={required} className={containerClassName}>
      <Input type="date" className={cn(error && 'border-destructive', className)} {...props} />
    </FormField>
  )
}
