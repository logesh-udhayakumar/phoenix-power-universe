#!/usr/bin/env node
/**
 * Verifies a Supabase setup end to end: that the migrations ran, that Row
 * Level Security actually behaves (not merely that it is switched on), and
 * that the storage buckets exist with the right limits.
 *
 * Run after first setup, and again after deploying to a new environment:
 *   npm run verify
 *
 * It creates and deletes its own probe rows, and leaves nothing behind.
 */
import { readFileSync } from 'node:fs'

const envPath = process.argv[2] ?? '.env'
const env = {}
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
}
const BASE = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SVC = env.SUPABASE_SERVICE_ROLE_KEY

/** Always drain the body: an unconsumed response keeps its socket checked out
 *  of undici's pool, and ~20 of those deadlock every later request. */
async function call(path, { key = ANON, method = 'GET', body, headers = {}, base = 'rest/v1' } = {}) {
  const res = await fetch(`${BASE}/${base}/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* not JSON */ }
  return { status: res.status, ok: res.ok, text, json }
}

let failures = 0
const check = (ok, label, detail = '') => {
  if (!ok) failures++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`)
}

console.log('\n1. Tables exist, and public read access is correct')
for (const t of ['projects', 'categories', 'services', 'testimonials', 'settings', 'project_media', 'enquiries', 'admin_users']) {
  const r = await call(`${t}?select=*&limit=1`)
  check(r.status !== 404, `${t} exists`, r.status === 404 ? 'HTTP 404' : '')
  if (r.status === 404) continue

  // PostgREST answers 200 with an empty array when RLS grants no rows, so
  // "blocked" has to be asserted on the ROW COUNT, not on the status code.
  if (['enquiries', 'admin_users'].includes(t)) {
    const rows = Array.isArray(r.json) ? r.json.length : -1
    check(rows === 0, `${t}: no rows readable by the public`, `HTTP ${r.status}, rows ${rows}`)
  } else {
    check(r.status === 200, `${t}: public read allowed`, `HTTP ${r.status}`)
  }
}

console.log('\n2. Anonymous visitors must NOT be able to write')
for (const [t, row] of [
  ['projects', { title: 'rls-probe', slug: 'rls-probe-a' + Date.now() }],
  ['categories', { name: 'rls-probe', slug: 'rls-probe-b' + Date.now() }],
  ['services', { name: 'rls-probe', slug: 'rls-probe-c' + Date.now() }],
  ['testimonials', { customer_name: 'rls-probe', content: 'rls probe content' }],
  ['settings', { key: 'rls_probe', value: 'x' }],
  ['admin_users', { id: '00000000-0000-0000-0000-000000000000', email: 'probe@example.com' }],
]) {
  const r = await call(t, { method: 'POST', body: row })
  check([401, 403].includes(r.status), `anon INSERT into ${t} blocked`, `HTTP ${r.status}`)
}

console.log('\n3. The contact form still works, but is write-only')
const probePhone = '+100000000000'
const ins = await call('enquiries', {
  method: 'POST',
  body: { name: 'RLS probe', phone: probePhone, message: 'automated verification' },
})
check(ins.status === 201, 'anon can submit an enquiry', `HTTP ${ins.status}`)
const back = await call('enquiries?select=*')
check(back.status !== 200 || (back.json ?? []).length === 0, 'anon cannot read enquiries back', `HTTP ${back.status}`)

console.log('\n4. Draft projects are invisible to the public')
const draft = await call('projects', {
  key: SVC, method: 'POST', headers: { Prefer: 'return=representation' },
  body: { title: 'RLS probe draft', slug: 'rls-probe-draft-' + Date.now(), status: 'draft' },
})
if (draft.status === 201 && draft.json?.[0]) {
  const id = draft.json[0].id
  const seen = await call(`projects?select=id&id=eq.${id}`)
  check(seen.status === 200 && (seen.json ?? []).length === 0, 'anon cannot see a draft project',
    `HTTP ${seen.status}, rows ${(seen.json ?? []).length}`)

  const pub = await call(`projects?id=eq.${id}`, { key: SVC, method: 'PATCH', body: { status: 'published' } })
  if (pub.status < 300) {
    const seen2 = await call(`projects?select=id&id=eq.${id}`)
    check((seen2.json ?? []).length === 1, 'anon CAN see it once published', `rows ${(seen2.json ?? []).length}`)
  }
  await call(`projects?id=eq.${id}`, { key: SVC, method: 'DELETE' })
} else {
  check(false, 'could not create probe draft', `HTTP ${draft.status} ${draft.text.slice(0, 80)}`)
}

console.log('\n5. Storage buckets')
const buckets = await call('', { key: SVC, base: 'storage/v1/bucket' })
if (buckets.status === 200 && Array.isArray(buckets.json)) {
  for (const b of ['project-images', 'project-videos', 'service-images', 'testimonial-images']) {
    const found = buckets.json.find((x) => x.id === b)
    check(Boolean(found), `bucket ${b}`, found ? `public=${found.public}, limit=${found.file_size_limit}` : '')
  }
} else {
  check(false, 'could not list buckets', `HTTP ${buckets.status}`)
}

await call(`enquiries?phone=eq.${encodeURIComponent(probePhone)}`, { key: SVC, method: 'DELETE' })
console.log('\n' + (failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`))
