import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useShortlist } from '../hooks/useShortlist';
import { players } from '../data/players';
import PlayerCard from '../components/PlayerCard';

export default function Shortlist() {
  const { t, lang } = useLang();
  const { shortlist, clearShortlist } = useShortlist();
  const saved = players.filter(p => shortlist.includes(p.id));

  return (
    <div className="page-top">
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.875rem', marginBottom: '0.25rem' }}>
              {t.shortlist.title}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {saved.length} {lang === 'en' ? 'players saved' : 'მოთამაშე შენახულია'}
            </p>
          </div>
          {saved.length > 0 && (
            <button onClick={clearShortlist} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}>
              {lang === 'en' ? 'Clear All' : 'ყველას წაშლა'}
            </button>
          )}
        </div>

        {saved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <svg style={{ width: 64, height: 64, color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className={lang === 'ka' ? 'ka' : ''} style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', marginBottom: '1rem' }}>{t.shortlist.empty}</p>
            <Link to="/players" style={{ color: 'var(--color-emerald-accent)', fontSize: '0.875rem', textDecoration: 'none' }}>
              {t.hero.cta} →
            </Link>
          </div>
        ) : (
          <div className="grid-players">
            {saved.map((player, i) => (
              <PlayerCard key={player.id} player={player} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
