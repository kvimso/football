import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useShortlist } from '../hooks/useShortlist';
import { players } from '../data/players';
import RadarChart from '../components/RadarChart';
import ContactModal from '../components/ContactModal';
import CompareModal from '../components/CompareModal';

export default function PlayerProfile() {
  const { slug } = useParams();
  const { t, lang } = useLang();
  const { isInShortlist, addToShortlist, removeFromShortlist } = useShortlist();
  const [showContact, setShowContact] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const player = players.find(p => p.slug === slug);

  if (!player) return (
    <div className="page-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', marginBottom: '1rem' }}>Player not found</p>
        <Link to="/players" style={{ color: 'var(--color-emerald-accent)', textDecoration: 'none' }}>← Back to Players</Link>
      </div>
    </div>
  );

  const inList = isInShortlist(player.id);
  const report = player.scoutingReport;

  return (
    <div className="page-top">
      <div className="medium-container" style={{ maxWidth: '68rem' }}>
        <Link to="/players" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
          ← {t.nav.players}
        </Link>

        {/* Header */}
        <div className="animate-fade-in-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ width: 120, height: 120, borderRadius: 16, background: 'linear-gradient(135deg, var(--color-pitch-border), var(--color-pitch-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-pitch-border)', flexShrink: 0 }}>
            <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              {player.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h1 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', marginBottom: 6 }}>
                  {lang === 'ka' ? player.nameKa : player.name}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                  <span style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, color: 'var(--color-emerald-accent)', fontSize: '0.875rem', fontWeight: 500 }}>
                    {lang === 'ka' ? player.positionKa : player.position}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{player.clubName}</span>
                </div>
              </div>
              <div style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: 8 }}>
                <span style={{ color: 'var(--color-emerald-accent)', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem' }}>{player.rating}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <button onClick={() => setShowContact(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                {t.player.requestContact}
              </button>
              <button
                onClick={() => inList ? removeFromShortlist(player.id) : addToShortlist(player.id)}
                style={{ padding: '0.5rem 1rem', border: inList ? '1px solid rgba(16,185,129,0.5)' : '1px solid var(--color-pitch-border)', borderRadius: 8, fontSize: '0.8rem', fontWeight: 500, background: inList ? 'rgba(16,185,129,0.1)' : 'transparent', color: inList ? 'var(--color-emerald-accent)' : 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                ♥ {inList ? t.player.removeFromShortlist : t.player.addToShortlist}
              </button>
              <button
                onClick={() => setShowCompare(true)}
                style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-pitch-border)', borderRadius: 8, fontSize: '0.8rem', fontWeight: 500, background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                ⚖ {t.player.compare}
              </button>
            </div>
          </div>
        </div>

        <div className="grid-profile">
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Info */}
            <div className="card animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
              <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}>{t.player.info}</h2>
              <div className="grid-info">
                {[
                  { label: t.player.dob, value: player.dateOfBirth },
                  { label: t.player.height, value: `${player.height} cm` },
                  { label: t.player.weight, value: `${player.weight} kg` },
                  { label: t.player.foot, value: player.preferredFoot },
                ].map((item, i) => (
                  <div key={i}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="card animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
              <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}>{t.player.seasonStats}</h2>
              <div className="grid-stat-numbers">
                {[
                  { label: t.player.matches, value: player.stats.matches },
                  { label: t.player.goals, value: player.stats.goals },
                  { label: t.player.assists, value: player.stats.assists },
                  { label: t.player.minutes, value: player.stats.minutes.toLocaleString() },
                ].map((stat, i) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'rgba(10,15,13,0.5)', borderRadius: 8 }}>
                    <p className="text-gradient" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem' }}>{stat.value}</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 4 }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scouting Report */}
            {report && (
              <div className="card animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
                <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}>{t.player.scoutingReport}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{t.player.playingStyle}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{report.playingStyle}</p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{t.player.strengths}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{report.strengths}</p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{t.player.development}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{report.developmentAreas}</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--color-pitch-border)', gap: '0.5rem' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                      {t.player.scoutedBy} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{report.scoutName}</span> · {report.scoutDate}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t.player.overallRating}:</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-emerald-accent)' }}>{report.overallRating}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Videos */}
            <div className="card animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
              <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}>{t.player.videos}</h2>
              <div className="grid-videos">
                <div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t.player.highlight}</p>
                  <div style={{ aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: 'var(--color-pitch-border)' }}>
                    <iframe src={player.videos.highlight} title="Highlights" style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                  </div>
                </div>
                <div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t.player.fullMatch}</p>
                  <div style={{ aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: 'var(--color-pitch-border)' }}>
                    <iframe src={player.videos.fullMatch} title="Full Match" style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card animate-fade-in-up stagger-2" style={{ opacity: 0, textAlign: 'center' }}>
              <h2 className={lang === 'ka' ? 'ka' : ''} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}>{t.player.skills}</h2>
              <RadarChart skills={player.skills} />
            </div>

            <div className="card animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                {lang === 'en' ? 'Quick Facts' : 'სწრაფი ფაქტები'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{t.player.nationality}</span>
                  <span>{lang === 'ka' ? player.nationalityKa : player.nationality}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{lang === 'en' ? 'Age Category' : 'ასაკი'}</span>
                  <span>{player.ageCategory}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{lang === 'en' ? 'Club' : 'კლუბი'}</span>
                  <Link to={`/clubs/${player.club}`} style={{ color: 'var(--color-emerald-accent)', textDecoration: 'none' }}>{player.clubName}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showContact && <ContactModal playerName={player.name} onClose={() => setShowContact(false)} />}
      {showCompare && <CompareModal player={player} onClose={() => setShowCompare(false)} />}
    </div>
  );
}
