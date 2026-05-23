import { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronRight, Clock, Layers, Star } from 'lucide-react';
import type { Deck, AppPage } from '../types';
import { supabase } from '../lib/supabase';

interface MyDecksProps {
  onSelectDeck: (deck: Deck) => void;
  onNavigate: (page: AppPage) => void;
}

export default function MyDecks({ onSelectDeck, onNavigate }: MyDecksProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const decksWithCards: Deck[] = await Promise.all(
          data.map(async deck => {
            const { data: cards } = await supabase
              .from('deck_cards')
              .select('*')
              .eq('deck_id', deck.id);
            return {
              ...deck,
              cards: cards || [],
            };
          })
        );
        setDecks(decksWithCards);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deckId: string) => {
    if (!confirm('Delete this deck? This cannot be undone.')) return;
    setDeleting(deckId);
    await supabase.from('decks').delete().eq('id', deckId);
    setDecks(prev => prev.filter(d => d.id !== deckId));
    setDeleting(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-stone-100 pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-stone-100 mb-2">My Decks</h1>
            <p className="text-stone-500 text-lg">{decks.length} {decks.length === 1 ? 'deck' : 'decks'} created</p>
          </div>
          <button
            onClick={() => onNavigate('builder')}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            New Deck
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-amber-900/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
            <p className="text-stone-600 mt-4">Loading your decks...</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-20 p-8 rounded-xl border border-stone-800 bg-stone-900/30">
            <Star className="w-12 h-12 text-amber-600/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-stone-300 mb-2">No decks yet</h3>
            <p className="text-stone-500 mb-6 max-w-sm mx-auto">
              Create your first pocket deck. Choose your style, let the AI work its magic, and print it.
            </p>
            <button
              onClick={() => onNavigate('builder')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-semibold transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Your First Deck
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map(deck => (
              <button
                key={deck.id}
                onClick={() => {
                  onSelectDeck(deck);
                  onNavigate('gallery');
                }}
                className="group relative p-6 rounded-xl border border-stone-800 bg-stone-900/30 hover:border-amber-700/50 hover:bg-stone-800/40 transition-all text-left overflow-hidden"
              >
                {/* Background card preview */}
                {deck.back_image_url && (
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                    <img
                      src={deck.back_image_url}
                      alt=""
                      className="w-full h-full object-cover blur-sm"
                    />
                  </div>
                )}

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-stone-100 group-hover:text-amber-300 transition-colors text-sm line-clamp-2">
                        {deck.name}
                      </h3>
                      <p className="text-stone-600 text-xs mt-1 flex items-center gap-1">
                        {deck.deck_type === 'playing' ? (
                          <>
                            <Layers className="w-3 h-3" />
                            54 Playing Cards
                          </>
                        ) : (
                          <>
                            <Star className="w-3 h-3" />
                            78 Tarot Cards
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(deck.id!);
                      }}
                      disabled={deleting === deck.id}
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-950/0 hover:bg-red-950/50 text-red-600/0 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>

                  <p className="text-stone-600 text-xs mb-4 line-clamp-2 italic">
                    "{deck.style_prompt.slice(0, 80)}{deck.style_prompt.length > 80 ? '...' : ''}"
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-stone-600">
                      <Clock className="w-3 h-3" />
                      {formatDate(deck.created_at!)}
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 font-medium group-hover:translate-x-1 transition-transform">
                      Open
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
