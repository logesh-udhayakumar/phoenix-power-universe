import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EmptyState } from '@/components/public/section'
import { ProjectGrid } from '@/components/projects/project-card'
import { ProjectFilters } from '@/components/projects/project-filters'
import { getCategories, getPublishedProjects, type ProjectSort } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Our Work',
  description:
    'Completed electrical, plumbing and maintenance projects across residential, commercial and industrial sites.',
  alternates: { canonical: '/projects' },
}

const SORTS: ProjectSort[] = ['newest', 'oldest', 'featured', 'manual']

function parseSort(value: string | undefined): ProjectSort {
  return SORTS.includes(value as ProjectSort) ? (value as ProjectSort) : 'manual'
}

/** Next 16: searchParams is a Promise and must be awaited. */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const one = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }

  const [categories, projects] = await Promise.all([
    getCategories(),
    getPublishedProjects({
      category: one('category') ?? null,
      type: one('type') ?? null,
      search: one('q') ?? null,
      sort: parseSort(one('sort')),
    }),
  ])

  return (
    <>
      <section className="border-b border-line bg-paper-sunken">
        <div className="container-page py-14 md:py-20">
          <p className="eyebrow">Our work</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">
            Projects we have completed
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-muted">
            Browse finished work by trade, by site type, or by city. Every project
            page shows the full scope and photographs from site.
          </p>
        </div>
      </section>

      <div className="container-page py-10 md:py-14">
        {/* useSearchParams needs a Suspense boundary during prerender. */}
        <Suspense fallback={<div className="h-28" />}>
          <ProjectFilters categories={categories} resultCount={projects.length} />
        </Suspense>

        <div className="mt-10">
          {projects.length === 0 ? (
            <EmptyState
              title="No projects match these filters."
              description="Try clearing a filter, or search for a different city or project name."
            />
          ) : (
            <ProjectGrid projects={projects} />
          )}
        </div>
      </div>
    </>
  )
}
