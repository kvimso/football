import Link from 'next/link'

export function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer-top">
          <div>
            <div className="landing-footer-logo">Binocly</div>
            <p className="landing-footer-tag">
              The scouting platform built for Georgian football. Verified data, direct contact, real
              talent — connecting the world&apos;s clubs with Georgia&apos;s next generation.
            </p>
          </div>
          <nav className="landing-footer-col" aria-label="Platform links">
            <h4>Platform</h4>
            <Link href="/players">Players</Link>
            <Link href="/leagues">Leagues</Link>
            <Link href="/matches">Matches</Link>
            <Link href="/clubs">Clubs</Link>
          </nav>
          <nav className="landing-footer-col" aria-label="Company links">
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/press">Press</Link>
          </nav>
          <nav className="landing-footer-col" aria-label="Account links">
            <h4>Account</h4>
            <Link href="/login">Sign In</Link>
            <Link href="/register">Request Access</Link>
          </nav>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 Binocly · Tbilisi, Georgia</span>
          <span>
            <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
