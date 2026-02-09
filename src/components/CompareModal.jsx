import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { players } from '../data/players';
import RadarChart from './RadarChart';

export default function CompareModal({ player, onClose }) {
  const { t, lang } = useLang();
  const [compareId, setCompareId] = useState(null);
  const otherPlayers = players.filter(p => p.id !== player.id);
  const comparePlayer = compareId ? players.find(p => p.id === compareId) : null;

  const StatRow = ({ label, valA, valB }) => (
    <div className="flex items-center gap-3 py-2 border-b border-pitch-border/50">
      <span className="flex-1 text-right text-sm font-medium">{valA}</span>
      <span className="w-28 text-center text-xs text-text-muted">{label}</span>
      <span className="flex-1 text-left text-sm font-medium">{valB ?? '—'}</span>
    </div>
  );

  const SkillBar = ({ label, valA, valB }) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-text-muted mb-1">
        <span className="font-semibold text-text-primary">{valA}</span>
        <span>{label}</span>
        <span className={`font-semibold ${valB ? 'text-text-primary' : 'text-text-muted'}`}>{valB ?? '—'}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-pitch-border rounded-full overflow-hidden flex justify-end">
          <div className="bg-emerald-accent rounded-full transition-all" style={{ width: `${valA}%` }} />
        </div>
        <div className="flex-1 bg-pitch-border rounded-full overflow-hidden">
          <div className="bg-blue-400 rounded-full transition-all" style={{ width: `${valB || 0}%` }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-pitch-card border border-pitch-border rounded-2xl p-6 mb-10 animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="font-display font-bold text-lg mb-4">{t.compare.title}</h3>

        {/* Player selector */}
        <select
          value={compareId || ''}
          onChange={e => setCompareId(Number(e.target.value))}
          className="w-full bg-pitch border border-pitch-border rounded-lg px-3 py-2 text-sm text-text-primary mb-6 focus:outline-none focus:border-emerald-accent/50"
        >
          <option value="">{t.compare.select}</option>
          {otherPlayers.map(p => (
            <option key={p.id} value={p.id}>{lang === 'ka' ? p.nameKa : p.name} — {p.position}</option>
          ))}
        </select>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-accent/10 border border-emerald-accent/30 flex items-center justify-center mx-auto mb-2">
              <span className="font-display font-bold text-emerald-accent">{player.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <p className="font-display font-semibold text-sm">{lang === 'ka' ? player.nameKa : player.name}</p>
            <p className="text-xs text-text-muted">{player.position}</p>
          </div>
          <span className="text-text-muted font-display font-bold text-lg px-4">{t.compare.vs}</span>
          <div className="text-center flex-1">
            {comparePlayer ? (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-400/10 border border-blue-400/30 flex items-center justify-center mx-auto mb-2">
                  <span className="font-display font-bold text-blue-400">{comparePlayer.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <p className="font-display font-semibold text-sm">{lang === 'ka' ? comparePlayer.nameKa : comparePlayer.name}</p>
                <p className="text-xs text-text-muted">{comparePlayer.position}</p>
              </>
            ) : (
              <div className="w-16 h-16 rounded-full bg-pitch-border flex items-center justify-center mx-auto mb-2">
                <span className="text-text-muted text-xl">?</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats comparison */}
        <StatRow label="Age" valA={player.age} valB={comparePlayer?.age} />
        <StatRow label="Height" valA={`${player.height} cm`} valB={comparePlayer ? `${comparePlayer.height} cm` : null} />
        <StatRow label="Rating" valA={player.rating} valB={comparePlayer?.rating} />
        <StatRow label="Goals" valA={player.stats.goals} valB={comparePlayer?.stats.goals} />
        <StatRow label="Assists" valA={player.stats.assists} valB={comparePlayer?.stats.assists} />
        <StatRow label="Matches" valA={player.stats.matches} valB={comparePlayer?.stats.matches} />

        {/* Skills comparison */}
        <h4 className="font-display font-semibold text-sm mt-6 mb-4 text-text-secondary">Skills</h4>
        <SkillBar label="Pace" valA={player.skills.pace} valB={comparePlayer?.skills.pace} />
        <SkillBar label="Shooting" valA={player.skills.shooting} valB={comparePlayer?.skills.shooting} />
        <SkillBar label="Passing" valA={player.skills.passing} valB={comparePlayer?.skills.passing} />
        <SkillBar label="Dribbling" valA={player.skills.dribbling} valB={comparePlayer?.skills.dribbling} />
        <SkillBar label="Defending" valA={player.skills.defending} valB={comparePlayer?.skills.defending} />
        <SkillBar label="Physical" valA={player.skills.physical} valB={comparePlayer?.skills.physical} />
      </div>
    </div>
  );
}
