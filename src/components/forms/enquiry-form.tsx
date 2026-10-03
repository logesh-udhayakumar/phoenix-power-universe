'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { submitEnquiry, type EnquiryState } from '@/app/(public)/contact/actions'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PROJECT_TYPES } from '@/config/navigation'

const initialState: EnquiryState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-card)] bg-amber-accent px-7 text-sm font-semibold text-white transition-colors hover:bg-amber-accent-hover disabled:opacity-60 sm:w-auto"
    >
      {pending ? 'Sending...' : 'Send Enquiry'}
      {pending ? null : <Send className="size-4" aria-hidden="true" />}
    </button>
  )
}

export function EnquiryForm() {
  const [state, formAction] = useActionState(submitEnquiry, initialState)
  const errors = state.fieldErrors ?? {}

  if (state.status === 'success') {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-success/30 bg-success/5 px-6 py-14 text-center"
      >
        <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
        <p className="text-base font-semibold text-ink-950">Enquiry sent</p>
        <p className="max-w-sm text-sm text-slate-muted">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.status === 'error' && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <Field label="Phone" htmlFor="phone" required error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <Field label="Company" htmlFor="company" error={errors.company}>
          <Input id="company" name="company" autoComplete="organization" />
        </Field>
      </div>

      <Field label="Project type" htmlFor="project_type" error={errors.project_type}>
        <Select id="project_type" name="project_type" defaultValue="">
          <option value="">Not sure yet</option>
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Message"
        htmlFor="message"
        error={errors.message}
        hint="Tell us what the job involves and where the site is."
      >
        <Textarea id="message" name="message" rows={5} />
      </Field>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <SubmitButton />
    </form>
  )
}
