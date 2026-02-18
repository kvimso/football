import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLang();

  return (
    <div className="page-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }} className="animate-fade-in-up">
        <h1 className="text-gradient" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '6rem', marginBottom: '1rem' }}>{t.notFound.title}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem', marginBottom: '2rem' }}>{t.notFound.subtitle}</p>
        <Link to="/" className="btn-primary">{t.notFound.back}</Link>
      </div>
    </div>
  );
}
