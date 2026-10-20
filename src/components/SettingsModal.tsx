import React from 'react';
import { X, Sliders, Cpu, WifiOff, HardDrive, ShieldCheck } from 'lucide-react';
import { AISettings, saveAISettings, OllamaStatus } from '../services/ai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  status: OllamaStatus | null;
  onSettingsChange: (newSettings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  status,
  onSettingsChange
}) => {
  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<AISettings>) => {
    const updated = saveAISettings(partial);
    onSettingsChange(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
          <Sliders className="w-5 h-5 text-emerald-800" />
          <h2 className="text-base font-bold text-stone-900">
            Model & Runtime Settings
          </h2>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          
          {/* Status readout */}
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-stone-800">Connection Status</div>
              <div className="text-[11px] text-stone-500">
                {settings.forceOfflineSimulation 
                  ? 'Offline Simulation Mode' 
                  : status?.connected 
                    ? `Connected to Ollama (${status.version || 'v0.1'})` 
                    : 'Operating via Local Deterministic Engine'}
              </div>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${
              settings.forceOfflineSimulation ? 'bg-amber-500' : status?.connected ? 'bg-emerald-600' : 'bg-stone-400'
            }`} />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Ollama Host URL</label>
            <input
              type="text"
              value={settings.ollamaHost}
              onChange={(e) => handleUpdate({ ollamaHost: e.target.value })}
              className="w-full font-mono text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
            <span className="text-[11px] text-stone-400 mt-1 block">Default: http://127.0.0.1:11434</span>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Open-Weight Model</label>
            <select
              value={settings.selectedModel}
              onChange={(e) => handleUpdate({ selectedModel: e.target.value })}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
            >
              <option value="qwen2.5:1.5b">qwen2.5:1.5b (Recommended Balanced, ~1.2GB RAM)</option>
              <option value="qwen2.5:0.5b">qwen2.5:0.5b (Ultra Low Resource, ~400MB RAM)</option>
              <option value="qwen2.5:7b">qwen2.5:7b (High Precision, ~4.8GB RAM)</option>
              <option value="qwen2.5-coder:1.5b">qwen2.5-coder:1.5b (Code & JSON parsing)</option>
              <option value="llama3.2:1b">llama3.2:1b (Meta Compact Open Weights)</option>
            </select>
          </div>

          {/* Offline Toggle */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <div>
              <div className="font-semibold text-stone-900">Force Simulated Offline Mode</div>
              <div className="text-[11px] text-stone-500">
                Disables Ollama pinging to test 100% offline fallback capabilities.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.forceOfflineSimulation}
              onChange={(e) => handleUpdate({ forceOfflineSimulation: e.target.checked })}
              className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
            />
          </div>

        </div>

        <div className="mt-6 pt-3 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
