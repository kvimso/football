import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Clubs from './pages/Clubs';
import ClubPage from './pages/ClubPage';
import About from './pages/About';
import Shortlist from './pages/Shortlist';
import NotFound from './pages/NotFound';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-pitch text-text-primary">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/players" element={<Players />} />
              <Route path="/players/:slug" element={<PlayerProfile />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/matches/:slug" element={<MatchDetail />} />
              <Route path="/clubs" element={<Clubs />} />
              <Route path="/clubs/:slug" element={<ClubPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/shortlist" element={<Shortlist />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
