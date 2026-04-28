'use client'

export default function ClubEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/5 px-6 py-10 text-center">
      <p className="font-serif text-lg text-foreground">Something went wrong</p>
      <p className="mt-2 text-sm text-foreground-secondary">
        We couldn&apos;t load your club editor.
        {error.digest && (
          <span className="ml-2 text-xs text-foreground-faint">Ref: {error.digest}</span>
        )}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-btn-primary-text transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  )
}
