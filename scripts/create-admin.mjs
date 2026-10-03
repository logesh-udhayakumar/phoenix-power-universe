#!/usr/bin/env node
/**
 * Creates the owner's admin login.
 *
 * Run once after setting up Supabase:
 *   node scripts/create-admin.mjs owner@example.com "a-strong-password"
 *
 * There is deliberately no self-service signup anywhere in the app: an admin
 * exists only because someone with the service-role key created one. To add
 * a second admin later, run this again with their email.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

loadEnvFile('.env.local')

const [email, password] = process.argv.slice(2)

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password>')
  process.exit(1)
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

let userId = data?.user?.id

if (error) {
  // Already registered is fine — we just need them in admin_users.
  if (!/already/i.test(error.message)) {
    console.error(`Could not create the user: ${error.message}`)
    process.exit(1)
  }
  const { data: list } = await supabase.auth.admin.listUsers()
  userId = list?.users.find((u) => u.email === email)?.id
  if (!userId) {
    console.error('That email already exists but could not be found. Check Supabase.')
    process.exit(1)
  }
  console.log('User already existed — granting admin access to it.')
}

const { error: grantError } = await supabase
  .from('admin_users')
  .upsert({ id: userId, email, role: 'owner' }, { onConflict: 'id' })

if (grantError) {
  console.error(`Could not grant admin access: ${grantError.message}`)
  process.exit(1)
}

console.log(`\nAdmin ready. Sign in at /admin/login as ${email}`)

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
