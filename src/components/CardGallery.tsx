import { useState } from 'react';
import { Download, Printer, Megaphone, RefreshCw, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import type { Deck, AppPage, GeneratedCard } from '../types';
import { buildCardImageUrl } from '../lib/pollinations';
import { getCardsForDeckType } from '../lib/deckData';

interface CardGalleryProps {
  deck: Deck;
  onDeckUpdate: (deck: Deck) => void;
  onNavigate: (page: AppPage) => void;
}

export default function CardGallery({ deck, onDeckUpdate, onNavigate }: CardGalleryProps) {
  const [selectedCard, setSelectedCard] = useState<GeneratedCard | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const suits = deck.deck_type === 'playing'
    ? ['all', 'spades', 'hearts', 'diamonds', 'clubs', 'joker']
    : ['all', 'major', 'wands', 'cups', 'swords', 'pentacles'];

  const filtered = filter === 'all'
    ? deck.cards
    : deck.cards.filter(c => {
        if (deck.deck_type === 'tarot' && filter === 'major') {
          return ['the_fool','the_magician','high_priestess','the_empress','the_emperor','the_hierophant','the_lovers','the_chariot','strength','the_hermit','wheel_of_fortune','justice','the_hanged_man','death','temperance','the_devil','the_tower','the_star','the_moon','the_sun','judgement','the_world'].includes(c.card_key);
        }
        return c.card_suit === filter;
      });

  const handleRegenerateCard = (card: GeneratedCard) => {
    const cardDefs = getCardsForDeckType(deck.deck_type);
    const def = cardDefs.find(d => d.key === card.card_key);
    if (!def) return;

    const newSeed = card.seed + Math.floor(Math.random() * 1000) + 100;
    const newUrl = buildCardImageUrl(def, deck.style_prompt, deck.deck_type, newSeed);

    const updatedCards = deck.cards.map(c =>
      c.card_key === card.card_key ? { ...c, front_image_url: newUrl, seed: newSeed } : c
    );

    const updatedDeck = { ...deck, cards: updatedCards };
    onDeckUpdate(updatedDeck);

    if (selectedCard?.card_key === card.card_key) {
      setSelectedCard({ ...card, front_image_url: newUrl, seed: newSeed });
    }
  };

  const selectedIdx = selectedCard ? filtered.findIndex(c => c.card_key === selectedCard.card_key) : -1;
  const prevCard = selectedIdx > 0 ? filtered[selectedIdx - 1] : null;
  const nextCard = selectedIdx < filtered.length - 1 ? filtered[selectedIdx + 1] : null;

  const suitLabel = (s: string) => {
    if (s === 'all') return `All (${deck.cards.length})`;
    if (s === 'major') return 'Major Arcana';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-stone-100 pt-24 pb-20">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-stone-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-100">{deck.name}</h1>
            <p className="text-stone-600 text-sm">{deck.deck_type === 'playing' ? '54 playing cards' : '78 tarot cards'} · {deck.cards.filter(c => c.status === 'done').length} generated</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('export')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg font-medium text-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Print PDF
            </button>
            <button
              onClick={() => onNavigate('leadmagnet')}
              className="flex items-center gap-2 px-4 py-2 border border-stone-700 hover:border-amber-700/50 text-stone-300 hover:text-amber-200 rounded-lg text-sm transition-all"
            >
              <Megaphone className="w-4 h-4" />
              Lead Magnet
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* Back + Box preview row */}
        <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-stone-900/30 border border-stone-800/50">
          <div className="flex-shrink-0">
            <p className="text-xs text-stone-600 uppercase tracking-wider mb-2">Card Back</p>
            {deck.back_image_url && (
              <div className="w-12 h-16 rounded-lg overflow-hidden border border-amber-800/30">
                <img
                  src={deck.back_image_url}
                  alt="Card back"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <p className="text-xs text-stone-600 uppercase tracking-wider mb-2">Box Art</p>
            {deck.box_image_url && (
              <div className="w-24 h-16 rounded-lg overflow-hidden border border-amber-800/30">
                <img
                  src={deck.box_image_url}
                  alt="Box art"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>
          <div className="flex-1 text-right">
            <p className="text-stone-600 text-xs leading-relaxed">
              Style prompt: <span className="text-stone-400 italic">"{deck.style_prompt.slice(0, 100)}{deck.style_prompt.length > 100 ? '...' : ''}"</span>
            </p>
          </div>
        </div>

        {/* Suit filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {suits.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === s
                  ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                  : 'bg-stone-900/30 text-stone-500 border border-stone-800 hover:border-stone-700 hover:text-stone-300'
              }`}
            >
              {suitLabel(s)}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {filtered.map(card => (
            <button
              key={card.card_key}
              onClick={() => setSelectedCard(card)}
              className="group relative aspect-[7/10] rounded-lg overflow-hidden border border-stone-800 hover:border-amber-600/60 bg-stone-900 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-amber-900/20"
            >
              {!imgErrors.has(card.card_key) ? (
                <img
                  src={card.front_image_url}
                  alt={card.card_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setImgErrors(prev => new Set([...prev, card.card_key]))}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-stone-900">
                  <div className="text-stone-600 text-center text-[8px] leading-tight">{card.card_name}</div>
                </div>
              )}
              <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                <span className="text-stone-200 text-[8px] leading-tight font-medium line-clamp-2">{card.card_name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Card detail modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedCard(null)}>
          <div className="relative bg-stone-900 rounded-2xl border border-stone-700 max-w-sm w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-stone-800 hover:bg-stone-700 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>

            {/* Card image */}
            <div className="relative bg-stone-950 flex items-center justify-center" style={{ minHeight: '320px' }}>
              <img
                src={selectedCard.front_image_url}
                alt={selectedCard.card_name}
                className="max-h-80 w-auto object-contain"
              />

              {/* Nav arrows */}
              {prevCard && (
                <button
                  onClick={() => setSelectedCard(prevCard)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-stone-900/80 hover:bg-stone-800 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-stone-400" />
                </button>
              )}
              {nextCard && (
                <button
                  onClick={() => setSelectedCard(nextCard)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-stone-900/80 hover:bg-stone-800 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
              )}
            </div>

            {/* Card info */}
            <div className="p-4">
              <h3 className="text-stone-100 font-bold text-lg mb-1">{selectedCard.card_name}</h3>
              <p className="text-stone-500 text-xs mb-4">
                {deck.deck_type === 'playing' ? `${selectedCard.card_suit} suit` : selectedCard.card_suit === undefined ? 'Major Arcana' : `${selectedCard.card_suit} · Minor Arcana`}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRegenerateCard(selectedCard)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <a
                  href={selectedCard.front_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 rounded-lg text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
