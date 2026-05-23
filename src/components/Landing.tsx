import { Sparkles, Layers, Printer, Zap, Star, Package } from 'lucide-react';
import type { AppPage } from '../types';

interface LandingProps {
  onNavigate: (page: AppPage) => void;
}

const features = [
  { icon: Sparkles, title: 'AI-Powered Art', desc: 'Free AI generates unique, sophisticated card art tuned to your style prompt — from photorealistic to painterly, abstract to illustrative.' },
  { icon: Layers, title: 'Full Deck Builder', desc: 'Build complete playing card decks (54 cards) or full tarot decks (78 cards). Every card individually generated with coherent style.' },
  { icon: Printer, title: 'Print-Ready PDFs', desc: 'Export fronts, backs, and a fold-up box — all as precise PDFs with cut marks. Print, cut, fold, and hold your deck.' },
  { icon: Package, title: 'Pocket Micro Size', desc: 'Cards are miniature 1.4"×2" — fits in a pocket, purse, or wallet. Full artwork, fully functional, just tiny.' },
  { icon: Zap, title: 'Lead Magnet Ready', desc: 'One click generates marketing copy and a promo image. Turn your deck into a digital product instantly.' },
  { icon: Star, title: 'Completely Free', desc: 'No API keys, no subscriptions, no credits. The AI runs on free infrastructure. Yours forever.' },
];

const exampleDecks = [
  { name: 'Art Nouveau Tarot', style: 'Alphonse Mucha style, flowing botanical vines, gold leaf accents', type: 'tarot' },
  { name: 'Brutalist Streets', style: 'gritty urban photography, concrete textures, street art, noir', type: 'playing' },
  { name: 'Celestial Atlas', style: 'vintage astronomical charts, star maps, deep space watercolor', type: 'tarot' },
  { name: 'Ukiyo-e Playing Deck', style: 'traditional Japanese woodblock print, ukiyo-e, indigo and ochre', type: 'playing' },
];

export default function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-stone-100">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-stone-800/30 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-950/10 rounded-full blur-[80px]" />
        </div>

        {/* Floating card illustrations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-[0.07] border border-amber-400/30 rounded-lg bg-gradient-to-br from-amber-900/20 to-stone-900/20"
              style={{
                width: `${Math.random() * 40 + 50}px`,
                height: `${Math.random() * 60 + 70}px`,
                left: `${(i % 4) * 25 + Math.random() * 10}%`,
                top: `${Math.floor(i / 4) * 50 + Math.random() * 20}%`,
                transform: `rotate(${(Math.random() - 0.5) * 30}deg)`,
                animation: `float${i % 3} ${6 + i}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-700/40 bg-amber-950/30 text-amber-300 text-xs font-medium tracking-widest uppercase mb-8">
            <Sparkles className="w-3 h-3" />
            AI · Free · Print-Ready
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-stone-100">Craft Your</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              Pocket Deck
            </span>
          </h1>

          <p className="text-lg md:text-xl text-stone-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            Describe your vision. AI generates a complete, unique, print-ready miniature deck of playing cards or tarot — every card individually crafted, artist-quality, designed to look stunning at 1.4 inches.
          </p>

          <p className="text-sm text-amber-700 mb-12 font-medium tracking-wide">
            54 playing cards · 78 tarot cards · Printable fronts, backs &amp; box · Completely free
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('builder')}
              className="group relative px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-base transition-all duration-200 shadow-lg shadow-amber-900/40 hover:shadow-amber-700/50 hover:scale-105"
            >
              <span className="flex items-center gap-2 justify-center">
                <Sparkles className="w-5 h-5" />
                Start Creating Free
              </span>
            </button>
            <button
              onClick={() => onNavigate('mydecks')}
              className="px-8 py-4 border border-stone-700 hover:border-amber-700 text-stone-300 hover:text-amber-200 rounded-xl text-base transition-all duration-200 hover:bg-stone-800/50"
            >
              View My Decks
            </button>
          </div>
        </div>

        {/* Card preview strip */}
        <div className="relative mt-20 w-full max-w-3xl mx-auto overflow-hidden">
          <div className="flex gap-3 justify-center">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-16 h-24 rounded-lg border border-amber-700/30 bg-gradient-to-br from-stone-800/60 to-stone-900/60 backdrop-blur-sm overflow-hidden"
                style={{ transform: `rotate(${(i - 2) * 4}deg) translateY(${Math.abs(i - 2) * 4}px)` }}
              >
                <div className="w-full h-full bg-gradient-to-br from-amber-900/20 via-transparent to-stone-800/30 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-600/40" />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0a0f] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0a0f] to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-stone-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-100 mb-4">Everything you need</h2>
            <p className="text-stone-500 text-lg">From prompt to printed deck in your hands</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-stone-800 bg-stone-900/30 hover:border-amber-800/40 hover:bg-stone-800/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-amber-950/50 border border-amber-800/40 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-stone-100 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspiration examples */}
      <section className="py-24 px-6 bg-stone-900/20 border-t border-stone-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-100 mb-4">Style anything</h2>
            <p className="text-stone-500 text-lg">From sacred geometry to street photography, the AI adapts to you</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {exampleDecks.map(deck => (
              <button
                key={deck.name}
                onClick={() => onNavigate('builder')}
                className="p-5 rounded-xl border border-stone-800 bg-stone-900/40 hover:border-amber-700/50 hover:bg-stone-800/40 transition-all text-left group"
              >
                <div className="text-xs text-amber-600 uppercase tracking-widest font-medium mb-2">{deck.type}</div>
                <h4 className="font-semibold text-stone-200 group-hover:text-amber-300 transition-colors mb-2 text-sm">{deck.name}</h4>
                <p className="text-stone-600 text-xs leading-relaxed italic">"{deck.style}"</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-100 mb-6">Your deck is waiting</h2>
          <p className="text-stone-500 mb-10">No account. No payment. No API keys. Just your imagination and a prompt.</p>
          <button
            onClick={() => onNavigate('builder')}
            className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-base transition-all duration-200 shadow-lg shadow-amber-900/40 hover:scale-105"
          >
            Create Your Deck Now
          </button>
        </div>
      </section>

      <style>{`
        @keyframes float0 { 0%, 100% { transform: translateY(0px) rotate(-8deg); } 50% { transform: translateY(-12px) rotate(-8deg); } }
        @keyframes float1 { 0%, 100% { transform: translateY(0px) rotate(5deg); } 50% { transform: translateY(-8px) rotate(5deg); } }
        @keyframes float2 { 0%, 100% { transform: translateY(0px) rotate(-3deg); } 50% { transform: translateY(-15px) rotate(-3deg); } }
      `}</style>
    </div>
  );
}
