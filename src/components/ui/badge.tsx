import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type Tone = 'neutral' | 'accent' | 'success' | 'muted'

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-950/90 text-paper',
  accent: 'bg-amber-soft text-amber-accent-hover',
  success: 'bg-success/10 text-success',
  muted: 'bg-paper-sunken text-slate-muted',
}

export function Badge({
  tone = 'muted',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
