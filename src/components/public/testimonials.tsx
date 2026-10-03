import Image from 'next/image'
import { Quote, Star } from 'lucide-react'
import type { Testimonial } from '@/types/db'
import { cn } from '@/lib/utils/cn'

/** Customer reviews.
 *
 *  Follows the pattern most review sections settle on, because it is what
 *  people already know how to read: rating first, the words next, and the
 *  person last. The attribution carries an avatar — the customer's photo if
 *  there is one, otherwise their initial — because an unattributed quote in
 *  a box reads as marketing copy, while a name and a face reads as a person.
 *
 *  A single review is centred and given more room rather than left stranded
 *  in a three-column grid, which is what makes a new site look empty.
 */
export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null

  const single = testimonials.length === 1

  return (
    <div
      className={cn(
        'grid gap-6',
        single ? 'mx-auto max-w-2xl' : 'md:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {testimonials.map((testimonial) => (
        <TestimonialCard
          key={testimonial.id}
          testimonial={testimonial}
          emphasis={single}
        />
      ))}
    </div>
  )
}

function TestimonialCard({
  testimonial,
  emphasis,
}: {
  testimonial: Testimonial
  emphasis?: boolean
}) {
  return (
    <figure
      className={cn(
        'relative flex flex-col rounded-[var(--radius-card)] border border-line bg-paper-raised shadow-[var(--shadow-card)]',
        emphasis ? 'p-8 md:p-10' : 'p-7',
      )}
    >
      <Quote
        className="absolute right-6 top-6 size-8 text-amber-accent/15"
        aria-hidden="true"
      />

      {testimonial.rating ? <Rating value={testimonial.rating} /> : null}

      <blockquote
        className={cn(
          'relative mt-4 flex-1 leading-relaxed text-ink-800',
          emphasis ? 'text-base md:text-lg' : 'text-sm',
        )}
      >
        {testimonial.content}
      </blockquote>

      <figcaption className="mt-7 flex items-center gap-3 border-t border-line pt-5">
        <Avatar
          name={testimonial.customer_name}
          imageUrl={testimonial.image_url}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-950">
            {testimonial.customer_name}
          </p>
          {testimonial.company_name ? (
            <p className="truncate text-xs text-slate-muted">
              {testimonial.company_name}
            </p>
          ) : null}
        </div>
      </figcaption>
    </figure>
  )
}

function Rating({ value }: { value: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${value} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            'size-4',
            i < value ? 'fill-amber-accent text-amber-accent' : 'text-line-strong',
          )}
        />
      ))}
    </div>
  )
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-paper-sunken">
        <Image src={imageUrl} alt="" fill sizes="40px" quality={60} className="object-cover" />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-paper"
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
