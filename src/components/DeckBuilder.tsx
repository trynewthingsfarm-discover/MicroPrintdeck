import { useState, useCallback, useRef } from 'react';
import { Sparkles, Upload, X, ChevronRight, Layers, Star, Wand2, AlertCircle } from 'lucide-react';
import type { Deck, DeckType, AppPage } from '../types';
import { getCardsForDeckType } from '../lib/deckData';
import { buildCardImageUrl, buildBackImageUrl, buildBoxImageUrl, buildLeadMagnetImageUrl, preloadImage } from '../lib/realdeck';
import { supabase } from '../lib/supabase';

interface DeckBuilderProps {
  onDeckCreated: (deck: Deck) => void;
  onNavigate: (page: AppPage) => void;
}

const STYLE_EXAMPLES = [
  'Art Nouveau, Alphonse Mucha, flowing botanical vines, gold leaf, earthy jewel tones',
  'Japanese woodblock print ukiyo-e style, indigo and ochre, bold lines, wave patterns',
  'Dark gothic cathedral, stained glass palette, medieval manuscript illumination',
  'Photorealistic botanical illustration, pressed flowers, victorian scientific journal',
  'Risograph print aesthetic, limited 2-color palette, textured ink, lo-fi charm',
  'Bauhaus geometric abstraction, primary colors, bold shapes, modernist design',
  'Watercolor cosmic nebula, deep space, stardust, ethereal glowing colors',
  'Film noir photography, high contrast black and white, dramatic shadows, smoky',
  'Psychedelic 1960s poster art, vibrant swirling colors, electric typography',
  'Minimalist Zen ink wash painting, sumi-e brushwork, negative space, serene',
];

