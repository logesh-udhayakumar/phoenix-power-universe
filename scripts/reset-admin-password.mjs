#!/usr/bin/env node
/**
 * Resets an admin's password (the app has no self-service "forgot password").
 *
 *   npm run reset-password                -> lists admin emails
 *   npm run reset-password -- <email>     -> prompts for the new password (hidden)
 *
 * Uses the service-role key, so it only works for someone holding .env secrets.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import readline from 'node:readline'

loadEnvFile('.env.local')
loadEnvFile('.env')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local / .env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = process.argv[2]?.toLowerCase().trim()

const { data: admins, error: adminsErr } = await supabase
  .from('admin_users')
  .select('id, email, role')
  .order('email')

if (adminsErr) {
  console.error(`Could not read admin_users: ${adminsErr.message}`)
  process.exit(1)
}

if (!email) {
  console.log('Connected. Admin users:')
  for (const a of admins) console.log(`  - ${a.email} (${a.role})`)
  console.log('\nReset one with: npm run reset-password -- <email>')
  process.exit(0)
}

const admin = admins.find((a) => a.email?.toLowerCase() === email)
if (!admin) {
  console.error(`${email} is not in admin_users.`)
  process.exit(1)
}

const password = await askHidden(`New password for ${email}: `)
if (password.length < 8) {
  console.error('Password must be at least 8 characters.')
  process.exit(1)
}
const confirm = await askHidden('Repeat it: ')
if (confirm !== password) {
  console.error('Passwords did not match. Nothing changed.')
  process.exit(1)
}

const { error } = await supabase.auth.admin.updateUserById(admin.id, {
  password,
  email_confirm: true,
})
if (error) {
  console.error(`Could not update password: ${error.message}`)
  process.exit(1)
}
console.log(`\nPassword updated. Sign in at /admin/login as ${email}`)

function askHidden(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = (s) => {
      if (s.includes(prompt)) rl.output.write(prompt)
    }
    rl.question(prompt, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

function loadEnvFile(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
      if (!match) continue
      const value = match[2].replace(/^["']|["']$/g, '')
      if (value && !process.env[match[1]]) process.env[match[1]] = value
    }
  } catch {
    // File missing — fine.
  }
}
