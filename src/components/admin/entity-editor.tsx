'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { ActionState } from '@/app/admin/actions'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { OrderArrows } from './order-arrows'
import { ImageField } from './image-field'
import type { BucketName } from '@/lib/storage/provider'
import type { OrderableTable } from '@/app/admin/actions'

/** Categories, services and testimonials are the same interaction: a list of
 *  rows, an inline form to add one, and the same form prefilled to edit one.
 *  Rather than three copies of that, the shape of each form is described by a
 *  field list and this component renders it. */

export type EditorFieldType =
  | 'text'
  | 'textarea'
  | 'list'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'image'

export interface EditorField {
  name: string
  label: string
  type: EditorFieldType
  required?: boolean
  hint?: string
  placeholder?: string
  rows?: number
  options?: { value: string; label: string }[]
  /** Required for type 'image': which storage bucket the file goes to. */
  bucket?: BucketName
}

export interface EditorRow {
  id: string
  title: string
  subtitle?: string
  badges?: { label: string; tone?: 'muted' | 'success' | 'accent' | 'neutral' }[]
  values: Record<string, string | number | boolean | string[] | null>
}

const initialState: ActionState = { status: 'idle' }

export function EntityEditor({
  heading,
  description,
  addLabel,
  emptyMessage,
  fields,
  rows,
  table,
  saveAction,
  deleteAction,
}: {
  heading: string
  description: string
  addLabel: string
  emptyMessage: string
  fields: EditorField[]
  rows: EditorRow[]
  /** Which table these rows belong to, for the reorder arrows. */
  table: OrderableTable
  saveAction: (prev: ActionState, formData: FormData) => Promise<ActionState>
  deleteAction: (formData: FormData) => void | Promise<void>
}) {
  const [state, formAction] = useActionState(saveAction, initialState)
  // null = form closed, '' = adding, otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null)

  // Close the form once a save succeeds, so the owner lands back on the list
  // and can see the row they just changed. Compared during render rather than
  // in an effect, which would leave the form open for a frame first.
  const [lastState, setLastState] = useState(state)
  if (state !== lastState) {
    setLastState(state)
    if (state.status === 'success') setEditing(null)
  }

  const editingRow = editing ? rows.find((r) => r.id === editing) : undefined
  const isOpen = editing !== null

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{heading}</h1>
          <p className="mt-1 text-sm text-slate-muted">{description}</p>
        </div>
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setEditing('')}
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-card)] bg-amber-accent px-5 text-sm font-semibold text-white hover:bg-amber-accent-hover"
          >
            <Plus className="size-4" aria-hidden="true" />
            {addLabel}
          </button>
        ) : null}
      </div>

      {state.status === 'success' && state.message ? (
        <div
          role="status"
          className="mt-5 flex items-center gap-2.5 rounded-[var(--radius-card)] border border-success/30 bg-success/5 p-3 text-sm text-success"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </div>
      ) : null}

      {isOpen ? (
        <form
          action={formAction}
          className="mt-6 rounded-[var(--radius-card)] border border-line bg-paper-raised p-5"
          noValidate
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {editingRow ? `Edit ${editingRow.title}` : addLabel}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              aria-label="Close form"
              className="inline-flex size-9 items-center justify-center text-slate-muted hover:text-ink-900"
            >
              <X className="size-4" />
            </button>
          </div>

          {editingRow ? <input type="hidden" name="id" value={editingRow.id} /> : null}

          {state.status === 'error' && state.message ? (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {state.message}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-5">
            {fields.map((field) => (
              <EditorFieldInput
                key={field.name}
                field={field}
                value={editingRow?.values[field.name] ?? null}
                error={state.fieldErrors?.[field.name]}
              />
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <SaveButton />
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex h-11 items-center rounded-[var(--radius-card)] border border-line-strong px-5 text-sm font-medium hover:bg-paper-sunken"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {rows.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-paper-raised px-6 py-14 text-center">
          <p className="text-sm text-slate-muted">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-paper-raised p-4"
            >
              <OrderArrows
                table={table}
                id={row.id}
                isFirst={index === 0}
                isLast={index === rows.length - 1}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{row.title}</p>
                  {row.badges?.map((badge) => (
                    <Badge key={badge.label} tone={badge.tone ?? 'muted'}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>
                {row.subtitle ? (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-muted">
                    {row.subtitle}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(row.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-card)] border border-line-strong px-3 text-xs font-semibold hover:bg-paper-sunken"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit
                </button>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <button
                    type="submit"
                    aria-label={`Delete ${row.title}`}
                    className="inline-flex size-9 items-center justify-center rounded-[var(--radius-card)] text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EditorFieldInput({
  field,
  value,
  error,
}: {
  field: EditorField
  value: string | number | boolean | string[] | null
  error?: string
}) {
  const id = `field-${field.name}`

  if (field.type === 'image') {
    return (
      <ImageField
        name={field.name}
        label={field.label}
        bucket={field.bucket ?? 'service-images'}
        prefix="library"
        defaultValue={typeof value === 'string' ? value : null}
        hint={field.hint}
      />
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          name={field.name}
          defaultChecked={Boolean(value)}
          className="mt-0.5 size-4 accent-[var(--color-amber-accent)]"
        />
        <span>
          <span className="block text-sm font-medium">{field.label}</span>
          {field.hint ? (
            <span className="block text-xs text-slate-muted">{field.hint}</span>
          ) : null}
        </span>
      </label>
    )
  }

  const stringValue = Array.isArray(value)
    ? value.join('\n')
    : value === null || value === undefined
      ? ''
      : String(value)

  return (
    <Field
      label={field.label}
      htmlFor={id}
      required={field.required}
      error={error}
      hint={field.hint}
    >
      {field.type === 'textarea' || field.type === 'list' ? (
        <Textarea
          id={id}
          name={field.name}
          rows={field.rows ?? (field.type === 'list' ? 5 : 4)}
          defaultValue={stringValue}
          placeholder={field.placeholder}
          aria-invalid={Boolean(error)}
        />
      ) : field.type === 'select' ? (
        <Select id={id} name={field.name} defaultValue={stringValue}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          id={id}
          name={field.name}
          type={field.type === 'number' ? 'number' : 'text'}
          min={field.type === 'number' ? 0 : undefined}
          defaultValue={stringValue}
          placeholder={field.placeholder}
          required={field.required}
          aria-invalid={Boolean(error)}
        />
      )}
    </Field>
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
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}
