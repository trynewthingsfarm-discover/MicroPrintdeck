import { useState, useEffect } from 'react';
import { Copy, Download, Share2, ChevronLeft, Loader } from 'lucide-react';
import type { Deck, AppPage } from '../types';
import { generateLeadMagnetCopy } from '../lib/pollinations';

interface LeadMagnetProps {
  deck: Deck;
  onNavigate: (page: AppPage) => void;
}

export default function LeadMagnet({ deck, onNavigate }: LeadMagnetProps) {
  const [copy, setCopy] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateLeadMagnetCopy(deck.name, deck.style_prompt, deck.deck_type)
      .then(setCopy)
      .finally(() => setLoading(false));
  }, [deck]);

  const handleCopy = () => {
    navigator.clipboard.writeText(copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = () => {
    if (!deck.lead_magnet_image_url) return;
    const a = document.createElement('a');
    a.href = deck.lead_magnet_image_url;
    a.download = `${deck.name.replace(/\s+/g, '_')}_lead_magnet.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-stone-100 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <button
          onClick={() => onNavigate('gallery')}
          className="text-stone-600 hover:text-stone-400 text-sm mb-6 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Gallery
        </button>

        <h1 className="text-4xl font-bold text-stone-100 mb-3">Lead Magnet</h1>
        <p className="text-stone-500 text-lg mb-10">
          Marketing image + copy ready to share. Download and use to promote your deck.
        </p>

        {/* Image preview */}
        <div className="mb-10">
          <p className="text-xs text-stone-600 uppercase tracking-wider font-medium mb-3">Marketing Image</p>
          <div className="relative aspect-video rounded-xl border border-stone-800 bg-stone-900 overflow-hidden">
            {deck.lead_magnet_image_url ? (
              <img
                src={deck.lead_magnet_image_url}
                alt="Lead magnet"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
            )}
          </div>
          {deck.lead_magnet_image_url && (
            <button
              onClick={downloadImage}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg font-medium text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download Image (1200×630)
            </button>
          )}
        </div>

        {/* Copy text */}
        <div className="mb-10">
          <p className="text-xs text-stone-600 uppercase tracking-wider font-medium mb-3">Marketing Copy</p>
          <div className="relative">
            <textarea
              readOnly
              value={copy}
              className="w-full px-4 py-4 rounded-xl bg-stone-900/60 border border-stone-800 text-stone-200 resize-none font-mono text-sm leading-relaxed min-h-[200px]"
            />
            <button
              onClick={handleCopy}
              className={`absolute top-3 right-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-green-900/50 text-green-300 border border-green-700/40'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-300'
              }`}
            >
              {copied ? (
                <>✓ Copied</>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Platforms */}
        <div className="p-6 rounded-xl border border-stone-800 bg-stone-900/30">
          <h3 className="font-semibold text-stone-100 mb-4 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            Where to use this
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              'Instagram feed post + Stories',
              'Twitter/X premium post',
              'Email newsletter',
              'Website homepage hero',
              'Facebook marketplace listing',
              'Pinterest pin (1000×1500)',
              'TikTok video thumbnail',
              'Discord server announcement',
            ].map(platform => (
              <div key={platform} className="flex items-center gap-2 text-stone-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                {platform}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
