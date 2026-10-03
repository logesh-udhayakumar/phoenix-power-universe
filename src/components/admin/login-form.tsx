'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import { signIn, type LoginState } from '@/app/admin/login/actions'
import { Field, Input } from '@/components/ui/input'

const initialState: LoginState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-card)] bg-ink-950 text-sm font-semibold text-paper transition-colors hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === 'error' && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </div>
      ) : null}

      <Field label="Email address" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
        />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <SubmitButton />
    </form>
  )
}
