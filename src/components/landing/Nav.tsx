import Link from 'next/link'

export function Nav() {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-logo">
          Binocly
        </Link>
        <div className="landing-nav-links">
          <Link href="/leagues">Leagues</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[11px] font-semibold uppercase tracking-widest text-foreground-faint transition-colors hover:text-foreground"
          >
            Login
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
          >
            Request Demo
          </Link>
        </div>
      </div>
    </nav>
  )
}
