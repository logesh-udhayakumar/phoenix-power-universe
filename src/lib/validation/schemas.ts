import { z } from 'zod'

/** One set of schemas used by BOTH the client form and the server action, so
 *  client-side validation can never be the only check. */

const trimmed = (max: number) => z.string().trim().max(max)
const optionalText = (max: number) =>
  trimmed(max).optional().or(z.literal('')).transform((v) => (v ? v : null))

export const projectTypeSchema = z.enum([
  'Residential',
  'Commercial',
  'Industrial',
  'Other',
])

export const projectStatusSchema = z.enum(['draft', 'published'])

export const projectSchema = z.object({
  title: trimmed(160).min(2, 'Please enter a project name.'),
  slug: trimmed(90)
    .regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers and dashes only.')
    .optional()
    .or(z.literal('')),
  description: optionalText(5000),
  scope_of_work: z.array(trimmed(200)).max(40).default([]),
  category_id: z.string().uuid('Please choose a category.').nullable().optional(),
  project_type: projectTypeSchema.default('Other'),
  location: optionalText(160),
  city: optionalText(80),
  state: optionalText(80),
  completion_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker.')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  featured: z.boolean().default(false),
  status: projectStatusSchema.default('draft'),
  cover_image_url: optionalText(1000),
  /** Raw text from the form; normalised to a JSON array by the save action. */
  media_links: optionalText(6000),
  display_order: z.coerce.number().int().min(0).max(100000).default(0),
})

export type ProjectInput = z.input<typeof projectSchema>
export type ProjectOutput = z.output<typeof projectSchema>

export const categorySchema = z.object({
  name: trimmed(80).min(2, 'Please enter a name.'),
  slug: trimmed(90).regex(/^[a-z0-9-]*$/).optional().or(z.literal('')),
  description: optionalText(1000),
  image_url: optionalText(1000),
  display_order: z.coerce.number().int().min(0).max(100000).default(0),
  is_active: z.boolean().default(true),
})

export const serviceSchema = z.object({
  name: trimmed(80).min(2, 'Please enter a name.'),
  slug: trimmed(90).regex(/^[a-z0-9-]*$/).optional().or(z.literal('')),
  description: optionalText(4000),
  details: z.array(trimmed(200)).max(40).default([]),
  image_url: optionalText(1000),
  icon: optionalText(60),
  display_order: z.coerce.number().int().min(0).max(100000).default(0),
  is_active: z.boolean().default(true),
})

export const testimonialSchema = z.object({
  customer_name: trimmed(120).min(2, 'Please enter the customer name.'),
  company_name: optionalText(120),
  content: trimmed(2000).min(10, 'Please enter the testimonial text.'),
  rating: z.coerce.number().int().min(1).max(5).nullable().optional(),
  image_url: optionalText(1000),
  is_published: z.boolean().default(false),
  display_order: z.coerce.number().int().min(0).max(100000).default(0),
})

/** Public contact form. Phone is required because that is how this business
 *  actually gets back to people; email is optional. */
export const enquirySchema = z.object({
  name: trimmed(120).min(2, 'Please enter your name.'),
  phone: trimmed(24).regex(
    /^[+]?[\d][\d\s\-()]{6,22}$/,
    'Please enter a valid phone number.',
  ),
  email: z
    .string()
    .trim()
    .max(160)
    .email('Please enter a valid email address.')
    .optional()
    .or(z.literal('').transform(() => null)),
  company: optionalText(120),
  project_type: optionalText(40),
  message: optionalText(3000),
  /** Honeypot: bots fill hidden fields, humans do not. Must stay empty. */
  website: z.string().max(0).optional().or(z.literal('')),
})

export type EnquiryInput = z.input<typeof enquirySchema>

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export const settingsSchema = z.object({
  phone: optionalText(40),
  whatsapp: optionalText(40),
  email: optionalText(160),
  address: optionalText(400),
  service_areas: optionalText(600),
  maps_url: optionalText(600),
  instagram: optionalText(300),
  facebook: optionalText(300),
  linkedin: optionalText(300),
})
