'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import { saveProject, type ActionState } from '@/app/admin/actions'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PROJECT_TYPES } from '@/config/navigation'
import type { Category, Project } from '@/types/db'
import { slugify } from '@/lib/utils/slug'
import { parseStoredLinks } from '@/lib/media-links'

const initialState: ActionState = { status: 'idle' }

/** Add / edit form. Deliberately plain: labels the owner would use, one
 *  column on a phone, and the slug hidden behind an "Advanced" disclosure so
 *  it is never something they have to think about. */
export function ProjectForm({
  project,
  categories,
}: {
  project?: Project
  categories: Category[]
}) {
  const [state, formAction] = useActionState(saveProject, initialState)
  const [title, setTitle] = useState(project?.title ?? '')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const errors = state.fieldErrors ?? {}

  // Shown back one per line, which is how they are easiest to check and edit.
  const linkText = parseStoredLinks(project?.media_links).join('\n')

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      {state.status === 'error' && state.message ? (
        <Banner tone="error">{state.message}</Banner>
      ) : null}
      {state.status === 'success' && state.message ? (
        <Banner tone="success">{state.message}</Banner>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Project name" htmlFor="title" required error={errors.title}>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chennai Commercial Office"
              required
            />
          </Field>
        </div>

        <Field label="Category" htmlFor="category_id" error={errors.category_id}>
          <Select
            id="category_id"
            name="category_id"
            defaultValue={project?.category_id ?? ''}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Project type" htmlFor="project_type" error={errors.project_type}>
          <Select
            id="project_type"
            name="project_type"
            defaultValue={project?.project_type ?? 'Commercial'}
          >
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Location / site" htmlFor="location" error={errors.location}>
          <Input
            id="location"
            name="location"
            defaultValue={project?.location ?? ''}
            placeholder="Anna Nagar"
          />
        </Field>

        <Field label="City" htmlFor="city" error={errors.city}>
          <Input id="city" name="city" defaultValue={project?.city ?? ''} placeholder="Chennai" />
        </Field>

        <Field label="State" htmlFor="state" error={errors.state}>
          <Input
            id="state"
            name="state"
            defaultValue={project?.state ?? ''}
            placeholder="Tamil Nadu"
          />
        </Field>

        <Field
          label="Completion date"
          htmlFor="completion_date"
          error={errors.completion_date}
        >
          <Input
            id="completion_date"
            name="completion_date"
            type="date"
            defaultValue={project?.completion_date ?? ''}
          />
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor="description"
        error={errors.description}
        hint="What the job involved, in a few sentences. Leave a blank line between paragraphs."
      >
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={project?.description ?? ''}
        />
      </Field>

      <Field
        label="Photo and video links"
        htmlFor="media_links"
        error={errors.media_links}
        hint="Paste YouTube, Instagram or Google Drive links, or direct links to a photo or video. Separate them with commas or put each on its own line — they appear in the project gallery. A Drive file must be shared with 'Anyone with the link' to show up."
      >
        <Textarea
          id="media_links"
          name="media_links"
          rows={4}
          defaultValue={linkText}
          placeholder={'https://youtu.be/xxxxxxxx\nhttps://www.instagram.com/p/xxxxxxxx/'}
        />
      </Field>

      <Field
        label="Scope of work"
        htmlFor="scope_of_work"
        error={errors.scope_of_work}
        hint="One item per line. These appear as a bullet list on the project page."
      >
        <Textarea
          id="scope_of_work"
          name="scope_of_work"
          rows={6}
          defaultValue={project?.scope_of_work.join('\n') ?? ''}
          placeholder={'Electrical wiring\nLighting\nDistribution panel\nTesting'}
        />
      </Field>

      <Field label="Status" htmlFor="status" error={errors.status}>
        <Select id="status" name="status" defaultValue={project?.status ?? 'draft'}>
          <option value="draft">Draft — only you can see it</option>
          <option value="published">Published — visible on the website</option>
        </Select>
      </Field>

      <label className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-paper-raised p-4">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={project?.featured ?? false}
          className="mt-0.5 size-4 accent-[var(--color-amber-accent)]"
        />
        <span>
          <span className="block text-sm font-medium">Show on the homepage</span>
          <span className="block text-xs text-slate-muted">
            Featured projects appear in the homepage gallery.
          </span>
        </span>
      </label>

      {/* The cover is chosen from the uploaded photos, not typed in. This
          keeps the current value with the form when it is saved again. */}
      <input
        type="hidden"
        name="cover_image_url"
        defaultValue={project?.cover_image_url ?? ''}
      />

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="inline-flex items-center gap-1.5 text-sm text-slate-muted hover:text-ink-900"
        >
          <ChevronDown
            className={`size-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          Advanced
        </button>

        {showAdvanced ? (
          <div className="mt-4">
            <Field
              label="Web address"
              htmlFor="slug"
              error={errors.slug}
              hint="Leave blank and this is created from the project name automatically."
            >
              <Input
                id="slug"
                name="slug"
                defaultValue={project?.slug ?? ''}
                placeholder={slugify(title) || 'chennai-commercial-office'}
              />
            </Field>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-line bg-paper-raised/95 px-5 py-4 backdrop-blur md:mx-0 md:rounded-[var(--radius-card)] md:border md:px-5">
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
      className="inline-flex h-11 items-center justify-center rounded-[var(--radius-card)] bg-ink-950 px-6 text-sm font-semibold text-paper transition-colors hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? 'Saving...' : 'Save project'}
    </button>
  )
}

function Banner({
  tone,
  children,
}: {
  tone: 'error' | 'success'
  children: React.ReactNode
}) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'flex items-start gap-2.5 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-3 text-sm text-danger'
          : 'flex items-start gap-2.5 rounded-[var(--radius-card)] border border-success/30 bg-success/5 p-3 text-sm text-success'
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
