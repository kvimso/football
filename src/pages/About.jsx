import { useLang } from '../context/LanguageContext';

const FLAGS = [
  { code: 'GE', name: 'Georgia' }, { code: 'GB', name: 'UK' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' }, { code: 'PT', name: 'Portugal' }, { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
];

export default function About() {
  const { t, lang } = useLang();

  return (
    <div className="page-top">
      <div className="narrow-container">
        <h1 className={`animate-fade-in-up ${lang === 'ka' ? 'ka' : ''}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.875rem', marginBottom: '2.5rem' }}>
          {t.about.title}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
            <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-emerald-accent)' }}>
              {t.about.mission}
            </h2>
            <p className={lang === 'ka' ? 'ka' : ''} style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{t.about.missionText}</p>
          </div>

          <div className="animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
            <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-emerald-accent)' }}>
              {t.about.whatWeDo}
            </h2>
            <p className={lang === 'ka' ? 'ka' : ''} style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{t.about.whatWeDoText}</p>
          </div>

          <div className="animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
            <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-emerald-accent)' }}>
              {t.about.contact}
            </h2>
            <p className={lang === 'ka' ? 'ka' : ''} style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              {t.about.contactText}{' '}
              <a href="mailto:info@georgianfootballtalent.com" style={{ color: 'var(--color-emerald-accent)' }}>
                info@georgianfootballtalent.com
              </a>
            </p>
          </div>

          <div className="animate-fade-in-up stagger-4" style={{ paddingTop: '2rem', borderTop: '1px solid var(--color-pitch-border)', opacity: 0 }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              {lang === 'en' ? 'Trusted by scouts from' : 'სკაუტების ნდობა'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {FLAGS.map((flag) => (
                <img
                  key={flag.code}
                  src={`https://flagcdn.com/w40/${flag.code.toLowerCase()}.png`}
                  alt={flag.name}
                  title={flag.name}
                  style={{ width: 36, height: 25, borderRadius: 3, objectFit: 'cover', opacity: 0.5 }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
