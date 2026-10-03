import { Mail, MessageCircle, Phone, Trash2 } from 'lucide-react'
import { adminGetEnquiries } from '@/lib/admin-queries'
import { deleteEnquiry, setEnquiryStatus } from '@/app/admin/actions'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/format'
import { whatsappHref, telHref } from '@/config/site'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Enquiries' }

const NEXT_STATUS = {
  new: { value: 'contacted', label: 'Mark as contacted' },
  contacted: { value: 'closed', label: 'Mark as closed' },
  closed: { value: 'new', label: 'Reopen' },
} as const

export default async function AdminEnquiriesPage() {
  const enquiries = await adminGetEnquiries()

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Enquiries</h1>
      <p className="mt-1 text-sm text-slate-muted">
        Messages sent through the contact form on your website.
      </p>

      {enquiries.length === 0 ? (
        <div className="mt-7 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-paper-raised px-6 py-16 text-center">
          <p className="text-sm text-slate-muted">No enquiries yet.</p>
        </div>
      ) : (
        <ul className="mt-7 flex flex-col gap-4">
          {enquiries.map((enquiry) => {
            const next = NEXT_STATUS[enquiry.status]
            const wa = whatsappHref(
              enquiry.phone,
              `Hi ${enquiry.name}, thanks for your enquiry to Phoenix Power Universe.`,
            )
            const tel = telHref(enquiry.phone)

            return (
              <li
                key={enquiry.id}
                className="rounded-[var(--radius-card)] border border-line bg-paper-raised p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{enquiry.name}</p>
                  <Badge
                    tone={
                      enquiry.status === 'new'
                        ? 'accent'
                        : enquiry.status === 'contacted'
                          ? 'success'
                          : 'muted'
                    }
                  >
                    {enquiry.status}
                  </Badge>
                  <span className="ml-auto text-xs text-slate-muted">
                    {formatDate(enquiry.created_at)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {tel ? (
                    <a
                      href={tel}
                      className="inline-flex items-center gap-1.5 text-ink-900 hover:text-amber-accent-hover"
                    >
                      <Phone className="size-3.5" aria-hidden="true" />
                      {enquiry.phone}
                    </a>
                  ) : null}
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-ink-900 hover:text-amber-accent-hover"
                    >
                      <MessageCircle className="size-3.5" aria-hidden="true" />
                      WhatsApp
                    </a>
                  ) : null}
                  {enquiry.email ? (
                    <a
                      href={`mailto:${enquiry.email}`}
                      className="inline-flex items-center gap-1.5 text-ink-900 hover:text-amber-accent-hover"
                    >
                      <Mail className="size-3.5" aria-hidden="true" />
                      {enquiry.email}
                    </a>
                  ) : null}
                </div>

                {enquiry.company || enquiry.project_type ? (
                  <p className="mt-2 text-xs text-slate-muted">
                    {[enquiry.company, enquiry.project_type].filter(Boolean).join(' · ')}
                  </p>
                ) : null}

                {enquiry.message ? (
                  <p className="mt-3 whitespace-pre-line rounded-[var(--radius-card)] bg-paper-sunken p-3 text-sm text-ink-800">
                    {enquiry.message}
                  </p>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <form action={setEnquiryStatus}>
                    <input type="hidden" name="id" value={enquiry.id} />
                    <input type="hidden" name="status" value={next.value} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center rounded-[var(--radius-card)] border border-line-strong px-3 text-xs font-semibold hover:bg-paper-sunken"
                    >
                      {next.label}
                    </button>
                  </form>
                  <form action={deleteEnquiry}>
                    <input type="hidden" name="id" value={enquiry.id} />
                    <button
                      type="submit"
                      aria-label={`Delete enquiry from ${enquiry.name}`}
                      className="inline-flex size-9 items-center justify-center rounded-[var(--radius-card)] text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
