import { EntityEditor, type EditorField } from '@/components/admin/entity-editor'
import { adminGetCategories } from '@/lib/admin-queries'
import { deleteCategory, saveCategory } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Categories' }

const FIELDS: EditorField[] = [
  { name: 'name', label: 'Category name', type: 'text', required: true, placeholder: 'Electrical' },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    hint: 'Optional. Shown on category listings.',
  },
  {
    name: 'image_url',
    label: 'Picture',
    type: 'image',
    bucket: 'service-images',
    hint: 'Optional. Used where the category is shown with a picture.',
  },
  { name: 'is_active', label: 'Show on the website', type: 'checkbox' },
]

export default async function AdminCategoriesPage() {
  const categories = await adminGetCategories()

  return (
    <EntityEditor
      heading="Categories"
      description="Group your projects by the kind of work — Electrical, Plumbing, Maintenance."
      table="categories"
      addLabel="Add category"
      emptyMessage="No categories yet. Add Electrical, Plumbing and Maintenance to get started."
      fields={FIELDS}
      saveAction={saveCategory}
      deleteAction={deleteCategory}
      rows={categories.map((category) => ({
        id: category.id,
        title: category.name,
        subtitle: category.description ?? undefined,
        badges: [
          ...(category.is_active ? [] : [{ label: 'Hidden', tone: 'muted' as const }]),
          ...(category.is_demo ? [{ label: 'Demo', tone: 'neutral' as const }] : []),
        ],
        values: {
          name: category.name,
          description: category.description,
          image_url: category.image_url,
          is_active: category.is_active,
        },
      }))}
    />
  )
}
