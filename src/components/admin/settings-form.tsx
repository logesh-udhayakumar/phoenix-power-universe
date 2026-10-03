'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { saveSettings, type ActionState } from '@/app/admin/actions'
import { Field, Input, Textarea } from '@/components/ui/input'

const initialState: ActionState = { status: 'idle' }

/** These values appear in the header, footer, contact page and every
 *  WhatsApp link. Editing them here changes the whole site with no deploy. */
export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, formAction] = useActionState(saveSettings, initialState)
  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.status === 'success' && state.message ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-[var(--radius-card)] border border-success/30 bg-success/5 p-3 text-sm text-success"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </div>
      ) : null}
      {state.status === 'error' && state.message ? (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Phone number"
          htmlFor="phone"
          error={errors.phone}
          hint="Shown in the footer and used for the Call button."
        >
          <Input id="phone" name="phone" defaultValue={values.phone ?? ''} placeholder="+91 98765 43210" />
        </Field>

        <Field
          label="WhatsApp number"
          htmlFor="whatsapp"
          error={errors.whatsapp}
          hint="Include the country code. Leave blank to use the phone number."
        >
          <Input
            id="whatsapp"
            name="whatsapp"
            defaultValue={values.whatsapp ?? ''}
            placeholder="+91 98765 43210"
          />
        </Field>

        <Field label="Email address" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" defaultValue={values.email ?? ''} />
        </Field>

        <Field
          label="Google Maps link"
          htmlFor="maps_url"
          error={errors.maps_url}
          hint="Optional. Paste the share link from Google Maps."
        >
          <Input id="maps_url" name="maps_url" defaultValue={values.maps_url ?? ''} />
        </Field>
      </div>

      <Field label="Address" htmlFor="address" error={errors.address}>
        <Textarea id="address" name="address" rows={3} defaultValue={values.address ?? ''} />
      </Field>

      <Field
        label="Service areas"
        htmlFor="service_areas"
        error={errors.service_areas}
        hint="Separate with commas, for example: Chennai, Coimbatore, Bengaluru"
      >
        <Input
          id="service_areas"
          name="service_areas"
          defaultValue={values.service_areas ?? ''}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="Instagram" htmlFor="instagram" error={errors.instagram}>
          <Input id="instagram" name="instagram" defaultValue={values.instagram ?? ''} />
        </Field>
        <Field label="Facebook" htmlFor="facebook" error={errors.facebook}>
          <Input id="facebook" name="facebook" defaultValue={values.facebook ?? ''} />
        </Field>
        <Field label="LinkedIn" htmlFor="linkedin" error={errors.linkedin}>
          <Input id="linkedin" name="linkedin" defaultValue={values.linkedin ?? ''} />
        </Field>
      </div>

      <div>
        <SaveButton />
      </div>
    </form>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-[var(--radius-card)] bg-ink-950 px-6 text-sm font-semibold text-paper hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? 'Saving...' : 'Save settings'}
    </button>
  )
}
