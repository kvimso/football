import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { clubs } from '../data/clubs';
import { players } from '../data/players';

export default function Clubs() {
  const { t, lang } = useLang();

  return (
    <div className="page-top">
      <div className="page-container">
        <h1 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.875rem', marginBottom: '2rem' }}>
          {t.sections.clubs}
        </h1>

        <div className="grid-clubs">
          {clubs.map((club, i) => {
            const playerCount = players.filter(p => p.club === club.slug).length;
            return (
              <Link
                key={club.id}
                to={`/clubs/${club.slug}`}
                className={`card animate-fade-in-up stagger-${i + 1}`}
                style={{ textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s', opacity: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.125rem', backgroundColor: club.colors[0] + '20', color: club.colors[0] }}>
                    {club.shortName.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      {lang === 'ka' ? club.nameKa : club.name}
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{club.city} · {t.club.founded} {club.founded}</p>
                  </div>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {lang === 'ka' ? club.descriptionKa : club.description}
                </p>
                <span style={{ color: 'var(--color-emerald-accent)', fontSize: '0.875rem', fontWeight: 500 }}>
                  {playerCount} {lang === 'en' ? 'players' : 'მოთამაშე'} →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
