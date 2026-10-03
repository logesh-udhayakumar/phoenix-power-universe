'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validation/schemas'

export interface LoginState {
  status: 'idle' | 'error'
  message?: string
}

/** Signing in is a cookie write, so it must happen in a Server Action or
 *  Route Handler — Server Components cannot set cookies in Next 16. */
export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email') ?? '',
    password: formData.get('password') ?? '',
  })

  if (!parsed.success) {
    return { status: 'error', message: 'Enter your email address and password.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  // One deliberately vague message for both a wrong password and an unknown
  // address, so this form cannot be used to discover which emails exist.
  if (error || !data.user) {
    return { status: 'error', message: 'Incorrect email address or password.' }
  }

  // Authenticated is not the same as authorized: a Supabase user who is not in
  // admin_users must not reach the dashboard.
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!admin) {
    await supabase.auth.signOut()
    return {
      status: 'error',
      message: 'This account does not have admin access.',
    }
  }

  redirect('/admin/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
