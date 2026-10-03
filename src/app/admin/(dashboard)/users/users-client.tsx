'use client'

import { useActionState, useRef, useState } from 'react'
import { UserPlus, Trash2, ShieldCheck, Crown, Eye, EyeOff } from 'lucide-react'
import type { AdminUserRow } from '@/types/db'
import type { ActionState } from '@/app/admin/actions'

const IDLE: ActionState = { status: 'idle' }

interface Props {
  users: AdminUserRow[]
  callerId: string
  addAction: (prev: ActionState, formData: FormData) => Promise<ActionState>
  deleteAction: (formData: FormData) => Promise<void>
}

export function UsersClient({ users, callerId, addAction, deleteAction }: Props) {
  const [state, formAction, pending] = useActionState(addAction, IDLE)
  const formRef = useRef<HTMLFormElement>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Clear the form on success
  if (state.status === 'success' && formRef.current) {
    formRef.current.reset()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      {/* ── header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-950">Users</h1>
        <p className="mt-1 text-sm text-slate-muted">
          Admins can manage content. Owners have the same access, making it easy to see who the
          primary account holder is.
        </p>
      </div>

      {/* ── add user form ── */}
      <section className="rounded-[var(--radius-card)] border border-line bg-paper-raised p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-ink-700">
          Add a new user
        </h2>
        <form ref={formRef} action={formAction} className="space-y-4">
          {/* email + name row */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="user-email" className="block text-sm font-medium text-ink-900 mb-1">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="user-email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                className="w-full rounded-[var(--radius-card)] border border-line bg-paper px-3 py-2 text-sm text-ink-950 placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-ink-950"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="user-name" className="block text-sm font-medium text-ink-900 mb-1">
                Full name
              </label>
              <input
                id="user-name"
                name="full_name"
                type="text"
                placeholder="Jane Smith"
                className="w-full rounded-[var(--radius-card)] border border-line bg-paper px-3 py-2 text-sm text-ink-950 placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-ink-950"
              />
            </div>
          </div>

          {/* password + role row */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="user-password" className="block text-sm font-medium text-ink-900 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="user-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-[var(--radius-card)] border border-line bg-paper px-3 py-2 pr-10 text-sm text-ink-950 placeholder:text-slate-soft focus:outline-none focus:ring-2 focus:ring-ink-950"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-ink-700"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="user-role" className="block text-sm font-medium text-ink-900 mb-1">
                Role
              </label>
              <select
                id="user-role"
                name="role"
                defaultValue="admin"
                className="w-full rounded-[var(--radius-card)] border border-line bg-paper px-3 py-2 text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-ink-950"
              >
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>

          {/* feedback */}
          {state.status === 'error' && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}
          {state.status === 'success' && (
            <p className="text-sm text-green-700">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-ink-950 px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            {pending ? 'Creating user…' : 'Add user'}
          </button>
        </form>
      </section>

      {/* ── existing users list ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-ink-700">
          Current users
        </h2>
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-paper-raised overflow-hidden">
          {users.map((user) => {
            const isSelf = user.id === callerId
            const isOwner = user.role === 'owner'
            return (
              <li key={user.id} className="flex items-center gap-3 px-5 py-4">
                {/* role icon */}
                <span className="shrink-0 text-ink-700">
                  {isOwner ? (
                    <Crown className="size-4" aria-label="Owner" />
                  ) : (
                    <ShieldCheck className="size-4" aria-label="Admin" />
                  )}
                </span>

                {/* info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-950">
                    {user.full_name ?? user.email}
                    {isSelf && (
                      <span className="ml-2 text-xs text-slate-muted font-normal">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-muted">
                    {user.full_name ? user.email + ' · ' : ''}{user.role}
                  </p>
                </div>

                {/* remove */}
                {!isSelf && (
                  <>
                    {confirmId === user.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-700">Remove?</span>
                        <form action={deleteAction}>
                          <input type="hidden" name="id" value={user.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Yes, remove
                          </button>
                        </form>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="text-xs text-slate-muted hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(user.id)}
                        aria-label={`Remove ${user.email}`}
                        className="shrink-0 text-slate-muted hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
