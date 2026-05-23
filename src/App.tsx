import { useEffect, useState } from 'react';
import { ensureAnonymousSession } from './lib/supabase';
import type { Deck, AppPage } from './types';
import Navigation from './components/Navigation';
import Landing from './components/Landing';
import DeckBuilder from './components/DeckBuilder';
import CardGallery from './components/CardGallery';
import ExportPanel from './components/ExportPanel';
import LeadMagnet from './components/LeadMagnet';
import MyDecks from './components/MyDecks';

export default function App() {
  const [page, setPage] = useState<AppPage>('landing');
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    ensureAnonymousSession().then(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-900/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleDeckCreated = (deck: Deck) => {
    setCurrentDeck(deck);
  };

  const handleDeckUpdate = (deck: Deck) => {
    setCurrentDeck(deck);
  };

  const handleSelectDeck = (deck: Deck) => {
    setCurrentDeck(deck);
  };

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <Landing onNavigate={setPage} />;
      case 'builder':
        return <DeckBuilder onDeckCreated={handleDeckCreated} onNavigate={setPage} />;
      case 'gallery':
        return currentDeck ? (
          <CardGallery deck={currentDeck} onDeckUpdate={handleDeckUpdate} onNavigate={setPage} />
        ) : (
          <Landing onNavigate={setPage} />
        );
      case 'export':
        return currentDeck ? (
          <ExportPanel deck={currentDeck} onNavigate={setPage} />
        ) : (
          <Landing onNavigate={setPage} />
        );
      case 'leadmagnet':
        return currentDeck ? (
          <LeadMagnet deck={currentDeck} onNavigate={setPage} />
        ) : (
          <Landing onNavigate={setPage} />
        );
      case 'mydecks':
        return <MyDecks onSelectDeck={handleSelectDeck} onNavigate={setPage} />;
      default:
        return <Landing onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {page !== 'landing' && <Navigation currentPage={page} onNavigate={setPage} />}
      {renderPage()}
    </div>
  );
}
