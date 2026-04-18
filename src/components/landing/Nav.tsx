import Link from 'next/link'

export function Nav() {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-logo">
          Binocly
        </Link>
        <div className="landing-nav-links">
          <Link href="/players">Players</Link>
          <Link href="/leagues">Leagues</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <Link href="/register" className="landing-nav-cta">
          Get Started
        </Link>
      </div>
    </nav>
  )
}
