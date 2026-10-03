import { cn } from '@/lib/utils/cn'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Tag = 'h2',
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  as?: 'h1' | 'h2'
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <Tag className="mt-2 text-3xl font-bold leading-[1.1] md:text-4xl">{title}</Tag>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-slate-muted">{description}</p>
      ) : null}
    </div>
  )
}

export function Section({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('py-16 md:py-24', className)} {...props}>
      <div className="container-page">{children}</div>
    </section>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-paper-sunken/60 px-6 py-16 text-center">
      <p className="text-base font-semibold text-ink-900">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-muted">{description}</p>
      ) : null}
    </div>
  )
}
