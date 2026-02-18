import { useLang } from '../context/LanguageContext';
import { matches } from '../data/matches';
import MatchCard from '../components/MatchCard';

export default function Matches() {
  const { t, lang } = useLang();

  return (
    <div className="page-top">
      <div className="page-container">
        <h1 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.875rem', marginBottom: '0.5rem' }}>
          {t.sections.allMatches}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {matches.length} {lang === 'en' ? 'matches available' : 'მატჩი ხელმისაწვდომია'}
        </p>
        <div className="grid-matches">
          {matches.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
