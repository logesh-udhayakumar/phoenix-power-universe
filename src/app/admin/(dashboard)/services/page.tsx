import { EntityEditor, type EditorField } from '@/components/admin/entity-editor'
import { adminGetServices } from '@/lib/admin-queries'
import { deleteService, saveService } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Services' }

const FIELDS: EditorField[] = [
  { name: 'name', label: 'Service name', type: 'text', required: true, placeholder: 'Electrical Works' },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    hint: 'What this service covers, in a few sentences.',
  },
  {
    name: 'details',
    label: 'What this includes',
    type: 'list',
    hint: 'One item per line. These appear as a bullet list.',
    placeholder: 'Electrical Wiring\nRewiring\nLighting Installation',
  },
  {
    name: 'image_url',
    label: 'Picture',
    type: 'image',
    bucket: 'service-images',
    hint: 'Shown on the Services page and the service detail page.',
  },
  { name: 'is_active', label: 'Show on the website', type: 'checkbox' },
]

export default async function AdminServicesPage() {
  const services = await adminGetServices()

  return (
    <EntityEditor
      heading="Services"
      description="The work you offer. These appear on the homepage and the Services page."
      table="services"
      addLabel="Add service"
      emptyMessage="No services yet. Add Electrical Works, Plumbing Works and Maintenance."
      fields={FIELDS}
      saveAction={saveService}
      deleteAction={deleteService}
      rows={services.map((service) => ({
        id: service.id,
        title: service.name,
        subtitle: service.description ?? undefined,
        badges: [
          ...(service.is_active ? [] : [{ label: 'Hidden', tone: 'muted' as const }]),
          ...(service.is_demo ? [{ label: 'Demo', tone: 'neutral' as const }] : []),
        ],
        values: {
          name: service.name,
          description: service.description,
          image_url: service.image_url,
          details: service.details,
          is_active: service.is_active,
        },
      }))}
    />
  )
}
