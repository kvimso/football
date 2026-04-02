'use client'

export default function AboutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
      <p className="mt-2 text-sm text-foreground-secondary">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
      >
        Try again
      </button>
    </div>
  )
}
