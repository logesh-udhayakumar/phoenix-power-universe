import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const base =
  'w-full rounded-[var(--radius-card)] border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-soft transition-colors focus:border-amber-accent disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(base, 'h-11', className)} {...props} />
  },
)

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(base, 'min-h-28 resize-y', className)} {...props} />
})

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn(base, 'h-11 pr-8', className)} {...props} />
})

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('text-sm font-medium text-ink-800', className)} {...props}>
      {children}
      {required ? <span className="ml-0.5 text-danger" aria-hidden="true">*</span> : null}
    </label>
  )
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="text-xs font-medium text-danger">
      {children}
    </p>
  )
}

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs text-slate-muted">{hint}</p> : null}
      <FieldError>{error}</FieldError>
    </div>
  )
}
