#!/usr/bin/env node
/**
 * Seeds demo content for UI testing.
 *
 * Everything written here is flagged `is_demo = true`, and every project
 * title is prefixed with [DEMO], so demo content can never be mistaken for
 * the company's real work. Remove it all from Admin -> Settings -> Demo data,
 * or by running:  node scripts/seed.mjs --clean
 *
 * Usage:
 *   node scripts/seed.mjs          seed demo content
 *   node scripts/seed.mjs --clean  delete all demo content
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY: seeding writes rows that RLS would
 * otherwise refuse, because there is no signed-in admin in a CLI script.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

loadEnvFile('.env.local')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local',
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CATEGORIES = [
  { name: 'Electrical', slug: 'electrical', display_order: 1 },
  { name: 'Plumbing', slug: 'plumbing', display_order: 2 },
  { name: 'Maintenance', slug: 'maintenance', display_order: 3 },
  { name: 'Other', slug: 'other', display_order: 4 },
]

const SERVICES = [
  {
    name: 'Electrical Works',
    slug: 'electrical-works',
    description:
      'Complete electrical installation for residential, commercial and industrial sites, from first-fix wiring through to testing and commissioning.',
    details: [
      'Electrical Wiring',
      'Rewiring',
      'Lighting Installation',
      'Distribution Panels',
      'Power Distribution',
      'Industrial Electrical Works',
      'Electrical Maintenance',
      'Testing & Commissioning',
    ],
    display_order: 1,
  },
  {
    name: 'Plumbing Works',
    slug: 'plumbing-works',
    description:
      'Water supply, sanitary and drainage systems installed and maintained for new builds and existing buildings.',
    details: [
      'Water Pipeline Installation',
      'Sanitary Plumbing',
      'Drainage Systems',
      'Pump Installation',
      'Plumbing Maintenance',
    ],
    display_order: 2,
  },
  {
    name: 'Maintenance',
    slug: 'maintenance',
    description:
      'Planned and reactive maintenance contracts that keep electrical and plumbing systems running.',
    details: [
      'Electrical Maintenance',
      'Plumbing Maintenance',
      'Fault Finding',
      'Repair Works',
      'Preventive Maintenance',
    ],
    display_order: 3,
  },
]

const PROJECTS = [
  {
    title: '[DEMO] Commercial Office Fit-Out',
    slug: 'demo-commercial-office-fit-out',
    categorySlug: 'electrical',
    project_type: 'Commercial',
    location: 'Business Park',
    city: 'Chennai',
    state: 'Tamil Nadu',
    completion_date: '2026-03-15',
    featured: true,
    description:
      'Full electrical installation for a multi-floor commercial office, delivered alongside the main fit-out contractor.\n\nThis is demo content for testing the website layout.',
    scope_of_work: [
      'Electrical wiring',
      'Lighting installation',
      'Distribution panel',
      'Cable management',
      'Testing and commissioning',
    ],
  },
  {
    title: '[DEMO] Industrial Facility Maintenance',
    slug: 'demo-industrial-facility-maintenance',
    categorySlug: 'maintenance',
    project_type: 'Industrial',
    location: 'Manufacturing Unit',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    completion_date: '2026-01-20',
    featured: true,
    description:
      'Preventive maintenance programme covering electrical distribution and pump systems across a manufacturing site.\n\nThis is demo content for testing the website layout.',
    scope_of_work: [
      'Preventive maintenance schedule',
      'Fault finding',
      'Panel servicing',
      'Pump servicing',
    ],
  },
  {
    title: '[DEMO] Residential Plumbing Installation',
    slug: 'demo-residential-plumbing-installation',
    categorySlug: 'plumbing',
    project_type: 'Residential',
    location: 'Apartment Block',
    city: 'Chennai',
    state: 'Tamil Nadu',
    completion_date: '2025-11-05',
    featured: true,
    description:
      'Complete water supply and drainage installation for a residential apartment block.\n\nThis is demo content for testing the website layout.',
    scope_of_work: [
      'Water pipeline installation',
      'Sanitary plumbing',
      'Drainage system',
      'Pump installation',
    ],
  },
]

async function clean() {
  console.log('Removing demo content...')
  for (const table of ['projects', 'categories', 'services', 'testimonials']) {
    const { error } = await supabase.from(table).delete().eq('is_demo', true)
    if (error) console.error(`  ${table}: ${error.message}`)
    else console.log(`  ${table}: cleaned`)
  }
  console.log('Done. Storage files are not touched by this script.')
}

async function seed() {
  console.log('Seeding demo content...')

  const { data: categories, error: categoryError } = await supabase
    .from('categories')
    .upsert(
      CATEGORIES.map((c) => ({ ...c, is_active: true, is_demo: true })),
      { onConflict: 'slug' },
    )
    .select('id, slug')

  if (categoryError) {
    console.error(`Categories failed: ${categoryError.message}`)
    process.exit(1)
  }
  console.log(`  categories: ${categories.length}`)

  const { error: serviceError } = await supabase
    .from('services')
    .upsert(
      SERVICES.map((s) => ({ ...s, is_active: true, is_demo: true })),
      { onConflict: 'slug' },
    )
  if (serviceError) console.error(`  services failed: ${serviceError.message}`)
  else console.log(`  services: ${SERVICES.length}`)

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]))

  const rows = PROJECTS.map(({ categorySlug, ...project }) => ({
    ...project,
    category_id: categoryBySlug.get(categorySlug) ?? null,
    status: 'published',
    is_demo: true,
  }))

  const { error: projectError } = await supabase
    .from('projects')
    .upsert(rows, { onConflict: 'slug' })

  if (projectError) console.error(`  projects failed: ${projectError.message}`)
  else console.log(`  projects: ${rows.length}`)

  console.log('\nDone. Demo projects have no photos — add some from the admin panel,')
  console.log('or remove all demo content from Admin -> Settings -> Demo data.')
}

/** Minimal .env parser so the script needs no extra dependency. */
function loadEnvFile(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (!match) continue
      const value = match[2].replace(/^["']|["']$/g, '')
      if (value && !process.env[match[1]]) process.env[match[1]] = value
    }
  } catch {
    // No .env.local — rely on the real environment instead.
  }
}

await (process.argv.includes('--clean') ? clean() : seed())
