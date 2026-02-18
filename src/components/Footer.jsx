import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

const FLAGS = [
  { code: 'GE', name: 'Georgia' }, { code: 'GB', name: 'UK' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' }, { code: 'PT', name: 'Portugal' }, { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
];

export default function Footer() {
  const { t, lang } = useLang();

  return (
    <footer style={{ background: 'var(--color-pitch-light)', borderTop: '1px solid var(--color-pitch-border)', marginTop: '5rem' }}>
      <div className="page-container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="grid-footer">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-emerald-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--color-pitch)', fontSize: 12 }}>
                GFT
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Georgian Football Talent</span>
            </div>
            <p className={lang === 'ka' ? 'ka' : ''} style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'en' ? 'Quick Links' : 'ბმულები'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { to: '/players', label: t.nav.players },
                { to: '/matches', label: t.nav.matches },
                { to: '/clubs', label: t.nav.clubs },
                { to: '/about', label: t.nav.about },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'en' ? 'Scout Countries' : 'ქვეყნები'}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {FLAGS.map((flag) => (
                <img
                  key={flag.code}
                  src={`https://flagcdn.com/w40/${flag.code.toLowerCase()}.png`}
                  alt={flag.name}
                  title={flag.name}
                  style={{ width: 32, height: 22, borderRadius: 3, objectFit: 'cover', opacity: 0.7 }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ))}
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
              {lang === 'en' ? 'Scouts active from 10+ countries' : 'სკაუტები 10+ ქვეყნიდან'}
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-pitch-border)', marginTop: '2rem', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
            © {new Date().getFullYear()} Georgian Football Talent. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
