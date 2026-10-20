import React from 'react';
import { SLOTH_MASCOT_IMAGE } from '../assets';
import { OllamaStatus, AISettings } from '../services/ai';
import { 
  Sparkles, 
  Cpu, 
  WifiOff, 
  CheckCircle2, 
  Compass, 
  Sliders
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  status: OllamaStatus | null;
  settings: AISettings;
  onOpenSettings: () => void;
  onStartTour: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  status,
  settings,
  onOpenSettings,
  onStartTour
}) => {
  const isConnected = status?.connected && !settings.forceOfflineSimulation;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'briefing', label: 'Morning Briefing' },
    { id: 'file-tidy', label: 'Smart File Tidy' },
    { id: 'tasks', label: 'To-Do Assistant' },
    { id: 'fridge', label: 'Fridge-to-List' },
    { id: 'relax', label: 'Relax Mode' },
    { id: 'privacy', label: 'Local Data & Tests' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6] border-b border-stone-200/80 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* Zone 1: Single text element wordmark with mascot */}
        <div 
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
        >
          <img 
            src={SLOTH_MASCOT_IMAGE} 
            alt="SlothMate mascot" 
            className="w-9 h-9 rounded-full object-cover border border-emerald-800/20 shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-stone-900 tracking-tight whitespace-nowrap">
              SlothMate AI
            </span>
          </div>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                  isActive 
                    ? 'border-emerald-700 text-emerald-900 font-semibold' 
                    : 'border-transparent hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Local Engine Status */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Status badge: Clean unboxed metadata with icon */}
          <div 
            onClick={onOpenSettings}
            title={settings.forceOfflineSimulation ? "Offline Simulation active" : isConnected ? `Connected to Ollama (${status?.version || 'active'})` : "Operating via Deterministic Local Engine"}
            className="hidden sm:flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer px-2.5 py-1 rounded-md border border-stone-200 bg-white/70 shadow-2xs transition-colors"
          >
            {settings.forceOfflineSimulation ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium text-amber-900">Offline Sim</span>
              </>
            ) : isConnected ? (
              <>
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium text-emerald-900">Ollama ({settings.selectedModel})</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Local Offline Engine</span>
              </>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            aria-label="Model and Hardware Settings"
            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Primary Action Button: Guided Tour */}
          <button
            onClick={onStartTour}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Demo Tour</span>
          </button>
        </div>

      </div>

      {/* Mobile nav strip */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-2 border-t border-stone-200/60 overflow-x-auto scrollbar-none bg-stone-50/50">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`text-xs px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-emerald-800 text-white font-medium'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
