'use server'

import { createClient } from '@/lib/supabase/server'
import { enquirySchema } from '@/lib/validation/schemas'

export interface EnquiryState {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
}

/** Server-side validation is the real validation: the client schema can be
 *  bypassed by posting directly to this action, so everything is re-parsed
 *  here before it reaches the database. RLS allows anon INSERT on enquiries
 *  and nothing else, so this action cannot be abused to read anyone's data. */
export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const parsed = enquirySchema.safeParse({
    name: formData.get('name') ?? '',
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    company: formData.get('company') ?? '',
    project_type: formData.get('project_type') ?? '',
    message: formData.get('message') ?? '',
    website: formData.get('website') ?? '',
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      fieldErrors[key] ??= issue.message
    }
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors,
    }
  }

  // Honeypot tripped: pretend it worked so the bot does not learn anything,
  // and write nothing.
  if (parsed.data.website) {
    return { status: 'success', message: 'Thank you — we will be in touch shortly.' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('enquiries').insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      company: parsed.data.company,
      project_type: parsed.data.project_type,
      message: parsed.data.message,
    })

    if (error) {
      return {
        status: 'error',
        message:
          'Sorry, we could not send that. Please try again, or call or WhatsApp us instead.',
      }
    }

    return {
      status: 'success',
      message: 'Thank you — your enquiry has been sent. We will be in touch shortly.',
    }
  } catch {
    return {
      status: 'error',
      message:
        'Sorry, something went wrong. Please try again, or call or WhatsApp us instead.',
    }
  }
}
