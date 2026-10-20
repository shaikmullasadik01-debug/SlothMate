import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  HardDrive, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Lock, 
  WifiOff, 
  Cpu, 
  Layers, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { db } from '../services/db';
import { getAISettings, saveAISettings, checkOllamaStatus, OllamaStatus } from '../services/ai';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

export const PrivacyDataView: React.FC = () => {
  const [settings, setSettings] = useState(getAISettings());
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<{
    totalTests: number;
    passedCount: number;
    failedCount: number;
    elapsedTotalMs: number;
    tests: TestResult[];
  } | null>(null);

  const [auditLogs, setAuditLogs] = useState(() => db.getAuditLogs());
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    checkOllamaStatus().then(setOllamaStatus);
  }, [settings]);

  const handleToggleOfflineSimulation = (val: boolean) => {
    const updated = saveAISettings({ forceOfflineSimulation: val });
    setSettings(updated);
    checkOllamaStatus().then(setOllamaStatus);
  };

  const handleUpdateModel = (modelName: string) => {
    const updated = saveAISettings({ selectedModel: modelName });
    setSettings(updated);
  };

  const handleUpdateHost = (host: string) => {
    const updated = saveAISettings({ ollamaHost: host });
    setSettings(updated);
  };

  const handleRunVerificationSuite = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/tests/run', { method: 'POST' });
      const data = await res.json();
      setTestResults(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleExportData = () => {
    const dataStr = db.exportData();
    setExportJson(dataStr);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slothmate-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = db.importData(content);
        if (success) {
          setImportStatus('Database restored successfully from backup.');
          setAuditLogs(db.getAuditLogs());
        } else {
          setImportStatus('Failed to parse backup JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleWipeDatabase = () => {
    if (window.confirm('Erase all local SlothMate records (tasks, briefings, history)? This cannot be undone.')) {
      db.clearAllData();
      setAuditLogs(db.getAuditLogs());
      alert('All local data wiped.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Local Data, Privacy & Test Suite</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Zero telemetry, local offline storage, open-weight runtime configuration, and verified safety assertions.
          </p>
        </div>

        <button
          onClick={handleRunVerificationSuite}
          disabled={isRunningTests}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
          <span>{isRunningTests ? 'Running Automated Tests...' : 'Run Automated Test Suite'}</span>
        </button>
      </div>

      {/* Zero Telemetry Privacy Invariant Banner */}
      <div className="p-4 bg-emerald-900 text-emerald-50 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-emerald-800/80 text-xs font-semibold text-emerald-300">
          <Lock className="w-4 h-4 text-emerald-300" />
          <span>Guaranteed Privacy Architecture</span>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="font-semibold text-white">Local-Only Loopback</div>
            <p className="text-emerald-200/90 mt-0.5 text-[11px] leading-relaxed">
              Inference requests stay strictly on <code>http://127.0.0.1:11434</code>. Prompts are never sent to remote LLM APIs.
            </p>
          </div>
          <div>
            <div className="font-semibold text-white">Zero Telemetry</div>
            <p className="text-emerald-200/90 mt-0.5 text-[11px] leading-relaxed">
              No tracking pixels, no telemetry pings, and no user activity logging to third-party ad networks.
            </p>
          </div>
          <div>
            <div className="font-semibold text-white">Self-Contained Storage</div>
            <p className="text-emerald-200/90 mt-0.5 text-[11px] leading-relaxed">
              All tasks, score ledgers, and briefings are stored in your browser's local sandbox storage.
            </p>
          </div>
        </div>
      </div>

      {/* Automated Test Suite Results */}
      {testResults && (
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-stone-900">
                Automated Verification Results ({testResults.passedCount}/{testResults.totalTests} Passed)
              </h2>
            </div>
            <span className="font-mono text-xs text-stone-500 tabular-nums">
              Completed in {testResults.elapsedTotalMs}ms
            </span>
          </div>

          <div className="mt-3.5 space-y-2">
            {testResults.tests.map((test, idx) => (
              <div 
                key={idx}
                className="p-3 bg-stone-50 rounded-lg border border-stone-100 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="font-semibold text-stone-900">{test.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200/70 text-stone-700">
                      {test.category}
                    </span>
                  </div>
                  <p className="text-stone-600 text-[11px] pl-6 leading-relaxed">
                    {test.details}
                  </p>
                </div>

                <span className="font-mono text-[11px] text-stone-400 tabular-nums shrink-0">
                  {test.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model & Runtime Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Runtime Settings Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Cpu className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-stone-900">Local Model Runtime</h2>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Ollama Host Address</label>
              <input
                type="text"
                value={settings.ollamaHost}
                onChange={(e) => handleUpdateHost(e.target.value)}
                className="w-full font-mono text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">Default: http://127.0.0.1:11434</span>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Active Open-Weight Model</label>
              <select
                value={settings.selectedModel}
                onChange={(e) => handleUpdateModel(e.target.value)}
                className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
              >
                <option value="qwen2.5:1.5b">qwen2.5:1.5b (Recommended default, ~1.2GB RAM)</option>
                <option value="qwen2.5:0.5b">qwen2.5:0.5b (Ultra lightweight, ~400MB RAM)</option>
                <option value="qwen2.5:7b">qwen2.5:7b (High precision, ~4.8GB RAM)</option>
                <option value="qwen2.5-coder:1.5b">qwen2.5-coder:1.5b (Code & schema specialist)</option>
                <option value="llama3.2:1b">llama3.2:1b (Meta compact open weights)</option>
                <option value="llama3.2-vision:11b">llama3.2-vision:11b (Multimodal vision)</option>
              </select>
            </div>

            {/* Offline Simulation Toggle */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-stone-900">Simulate Offline Disconnection</div>
                <div className="text-[11px] text-stone-500">
                  Force the app to run completely isolated without contacting Ollama or network.
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.forceOfflineSimulation}
                onChange={(e) => handleToggleOfflineSimulation(e.target.checked)}
                className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Hardware & Launch Command Guide */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Terminal className="w-4 h-4 text-stone-700" />
            <h2 className="text-sm font-bold text-stone-900">Setup Commands & Model Guide</h2>
          </div>

          <div className="mt-3 space-y-3 text-xs text-stone-700">
            <div>
              <span className="font-semibold text-stone-900">1. Install Ollama (macOS / Linux / Windows WSL)</span>
              <pre className="mt-1 p-2 bg-stone-900 text-stone-100 rounded text-[11px] font-mono overflow-x-auto">
curl -fsSL https://ollama.com/install.sh | sh
              </pre>
            </div>

            <div>
              <span className="font-semibold text-stone-900">2. Pull Recommended Qwen Model</span>
              <pre className="mt-1 p-2 bg-stone-900 text-stone-100 rounded text-[11px] font-mono overflow-x-auto">
ollama run qwen2.5:1.5b
              </pre>
            </div>

            <div className="p-2.5 bg-stone-50 rounded border border-stone-100 text-[11px] leading-relaxed text-stone-600">
              <strong>Hardware Footprint:</strong> <code>qwen2.5:1.5b</code> uses only 1.2GB of VRAM or system RAM, providing fast 25–40 tokens/sec on standard laptop CPUs without needing an expensive dedicated GPU.
            </div>
          </div>
        </div>

      </div>

      {/* Local Storage & Export Management */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-stone-900">Local Data Management & Backup</h2>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Backup</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              onClick={handleExportData}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleWipeDatabase}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe Local Data</span>
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="mt-3 p-2.5 bg-stone-50 rounded text-xs text-stone-700 border border-stone-200">
            {importStatus}
          </div>
        )}

        {/* Local Audit Log Preview */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-stone-800 mb-2">Local Audit Trail (Last 10 Actions)</h3>
          <div className="space-y-1.5 font-mono text-[11px]">
            {auditLogs.slice(0, 8).map((log, idx) => (
              <div key={idx} className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between text-stone-600">
                <span className="font-semibold text-stone-800">{log.action}:</span>
                <span className="truncate max-w-md">{log.details}</span>
                <span className="text-stone-400 tabular-nums">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
