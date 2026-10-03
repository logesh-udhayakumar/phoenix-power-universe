import { ArrowDown, ArrowUp } from 'lucide-react'
import { moveEntity, type OrderableTable } from '@/app/admin/actions'
import { cn } from '@/lib/utils/cn'

/** Up / down controls that set the order items appear in on the website.
 *
 *  Plain forms posting to a server action rather than drag-and-drop: this is
 *  used on a phone as often as a desktop, where dragging a row is fiddly and
 *  easy to get wrong. Each press saves immediately and revalidates the public
 *  pages, so the change is live on the website straight away.
 */
export function OrderArrows({
  table,
  id,
  isFirst,
  isLast,
  className,
}: {
  table: OrderableTable
  id: string
  isFirst: boolean
  isLast: boolean
  className?: string
}) {
  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      <form action={moveEntity}>
        <input type="hidden" name="table" value={table} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="up" />
        <ArrowButton label="Move up" disabled={isFirst}>
          <ArrowUp className="size-4" />
        </ArrowButton>
      </form>
      <form action={moveEntity}>
        <input type="hidden" name="table" value={table} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="down" />
        <ArrowButton label="Move down" disabled={isLast}>
          <ArrowDown className="size-4" />
        </ArrowButton>
      </form>
    </div>
  )
}

function ArrowButton({
  label,
  disabled,
  children,
}: {
  label: string
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-[var(--radius-card)] border border-line-strong text-ink-700 transition-colors hover:bg-paper-sunken disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
