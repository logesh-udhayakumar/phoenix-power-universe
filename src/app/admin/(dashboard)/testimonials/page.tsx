import { EntityEditor, type EditorField } from '@/components/admin/entity-editor'
import { adminGetTestimonials } from '@/lib/admin-queries'
import { deleteTestimonial, saveTestimonial } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Testimonials' }

const FIELDS: EditorField[] = [
  { name: 'customer_name', label: 'Customer name', type: 'text', required: true },
  { name: 'company_name', label: 'Company', type: 'text' },
  {
    name: 'content',
    label: 'What they said',
    type: 'textarea',
    required: true,
    rows: 5,
    hint: 'Use their own words. Only publish what the customer actually told you.',
  },
  {
    name: 'rating',
    label: 'Rating out of 5',
    type: 'select',
    options: [
      { value: '', label: 'No rating' },
      { value: '5', label: '5' },
      { value: '4', label: '4' },
      { value: '3', label: '3' },
      { value: '2', label: '2' },
      { value: '1', label: '1' },
    ],
  },
  { name: 'is_published', label: 'Show on the website', type: 'checkbox' },
]

export default async function AdminTestimonialsPage() {
  const testimonials = await adminGetTestimonials()

  return (
    <EntityEditor
      heading="Testimonials"
      description="Feedback from real customers. Nothing here is published until you tick the box."
      table="testimonials"
      addLabel="Add testimonial"
      emptyMessage="No testimonials yet."
      fields={FIELDS}
      saveAction={saveTestimonial}
      deleteAction={deleteTestimonial}
      rows={testimonials.map((t) => ({
        id: t.id,
        title: t.customer_name,
        subtitle: t.content,
        badges: [
          ...(t.is_published
            ? [{ label: 'Published', tone: 'success' as const }]
            : [{ label: 'Hidden', tone: 'muted' as const }]),
          ...(t.is_demo ? [{ label: 'Demo', tone: 'neutral' as const }] : []),
        ],
        values: {
          customer_name: t.customer_name,
          company_name: t.company_name,
          content: t.content,
          rating: t.rating,
          is_published: t.is_published,
        },
      }))}
    />
  )
}
