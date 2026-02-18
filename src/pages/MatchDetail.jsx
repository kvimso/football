import { useParams, Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { matches } from '../data/matches';
import { players } from '../data/players';

export default function MatchDetail() {
  const { slug } = useParams();
  const { t, lang } = useLang();
  const match = matches.find(m => m.slug === slug);

  if (!match) return (
    <div className="page-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', marginBottom: '1rem' }}>Match not found</p>
        <Link to="/matches" style={{ color: 'var(--color-emerald-accent)', textDecoration: 'none' }}>← Back to Matches</Link>
      </div>
    </div>
  );

  return (
    <div className="page-top">
      <div className="medium-container">
        <Link to="/matches" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
          ← {t.nav.matches}
        </Link>

        {/* Match Header */}
        <div className="card-xl animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.1), transparent, rgba(16,185,129,0.1))', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-emerald-accent)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'ka' ? match.competitionKa : match.competition}
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{match.date}</span>
          </div>

          <div style={{ padding: '2.5rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 500, margin: '0 auto' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-pitch-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {match.teamA.split(' ').pop().substring(0, 3).toUpperCase()}
                  </span>
                </div>
                <Link to={`/clubs/${match.clubA}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  {match.teamA}
                </Link>
              </div>

              <div style={{ padding: '0 1.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3rem' }}>{match.scoreA}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '1.5rem' }}>–</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3rem' }}>{match.scoreB}</span>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 4 }}>FT</p>
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-pitch-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {match.teamB.split(' ').pop().substring(0, 3).toUpperCase()}
                  </span>
                </div>
                <Link to={`/clubs/${match.clubB}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  {match.teamB}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Video */}
        <div className="card animate-fade-in-up stagger-1" style={{ marginBottom: '2rem' }}>
          <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}>{t.match.fullVideo}</h2>
          <div style={{ aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: 'var(--color-pitch-border)' }}>
            <iframe src={match.video} title="Full Match" style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
          </div>
        </div>

        {/* Report */}
        {match.report && (
          <div className="card animate-fade-in-up stagger-2">
            <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}>{t.match.matchReport}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>{match.report.summary}</p>

            <h3 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              {t.match.topPerformers}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {match.report.topPerformers.map((perf, i) => {
                const p = players.find(pl => pl.id === perf.playerId);
                return (
                  <Link
                    key={i}
                    to={p ? `/players/${p.slug}` : '#'}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(10,15,13,0.5)', borderRadius: 8, textDecoration: 'none', color: 'inherit' }}
                  >
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.125rem', color: 'var(--color-text-muted)', width: 24, textAlign: 'center' }}>{i + 1}</span>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-pitch-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)' }}>{perf.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem' }}>{perf.name}</p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-emerald-accent)' }}>{perf.rating}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
