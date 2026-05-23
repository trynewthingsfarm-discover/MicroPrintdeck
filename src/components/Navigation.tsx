import { Layers, Library, Sparkles } from 'lucide-react';
import type { AppPage } from '../types';

interface NavigationProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const nav = [
    { page: 'builder' as AppPage, label: 'Create', icon: Sparkles },
    { page: 'mydecks' as AppPage, label: 'My Decks', icon: Library },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-amber-900/20">
      <button
        onClick={() => onNavigate('landing')}
        className="flex items-center gap-2 group"
      >
        <Layers className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
        <span className="text-amber-100 font-semibold tracking-wider text-sm uppercase">Pocket Deck Studio</span>
      </button>

      <nav className="flex items-center gap-1">
        {nav.map(({ page, label, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPage === page
                ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                : 'text-stone-400 hover:text-amber-200 hover:bg-stone-800/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
