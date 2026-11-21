import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/** Small inline spinner for buttons and pending states. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-4 shrink-0 animate-spin', className)} aria-hidden="true" />
}
