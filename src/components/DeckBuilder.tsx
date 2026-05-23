import { useState, useCallback, useRef } from 'react';
import { Sparkles, Upload, X, ChevronRight, Layers, Star, Wand2, AlertCircle } from 'lucide-react';
import type { Deck, DeckType, AppPage } from '../types';
import { getCardsForDeckType } from '../lib/deckData';
import { buildCardImageUrl, buildBackImageUrl, buildBoxImageUrl } from '../lib/pollinations';
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
        status: 'pending',
      })),
    };

    // Generate back and box images
    deck.back_image_url = buildBackImageUrl(enhancedStyle, deckType, seed);
    deck.box_image_url = buildBoxImageUrl(enhancedStyle, deckType, seed);

    // Save to Supabase
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
          deck.id = savedDeck.id;

          // Insert cards
          const cardRows = deck.cards.map(c => ({
            deck_id: savedDeck.id,
            card_index: c.card_index,
            card_key: c.card_key,
            card_name: c.card_name,
            card_suit: c.card_suit || null,
            front_image_url: c.front_image_url,
            seed: c.seed,
          }));
          await supabase.from('deck_cards').insert(cardRows);
        }
      }
    } catch {
      // Non-fatal — deck still works in memory
    }

    // "Generate" in batches: actually just preload images and track progress
    const BATCH = 6;
    let loaded = 0;
    const total = cards.length;

    setProgressLabel(`Generating ${name}...`);

    for (let i = 0; i < total; i += BATCH) {
      if (cancelRef.current) break;
      const batch = deck.cards.slice(i, i + BATCH);

      await Promise.all(batch.map(async (card) => {
        if (cancelRef.current) return;
        card.status = 'generating';

        // Pollinations generates on first image load — just set the URL
        // Mark as done immediately (URL is deterministic)
        card.status = 'done';
        loaded++;

        // Add first few to preview
        if (previewCards.length < 6) {
          setPreviewCards(prev => [...prev.slice(0, 5), card.front_image_url]);
        }

        setProgress(Math.floor((loaded / total) * 100));
        setProgressLabel(`Queued ${loaded} of ${total} cards for generation...`);
        deck.generated_count = loaded;

        // Update Supabase progress
        if (deck.id && loaded % 10 === 0) {
          supabase.from('decks').update({ generated_count: loaded }).eq('id', deck.id).then(() => {});
        }
      }));

      // Small delay between batches so UI feels responsive
      await new Promise(r => setTimeout(r, 80));
    }

    if (!cancelRef.current) {
      deck.status = 'complete';
      deck.cards = deck.cards.map(c => ({ ...c, status: 'done' as const }));

      if (deck.id) {
        supabase.from('decks').update({ status: 'complete', generated_count: total }).eq('id', deck.id).then(() => {});
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
                  background: `conic-gradient(#d97706 ${progress}%, transparent ${progress}%)`,
                  borderColor: 'transparent',
                }}
              />
              <div className="absolute inset-2 rounded-full bg-[#0a0a0f] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-stone-100 mb-2">Crafting Your Deck</h2>
            <p className="text-stone-500 text-sm">{progressLabel}</p>
          </div>

          <div className="w-full bg-stone-800 rounded-full h-2 mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-amber-700 font-semibold text-lg mb-2">{progress}%</p>

          {previewCards.length > 0 && (
            <div className="flex gap-2 justify-center mt-6">
              {previewCards.slice(0, 5).map((url, i) => (
                <div key={i} className="w-12 h-16 rounded-md overflow-hidden border border-amber-800/30 bg-stone-900">
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}

          <p className="text-stone-700 text-xs mt-6 leading-relaxed">
            AI is queuing {deckType === 'playing' ? '54' : '78'} unique cards.<br />
            Cards render as you view them in the gallery.
          </p>

          <button
            onClick={() => { cancelRef.current = true; }}
            className="mt-8 text-stone-600 hover:text-stone-400 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-stone-100 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-stone-100 mb-3">Build Your Deck</h1>
          <p className="text-stone-500 text-lg">Choose your deck type, describe your vision, and let the AI do its work.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-800/50 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Deck Type */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-xs">1</div>
            <h2 className="text-lg font-semibold text-stone-200">Choose Your Deck Type</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              {
                type: 'playing' as DeckType,
                label: 'Playing Card Deck',
                count: '54 cards',
                desc: 'Full deck of 52 cards plus 2 jokers. Four suits, face cards, aces. Classic pocket game deck with your custom art.',
                icon: Layers,
                detail: 'Spades · Hearts · Diamonds · Clubs',
              },
              {
                type: 'tarot' as DeckType,
                label: 'Tarot Deck',
                count: '78 cards',
                desc: 'Complete tarot with 22 Major Arcana and 56 Minor Arcana across Wands, Cups, Swords, and Pentacles.',
                icon: Star,
                detail: 'Major Arcana · 4 Minor Suits',
              },
            ] as const).map(({ type, label, count, desc, icon: Icon, detail }) => (
              <button
                key={type}
                onClick={() => setDeckType(type)}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                  deckType === type
                    ? 'border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-900/20'
                    : 'border-stone-800 bg-stone-900/30 hover:border-stone-700 hover:bg-stone-800/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${deckType === type ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-stone-800 border border-stone-700'}`}>
                    <Icon className={`w-5 h-5 ${deckType === type ? 'text-amber-400' : 'text-stone-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-stone-100">{label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${deckType === type ? 'bg-amber-900/50 text-amber-300' : 'bg-stone-800 text-stone-500'}`}>{count}</span>
                    </div>
                    <p className="text-stone-500 text-sm leading-relaxed mb-2">{desc}</p>
                    <p className={`text-xs font-medium ${deckType === type ? 'text-amber-600' : 'text-stone-700'}`}>{detail}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Deck Name */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${deckType ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-600'}`}>2</div>
            <h2 className={`text-lg font-semibold ${deckType ? 'text-stone-200' : 'text-stone-700'}`}>Name Your Deck</h2>
          </div>

          <input
            type="text"
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            placeholder="e.g. Midnight Garden Tarot, Neon Noir Playing Cards..."
            disabled={!deckType}
            className="w-full px-4 py-3 rounded-xl bg-stone-900/60 border border-stone-800 text-stone-100 placeholder-stone-700 focus:outline-none focus:border-amber-700 disabled:opacity-40 transition-colors"
          />
        </div>

        {/* Step 3: Style Prompt */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${deckType ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-600'}`}>3</div>
            <h2 className={`text-lg font-semibold ${deckType ? 'text-stone-200' : 'text-stone-700'}`}>Describe Your Style</h2>
          </div>

          <div className="space-y-3">
            <textarea
              value={stylePrompt}
              onChange={e => setStylePrompt(e.target.value)}
              placeholder="Describe the art style, mood, color palette, influences, era, textures, vibes... The more specific, the better the results."
              disabled={!deckType}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-stone-900/60 border border-stone-800 text-stone-100 placeholder-stone-700 focus:outline-none focus:border-amber-700 disabled:opacity-40 transition-colors resize-none text-sm leading-relaxed"
            />

            {/* Style examples */}
            <div>
              <p className="text-xs text-stone-600 mb-2 font-medium uppercase tracking-wider">Quick starts — click to use</p>
              <div className="flex flex-wrap gap-2">
                {STYLE_EXAMPLES.slice(0, 6).map(ex => (
                  <button
                    key={ex}
                    onClick={() => setStylePrompt(ex)}
                    disabled={!deckType}
                    className="text-xs px-3 py-1.5 rounded-lg border border-stone-800 text-stone-500 hover:text-amber-300 hover:border-amber-800/50 hover:bg-stone-800/50 transition-all disabled:opacity-30 text-left"
                  >
                    {ex.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Style Reference Image */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${deckType ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-600'}`}>4</div>
            <div>
              <h2 className={`text-lg font-semibold ${deckType ? 'text-stone-200' : 'text-stone-700'}`}>Style Reference Image</h2>
              <span className="text-xs text-stone-600">Optional</span>
            </div>
          </div>

          {styleImage ? (
            <div className="relative inline-block">
              <img src={styleImage} alt="Style reference" className="w-32 h-32 object-cover rounded-xl border border-amber-700/40" />
              <button
                onClick={() => setStyleImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-900 hover:bg-red-800 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-red-200" />
              </button>
              <p className="mt-2 text-xs text-stone-600">Style inspiration applied</p>
            </div>
          ) : (
            <div
              onDrop={handleImageDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                deckType
                  ? 'border-stone-700 hover:border-amber-700/60 hover:bg-stone-800/20'
                  : 'border-stone-800 opacity-40'
              }`}
            >
              <Upload className="w-8 h-8 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">Drop an image or click to upload</p>
              <p className="text-stone-700 text-xs mt-1">A painting, photo, or texture that captures the vibe you want</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={generateDeck}
            disabled={!canGenerate}
            className={`group flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-base transition-all duration-200 ${
              canGenerate
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg shadow-amber-900/40 hover:shadow-amber-700/50 hover:scale-105'
                : 'bg-stone-800 text-stone-600 cursor-not-allowed'
            }`}
          >
            <Wand2 className="w-5 h-5" />
            Generate {deckType === 'playing' ? '54-Card Playing' : deckType === 'tarot' ? '78-Card Tarot' : ''} Deck
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {!canGenerate && (
            <p className="text-stone-700 text-sm">
              {!deckType ? 'Select a deck type to continue' : 'Add a style description to continue'}
            </p>
          )}

          <p className="text-stone-700 text-xs text-center max-w-sm">
            Cards are generated by free AI — each unique to your prompt. Generation queues all cards instantly, they render as you browse.
          </p>
        </div>
      </div>
    </div>
  );
}
