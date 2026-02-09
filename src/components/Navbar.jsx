import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useShortlist } from '../hooks/useShortlist';

export default function Navbar() {
  const { lang, t, toggleLang } = useLang();
  const { shortlist } = useShortlist();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', label: t.nav.home },
    { to: '/players', label: t.nav.players },
    { to: '/matches', label: t.nav.matches },
    { to: '/clubs', label: t.nav.clubs },
    { to: '/about', label: t.nav.about },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-emerald-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--color-pitch)', fontSize: 12 }}>
            GFT
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }} className="hidden-mobile">
            {lang === 'ka' ? 'ქართული ფეხბურთი' : 'Georgian Football'}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? 'active' : ''} ${lang === 'ka' ? 'ka' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/shortlist"
            style={{ position: 'relative', padding: 8, borderRadius: 8, textDecoration: 'none', color: 'var(--color-text-secondary)' }}
            title={t.shortlist.view}
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {shortlist.length > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, background: 'var(--color-emerald-accent)', color: 'var(--color-pitch)', fontSize: 10, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {shortlist.length}
              </span>
            )}
          </Link>

          <button
            onClick={toggleLang}
            style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--color-pitch-card)', border: '1px solid var(--color-pitch-border)', color: 'var(--color-text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            {lang === 'en' ? 'ქარ' : 'ENG'}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="show-mobile-only"
            style={{ padding: 8, borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div style={{ background: 'var(--color-pitch-light)', borderTop: '1px solid var(--color-pitch-border)', padding: '0.75rem 1rem' }} className="animate-fade-in">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`nav-link ${isActive(link.to) ? 'active' : ''} ${lang === 'ka' ? 'ka' : ''}`}
              style={{ display: 'block', marginBottom: 4 }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
