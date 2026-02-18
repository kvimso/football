import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { players } from '../data/players';
import PlayerCard from '../components/PlayerCard';

const FLAGS = [
  { code: 'GE', name: 'Georgia' }, { code: 'GB', name: 'UK' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' }, { code: 'PT', name: 'Portugal' }, { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' }, { code: 'CH', name: 'Switzerland' }, { code: 'US', name: 'USA' },
];

export default function Home() {
  const { t, lang } = useLang();
  const featured = players.filter(p => p.featured).slice(0, 6);
  const trending = players.filter(p => p.trending).sort((a, b) => b.views - a.views);
  const recentlyAdded = players.filter(p => p.recentlyAdded);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', top: '25%', left: '25%', width: 400, height: 400, background: 'rgba(16,185,129,0.05)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: 250, height: 250, background: 'rgba(16,185,129,0.03)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 1.5rem', maxWidth: '56rem', margin: '0 auto' }}>
          <div className="animate-fade-in" style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 9999, marginBottom: '1.5rem' }}>
            <span style={{ color: 'var(--color-emerald-accent)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Beta
            </span>
          </div>

          <h1 className={`animate-fade-in-up ${lang === 'ka' ? 'ka' : ''}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            {lang === 'ka' ? (
              <><span className="text-gradient">ქართული ფეხბურთის</span><br />ნიჭის სახლი</>
            ) : (
              <>The Home of<br /><span className="text-gradient">Georgian Football</span><br />Talent</>
            )}
          </h1>

          <p className={`animate-fade-in-up stagger-2 ${lang === 'ka' ? 'ka' : ''}`} style={{ color: 'var(--color-text-secondary)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', maxWidth: '36rem', margin: '0 auto 2rem' }}>
            {t.hero.subtitle}
          </p>

          <div className="animate-fade-in-up stagger-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/players" className="btn-primary">{t.hero.cta}</Link>
            <Link to="/matches" className="btn-outline">{t.nav.matches}</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '4rem 0', borderTop: '1px solid var(--color-pitch-border)', borderBottom: '1px solid var(--color-pitch-border)', background: 'rgba(17,25,22,0.5)' }}>
        <div className="page-container">
          <div className="grid-stats">
            {[
              { value: '300+', label: t.stats.players, icon: '⚽' },
              { value: '40', label: t.stats.academies, icon: '🏟️' },
              { value: '120', label: t.stats.matches, icon: '📹' },
              { value: '10+', label: t.stats.scoutCountries, icon: '🌍' },
            ].map((stat, i) => (
              <div key={i} className={`animate-fade-in-up stagger-${i + 1}`} style={{ textAlign: 'center', opacity: 0 }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8 }}>{stat.icon}</span>
                <p className="text-gradient" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: 4 }}>{stat.value}</p>
                <p className={lang === 'ka' ? 'ka' : ''} style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            {FLAGS.map((flag) => (
              <img
                key={flag.code}
                src={`https://flagcdn.com/w40/${flag.code.toLowerCase()}.png`}
                alt={flag.name}
                title={flag.name}
                style={{ width: 28, height: 20, borderRadius: 2, objectFit: 'cover', opacity: 0.5 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section style={{ padding: '4rem 0' }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem' }}>{t.sections.featured}</h2>
            <Link to="/players" style={{ color: 'var(--color-emerald-accent)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}>
              {lang === 'en' ? 'View All →' : 'ყველას ნახვა →'}
            </Link>
          </div>
          <div className="grid-featured">
            {featured.map((player, i) => (
              <PlayerCard key={player.id} player={player} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <section style={{ padding: '4rem 0', background: 'rgba(17,25,22,0.3)' }}>
          <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-emerald-accent)', animation: 'fadeIn 1s ease infinite alternate' }} />
              <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem' }}>{t.sections.recentlyAdded}</h2>
            </div>
            <div className="grid-players">
              {recentlyAdded.map((player, i) => (
                <PlayerCard key={player.id} player={player} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending */}
      <section style={{ padding: '4rem 0' }}>
        <div className="page-container">
          <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '2rem' }}>{t.sections.trending}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trending.map((player, i) => (
              <Link
                key={player.id}
                to={`/players/${player.slug}`}
                className={`animate-slide-in stagger-${Math.min(i + 1, 6)}`}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-pitch-card)', border: '1px solid var(--color-pitch-border)', borderRadius: 12, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s', opacity: 0 }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--color-text-muted)', width: 32, textAlign: 'center' }}>{i + 1}</span>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-pitch-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem' }}>
                    {lang === 'ka' ? player.nameKa : player.name}
                  </p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{player.position} · {player.clubName}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--color-emerald-accent)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{player.rating}</span>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>{player.views.toLocaleString()} views</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
