import { useState } from 'react';
import { useLang } from '../context/LanguageContext';

export default function ContactModal({ playerName, onClose }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => { onClose(); }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-pitch-card border border-pitch-border rounded-2xl p-6 animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="font-display font-bold text-lg mb-1">{t.contact.title}</h3>
        <p className="text-text-muted text-sm mb-5">{playerName}</p>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-accent/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-display font-semibold text-emerald-accent">{t.contact.sent}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">{t.contact.name}</label>
              <input
                type="text"
                required
                className="w-full bg-pitch border border-pitch-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">{t.contact.email}</label>
              <input
                type="email"
                required
                className="w-full bg-pitch border border-pitch-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">{t.contact.organization}</label>
              <input
                type="text"
                className="w-full bg-pitch border border-pitch-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">{t.contact.message}</label>
              <textarea
                rows={3}
                className="w-full bg-pitch border border-pitch-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-accent/50 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-accent hover:bg-emerald-dark text-pitch font-display font-semibold rounded-lg transition-colors text-sm"
            >
              {t.contact.send}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
