import { useState } from 'react';
import { Printer, Layers, Package, ChevronRight, Check, AlertCircle, Info } from 'lucide-react';
import type { Deck, AppPage } from '../types';
import { generateFrontsPDF, generateBacksPDF, generateBoxPDF } from '../lib/pdfGenerator';

interface ExportPanelProps {
  deck: Deck;
  onNavigate: (page: AppPage) => void;
}

type ExportType = 'fronts' | 'backs' | 'box';

interface ExportState {
  loading: boolean;
  done: boolean;
  error: string | null;
  progress: number;
}

const INSTRUCTIONS = [
  { n: 1, text: 'Download all three PDFs (fronts, backs, box)' },
  { n: 2, text: 'Print fronts page(s) on one side of heavy cardstock (80–120lb)' },
  { n: 3, text: 'Flip pages and print backs on the reverse — backs PDF is mirrored for alignment' },
  { n: 4, text: 'Cut along the crop marks — a guillotine cutter gives cleanest edges' },
  { n: 5, text: 'Print the box PDF separately, cut the solid lines, score the dashed lines' },
  { n: 6, text: 'Fold the box net, glue the tabs, slide your cards in' },
];

export default function ExportPanel({ deck, onNavigate }: ExportPanelProps) {
  const [states, setStates] = useState<Record<ExportType, ExportState>>({
    fronts: { loading: false, done: false, error: null, progress: 0 },
    backs: { loading: false, done: false, error: null, progress: 0 },
    box: { loading: false, done: false, error: null, progress: 0 },
  });

  const updateState = (type: ExportType, update: Partial<ExportState>) => {
    setStates(prev => ({ ...prev, [type]: { ...prev[type], ...update } }));
  };

  const handleExport = async (type: ExportType) => {
    if (states[type].loading) return;
    updateState(type, { loading: true, done: false, error: null, progress: 0 });

    try {
      const total = deck.cards.filter(c => c.status === 'done').length;
      const onProgress = (n: number) => updateState(type, { progress: Math.floor((n / total) * 100) });

      if (type === 'fronts') await generateFrontsPDF(deck, onProgress);
      else if (type === 'backs') await generateBacksPDF(deck, onProgress);
      else await generateBoxPDF(deck);

      updateState(type, { loading: false, done: true, progress: 100 });
    } catch (err) {
      updateState(type, {
        loading: false,
        error: err instanceof Error ? err.message : 'Export failed. Check your browser allows downloads.',
        progress: 0,
      });
    }
  };

  const cardCount = deck.cards.filter(c => c.status === 'done').length;

  const exports: Array<{ type: ExportType; label: string; desc: string; icon: typeof Printer; note: string }> = [
    {
      type: 'fronts',
      label: 'Card Fronts PDF',
      desc: `${cardCount} cards laid out ${deck.deck_type === 'tarot' ? '(~4 pages)' : '(~4 pages)'} with cut marks. Print side 1.`,
      icon: Layers,
      note: 'Micro cards: 1.4" × 2.0" each · 4 columns',
    },
    {
      type: 'backs',
      label: 'Card Backs PDF',
      desc: 'Matching backs, mirrored for double-sided printing alignment. Print side 2.',
      icon: Printer,
      note: 'Mirror-aligned for accurate double-sided cutting',
    },
    {
      type: 'box',
      label: 'Box Template PDF',
      desc: 'Cut-and-fold box net with your deck art. Score dashed lines, fold, glue, done.',
      icon: Package,
      note: 'Box fits full micro deck stack · Approx 2.2" × 1.6" × 0.65"',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-stone-100 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <button onClick={() => onNavigate('gallery')} className="text-stone-600 hover:text-stone-400 text-sm mb-4 flex items-center gap-1 transition-colors">
            ← Back to Gallery
          </button>
          <h1 className="text-4xl font-bold text-stone-100 mb-3">Print Your Deck</h1>
          <p className="text-stone-500 text-lg">Download three PDFs — fronts, backs, and box — then print and cut.</p>
        </div>

        {/* Export cards */}
        <div className="space-y-4 mb-12">
          {exports.map(({ type, label, desc, icon: Icon, note }) => {
            const state = states[type];
            return (
              <div key={type} className="p-6 rounded-xl border border-stone-800 bg-stone-900/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${state.done ? 'bg-green-950/50 border border-green-700/40' : 'bg-amber-950/40 border border-amber-800/30'}`}>
                      {state.done
                        ? <Check className="w-5 h-5 text-green-400" />
                        : <Icon className="w-5 h-5 text-amber-500" />
                      }
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-100 mb-1">{label}</h3>
                      <p className="text-stone-500 text-sm mb-1">{desc}</p>
                      <p className="text-stone-700 text-xs">{note}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExport(type)}
                    disabled={state.loading}
                    className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      state.done
                        ? 'bg-green-900/40 border border-green-700/40 text-green-300 hover:bg-green-900/60'
                        : state.loading
                        ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                    }`}
                  >
                    {state.loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-stone-600 border-t-amber-400 rounded-full animate-spin" />
                        {state.progress}%
                      </>
                    ) : state.done ? (
                      <>
                        <Check className="w-4 h-4" />
                        Downloaded
                      </>
                    ) : (
                      <>
                        Download
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {state.loading && (
                  <div className="mt-4">
                    <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                    <p className="text-stone-600 text-xs mt-1">Loading card images... this may take a minute.</p>
                  </div>
                )}

                {state.error && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {state.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Print Instructions */}
        <div className="p-6 rounded-xl border border-stone-800 bg-stone-900/20">
          <div className="flex items-center gap-2 mb-5">
            <Info className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-stone-200">How to Print Your Deck</h3>
          </div>
          <div className="space-y-3">
            {INSTRUCTIONS.map(({ n, text }) => (
              <div key={n} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-950/50 border border-amber-800/40 flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-xs">{n}</div>
                <p className="text-stone-400 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-amber-950/20 border border-amber-900/30">
            <p className="text-amber-300 text-xs font-medium mb-1">Best results</p>
            <p className="text-stone-500 text-xs leading-relaxed">
              Use 80–110 lb cardstock. Set printer to "Actual size" (no scaling). Disable "Fit to page". A paper trimmer cuts straighter than scissors. Laminate for durability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
