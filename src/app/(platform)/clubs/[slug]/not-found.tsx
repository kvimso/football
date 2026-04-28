import Link from 'next/link'

export default function ClubNotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-faint">404</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        That club isn't here.
      </h1>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground-secondary">
        The academy you were looking for either changed its slug, hasn't been onboarded yet, or
        never existed. The directory has every club we know about.
      </p>
      <Link
        href="/clubs"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Browse all clubs
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}
