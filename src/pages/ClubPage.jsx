import { useParams, Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { clubs } from '../data/clubs';
import { players } from '../data/players';
import { matches } from '../data/matches';
import PlayerCard from '../components/PlayerCard';
import MatchCard from '../components/MatchCard';

export default function ClubPage() {
  const { slug } = useParams();
  const { t, lang } = useLang();
  const club = clubs.find(c => c.slug === slug);

  if (!club) return (
    <div className="page-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', marginBottom: '1rem' }}>Club not found</p>
        <Link to="/clubs" style={{ color: 'var(--color-emerald-accent)', textDecoration: 'none' }}>← Back to Clubs</Link>
      </div>
    </div>
  );

  const clubPlayers = players.filter(p => p.club === slug);
  const clubMatches = matches.filter(m => m.clubA === slug || m.clubB === slug);

  return (
    <div className="page-top">
      <div className="page-container">
        <Link to="/clubs" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
          ← {t.sections.clubs}
        </Link>

        <div className="animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', backgroundColor: club.colors[0] + '20', color: club.colors[0] }}>
            {club.shortName.substring(0, 3).toUpperCase()}
          </div>
          <div>
            <h1 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.875rem' }}>
              {lang === 'ka' ? club.nameKa : club.name}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{club.city} · {t.club.founded} {club.founded}</p>
          </div>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: '48rem', marginBottom: '2.5rem' }}>
          {lang === 'ka' ? club.descriptionKa : club.description}
        </p>

        <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>
          {t.club.squad} ({clubPlayers.length})
        </h2>
        <div className="grid-players" style={{ marginBottom: '3rem' }}>
          {clubPlayers.map((player, i) => (
            <PlayerCard key={player.id} player={player} index={i} />
          ))}
        </div>

        {clubMatches.length > 0 && (
          <>
            <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>
              {t.club.matches}
            </h2>
            <div className="grid-matches">
              {clubMatches.map((match, i) => (
                <MatchCard key={match.id} match={match} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
