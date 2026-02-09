import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useShortlist } from '../hooks/useShortlist';

const positionColor = {
  'Goalkeeper': { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  'Centre Back': { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  'Left Back': { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  'Right Back': { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  'Defensive Midfielder': { bg: 'rgba(6,182,212,0.15)', color: '#06b6d4' },
  'Central Midfielder': { bg: 'rgba(6,182,212,0.15)', color: '#06b6d4' },
  'Attacking Midfielder': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  'Left Winger': { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  'Right Winger': { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  'Striker': { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
};

export default function PlayerCard({ player, index = 0 }) {
  const { lang } = useLang();
  const { isInShortlist, addToShortlist, removeFromShortlist } = useShortlist();
  const inList = isInShortlist(player.id);
  const pc = positionColor[player.position] || { bg: 'rgba(100,100,100,0.15)', color: '#888' };

  return (
    <div className={`player-card opacity-0 animate-fade-in-up stagger-${Math.min(index % 6 + 1, 6)}`}>
      {/* Shortlist button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          inList ? removeFromShortlist(player.id) : addToShortlist(player.id);
        }}
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6, borderRadius: '50%', background: 'rgba(10,15,13,0.6)', border: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
      >
        <svg style={{ width: 16, height: 16, color: inList ? 'var(--color-emerald-accent)' : 'var(--color-text-muted)' }} viewBox="0 0 24 24" fill={inList ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <Link to={`/players/${player.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {/* Avatar area */}
        <div style={{ position: 'relative', height: 180, background: 'linear-gradient(135deg, var(--color-pitch-border), var(--color-pitch-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-pitch-card)', border: '2px solid var(--color-pitch-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              {player.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          {/* Rating */}
          <div style={{ position: 'absolute', bottom: 10, left: 10, padding: '2px 8px', background: 'rgba(16,185,129,0.9)', borderRadius: 6, color: 'var(--color-pitch)', fontSize: 12, fontWeight: 700 }}>
            {player.rating}
          </div>
          {/* Age cat */}
          <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '2px 8px', background: 'rgba(10,15,13,0.7)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500, backdropFilter: 'blur(4px)' }}>
            {player.ageCategory}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '1rem' }}>
          <h3 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>
            {lang === 'ka' ? player.nameKa : player.name}
          </h3>
          <div style={{ marginBottom: 10 }}>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: pc.bg, color: pc.color }}>
              {lang === 'ka' ? player.positionKa : player.position}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)' }}>
            <span>{player.clubName}</span>
            <span>Age {player.age}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
