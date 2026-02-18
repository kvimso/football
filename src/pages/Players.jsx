import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { players, positions, ageCategories } from '../data/players';
import { clubs } from '../data/clubs';
import PlayerCard from '../components/PlayerCard';

export default function Players() {
  const { t, lang } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [position, setPosition] = useState(searchParams.get('position') || '');
  const [ageCategory, setAgeCategory] = useState(searchParams.get('age') || '');
  const [foot, setFoot] = useState(searchParams.get('foot') || '');
  const [club, setClub] = useState(searchParams.get('club') || '');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const params = {};
    if (search) params.q = search;
    if (position) params.position = position;
    if (ageCategory) params.age = ageCategory;
    if (foot) params.foot = foot;
    if (club) params.club = club;
    setSearchParams(params, { replace: true });
  }, [search, position, ageCategory, foot, club]);

  const handleSearch = (val) => {
    setSearch(val);
    if (val.length > 1) {
      setSuggestions(players.filter(p =>
        p.name.toLowerCase().includes(val.toLowerCase()) || p.nameKa.includes(val)
      ).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const filtered = useMemo(() => {
    return players.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.nameKa.includes(search)) return false;
      if (position && p.position !== position) return false;
      if (ageCategory && p.ageCategory !== ageCategory) return false;
      if (foot && p.preferredFoot !== foot) return false;
      if (club && p.club !== club) return false;
      return true;
    });
  }, [search, position, ageCategory, foot, club]);

  const resetFilters = () => { setSearch(''); setPosition(''); setAgeCategory(''); setFoot(''); setClub(''); setSuggestions([]); };
  const activeFilters = [search, position, ageCategory, foot, club].filter(Boolean).length;

  return (
    <div className="page-top">
      <div className="page-container">
        <div style={{ marginBottom: '2rem' }}>
          <h1 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.875rem', marginBottom: '0.5rem' }}>
            {t.sections.allPlayers}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {filtered.length} {lang === 'en' ? 'players found' : 'მოთამაშე ნაპოვნია'}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder={t.filters.search}
            className={`input-field ${lang === 'ka' ? 'ka' : ''}`}
            style={{ paddingLeft: '2.75rem', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.75rem', background: 'var(--color-pitch-card)' }}
          />
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--color-pitch-card)', border: '1px solid var(--color-pitch-border)', borderRadius: 12, overflow: 'hidden', zIndex: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              {suggestions.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSearch(lang === 'ka' ? p.nameKa : p.name); setSuggestions([]); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-pitch-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)' }}>{p.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className={lang === 'ka' ? 'ka' : ''} style={{ fontSize: '0.875rem', fontWeight: 500 }}>{lang === 'ka' ? p.nameKa : p.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.position} · {p.clubName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
          <select value={position} onChange={e => setPosition(e.target.value)} className="select-field">
            <option value="">{t.filters.position}</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={ageCategory} onChange={e => setAgeCategory(e.target.value)} className="select-field">
            <option value="">{t.filters.ageCategory}</option>
            {ageCategories.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={foot} onChange={e => setFoot(e.target.value)} className="select-field">
            <option value="">{t.filters.foot}</option>
            <option value="Left">{t.filters.left}</option>
            <option value="Right">{t.filters.right}</option>
            <option value="Both">{t.filters.both}</option>
          </select>
          <select value={club} onChange={e => setClub(e.target.value)} className="select-field">
            <option value="">{t.filters.club}</option>
            {clubs.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          {activeFilters > 0 && (
            <button onClick={resetFilters} style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--color-emerald-accent)', fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              {t.filters.reset} ({activeFilters})
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>{lang === 'en' ? 'No players match your filters.' : 'მოთამაშეები ვერ მოიძებნა.'}</p>
            <button onClick={resetFilters} style={{ marginTop: '0.75rem', color: 'var(--color-emerald-accent)', fontSize: '0.875rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>{t.filters.reset}</button>
          </div>
        ) : (
          <div className="grid-players">
            {filtered.map((player, i) => (
              <PlayerCard key={player.id} player={player} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
