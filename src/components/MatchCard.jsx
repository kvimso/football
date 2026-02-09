import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

export default function MatchCard({ match, index = 0 }) {
  const { lang, t } = useLang();

  return (
    <div className={`match-card opacity-0 animate-fade-in-up stagger-${Math.min(index % 6 + 1, 6)}`}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(90deg, rgba(30,43,36,0.5), transparent)', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--color-emerald-accent)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {lang === 'ka' ? match.competitionKa : match.competition}
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{match.date}</span>
      </div>

      {/* Score */}
      <div style={{ padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem' }}>{match.teamA}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem' }}>{match.scoreA}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>–</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem' }}>{match.scoreB}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem' }}>{match.teamB}</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 1.25rem 1rem' }}>
        <Link
          to={`/matches/${match.slug}`}
          style={{ display: 'block', textAlign: 'center', padding: '0.5rem', borderRadius: 8, background: 'rgba(30,43,36,0.5)', color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
        >
          {t.match.viewMatch} →
        </Link>
      </div>
    </div>
  );
}