export default function DeckBuilder({ onDeckCreated, onNavigate }: DeckBuilderProps) {
  const [deckType, setDeckType] = useState<DeckType | null>(null);
  const [deckName, setDeckName] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewCards, setPreviewCards] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const handleImageDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setStyleImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setStyleImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const generateDeck = async () => {
    if (!deckType || !stylePrompt.trim()) return;
    cancelRef.current = false;
    setIsGenerating(true);
    setError(null);
    setPreviewCards([]);

    const cards = getCardsForDeckType(deckType);
    const seed = Math.floor(Math.random() * 90000) + 10000;
    const name = deckName.trim() || `${deckType === 'playing' ? 'Playing' : 'Tarot'} Deck — ${new Date().toLocaleDateString()}`;
    const enhancedStyle = styleImage
      ? `${stylePrompt.trim()}, reference visual style from provided image`
      : stylePrompt.trim();

    setProgressLabel('Preparing deck...');
    setProgress(3);

    // Create deck with AI art URLs
    const deck: Deck = {
      name,
      deck_type: deckType,
      style_prompt: enhancedStyle,
      style_image_url: styleImage || undefined,
      status: 'generating',
      seed,
      total_cards: cards.length,
      generated_count: 0,
      cards: cards.map((card, idx) => ({
        card_index: idx,
        card_key: card.key,
        card_name: card.name,
        card_suit: card.suit,
        front_image_url: buildCardImageUrl(card, enhancedStyle, deckType, seed + idx),
        seed: seed + idx,
        status: 'pending' as const,
      })),
    };

    deck.back_image_url = buildBackImageUrl(enhancedStyle, deckType, seed);
    deck.box_image_url = buildBoxImageUrl(enhancedStyle, deckType, seed);
    deck.lead_magnet_image_url = buildLeadMagnetImageUrl(enhancedStyle, deckType, seed);

    // Save to Supabase
    let deckId: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: savedDeck, error: deckErr } = await supabase
          .from('decks')
          .insert({
            user_id: user.id,
            name: deck.name,
            deck_type: deck.deck_type,
            style_prompt: deck.style_prompt,
            style_image_url: deck.style_image_url || null,
            back_image_url: deck.back_image_url,
            box_image_url: deck.box_image_url,
            status: 'generating',
            seed: deck.seed,
            total_cards: deck.total_cards,
            generated_count: 0,
          })
          .select()
          .single();

        if (!deckErr && savedDeck) {
          deckId = savedDeck.id;
          deck.id = deckId;

          // Insert cards in batches
          const BATCH_SIZE = 20;
          for (let i = 0; i < deck.cards.length; i += BATCH_SIZE) {
            const batch = deck.cards.slice(i, i + BATCH_SIZE).map(c => ({
              deck_id: deckId,
              card_index: c.card_index,
              card_key: c.card_key,
              card_name: c.card_name,
              card_suit: c.card_suit || null,
              front_image_url: c.front_image_url,
              seed: c.seed,
            }));
            await supabase.from('deck_cards').insert(batch);
          }
        }
      }
    } catch (err) {
      console.error('Supabase error:', err);
    }

    // Generate images
    const total = cards.length + 3;
    let loaded = 0;

    // Card back
    setProgressLabel('Generating card back...');
    await preloadImage(deck.back_image_url!).catch(() => {});
    loaded++;
    setProgress(Math.floor((loaded / total) * 100));
    setPreviewCards([deck.back_image_url!]);

    // Box
    setProgressLabel('Generating box art...');
    await preloadImage(deck.box_image_url!).catch(() => {});
    loaded++;
    setProgress(Math.floor((loaded / total) * 100));

    // Lead magnet
    setProgressLabel('Generating showcase...');
    await preloadImage(deck.lead_magnet_image_url!).catch(() => {});
    loaded++;
    setProgress(Math.floor((loaded / total) * 100));

    // Cards in batches
    const BATCH = 4;
    for (let i = 0; i < deck.cards.length; i += BATCH) {
      if (cancelRef.current) break;

      const batch = deck.cards.slice(i, i + BATCH);
      const cardNum = Math.min(i + BATCH, deck.cards.length);
      setProgressLabel(`Generating cards ${i + 1}-${cardNum} of ${deck.cards.length}...`);

      await Promise.allSettled(batch.map(async (card) => {
        if (cancelRef.current) return;
        card.status = 'generating';
        await preloadImage(card.front_image_url!).catch(() => {});
        card.status = 'done';
        loaded++;
        setProgress(Math.floor((loaded / total) * 100));
      }));

      // Update preview
      const done = deck.cards.filter(c => c.status === 'done').slice(0, 6).map(c => c.front_image_url!);
      setPreviewCards(done);

      // Update DB
      if (deckId && loaded % 8 === 0) {
        supabase.from('decks').update({ generated_count: loaded - 3 }).eq('id', deckId).then(() => {});
      }

      if (!cancelRef.current) {
        await new Promise(r => setTimeout(r, 30));
      }
    }

    if (!cancelRef.current) {
      deck.status = 'complete';
      deck.cards.forEach(c => c.status = 'done');

      if (deckId) {
        await supabase.from('decks').update({ status: 'complete', generated_count: deck.cards.length }).eq('id', deckId);
      }

      setIsGenerating(false);
      onDeckCreated(deck);
      onNavigate('gallery');
    } else {
      setIsGenerating(false);
    }
  };

  const canGenerate = deckType && stylePrompt.trim().length > 5;

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-amber-900/30" />
              <div
                className="absolute inset-0 rounded-full border-2 border-amber-400 transition-all duration-300"
                style={{
                  clipPath: `polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%, 50% ${progress}%, ${progress}% ${progress}%)`,
                  transform: 'rotate(-90deg)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-amber-400">{progress}%</span>
              </div>
            </div>
            <p className="text-neutral-400 text-sm">{progressLabel || 'Generating...'}</p>
            {previewCards.length > 0 && (
              <div className="flex justify-center gap-2 mt-6 flex-wrap">
                {previewCards.slice(0, 4).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Card preview ${i + 1}`}
                    className="w-16 h-24 object-cover rounded border border-neutral-800"
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { cancelRef.current = true; }}
            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {!deckType ? (
          <div className="text-center">
            <h2 className="text-3xl font-light text-white mb-4 tracking-tight">Choose Your Deck</h2>
            <p className="text-neutral-400 mb-10">What will you create?</p>

            <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
              <button
                onClick={() => setDeckType('playing')}
                className="group relative p-8 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl border border-neutral-800 hover:border-amber-600/50 transition-all text-left"
              >
                <Layers className="w-8 h-8 text-amber-400 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">Playing Cards</h3>
                <p className="text-neutral-500 text-sm">54 cards — full deck with suits, pips, and courts</p>
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-hover:text-amber-400 transition-colors" />
              </button>

              <button
                onClick={() => setDeckType('tarot')}
                className="group relative p-8 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl border border-neutral-800 hover:border-amber-600/50 transition-all text-left"
              >
                <Star className="w-8 h-8 text-amber-400 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">Tarot Cards</h3>
                <p className="text-neutral-500 text-sm">78 cards — Major and Minor Arcana</p>
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-hover:text-amber-400 transition-colors" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => { setDeckType(null); setStylePrompt(''); setStyleImage(null); }}
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 text-sm mb-8 transition-colors"
            >
              <X className="w-4 h-4" />
              Change deck type
            </button>

            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl border border-neutral-800 p-8">
              <div className="flex items-center gap-3 mb-8">
                {deckType === 'playing' ? (
                  <Layers className="w-6 h-6 text-amber-400" />
                ) : (
                  <Star className="w-6 h-6 text-amber-400" />
                )}
                <h2 className="text-2xl font-light text-white tracking-tight">
                  Create Your {deckType === 'playing' ? 'Playing' : 'Tarot'} Deck
                </h2>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Deck Name (optional)</label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder={`My ${deckType === 'playing' ? 'Playing' : 'Tarot'} Deck`}
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Visual Style</label>
                  <textarea
                    value={stylePrompt}
                    onChange={(e) => setStylePrompt(e.target.value)}
                    placeholder="Describe the artistic style for your deck..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-600 transition-colors resize-none"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {STYLE_EXAMPLES.slice(0, 4).map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setStylePrompt(ex)}
                        className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 rounded-full transition-colors"
                      >
                        {ex.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Style Reference Image (optional)</label>
                  <div
                    onDrop={handleImageDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative border-2 border-dashed border-neutral-700 hover:border-amber-600/50 rounded-xl p-6 text-center cursor-pointer transition-colors group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                    {styleImage ? (
                      <div className="relative">
                        <img
                          src={styleImage}
                          alt="Style reference"
                          className="max-h-40 mx-auto rounded-lg"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); setStyleImage(null); }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-900 border border-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-neutral-500">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Drop an image or click to upload</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={generateDeck}
                  disabled={!canGenerate}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-neutral-700 disabled:to-neutral-700 text-black font-medium rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate Deck ({deckType === 'playing' ? 54 : 78} cards)
                </button>

                {!canGenerate && stylePrompt.trim().length > 0 && (
                  <p className="text-xs text-neutral-500 text-center">Style description needs at least 6 characters</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
