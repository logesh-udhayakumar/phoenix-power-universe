'use client'

import { useFormStatus } from 'react-dom'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils/cn'

/**
 * Submit button for forms that post to a server action.
 *
 * While the action runs it is disabled (no double submits) and shows a
 * spinner, so a press always gives instant feedback even when the server
 * takes a few seconds. Must be rendered inside the <form> it submits.
 *
 * - Text buttons: pass `pendingText` ("Saving…") to swap the label.
 * - Icon-only buttons: omit it; the icon is replaced by the spinner.
 */
export function SubmitButton({
  children,
  pendingText,
  className,
  disabled,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  pendingText?: React.ReactNode
}) {
  const { pending } = useFormStatus()

  return (
    <button
      {...rest}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(className, 'disabled:cursor-not-allowed', pending && 'cursor-wait opacity-70')}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}
