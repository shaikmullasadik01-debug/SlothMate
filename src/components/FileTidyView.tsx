import React, { useState, useEffect } from 'react';
import { 
  FolderTree, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  FileCheck, 
  Folder, 
  Check, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { db } from '../services/db';

interface ScannedFile {
  id: string;
  relativePath: string;
  name: string;
  extension: string;
  sizeBytes: number;
  hash: string;
  isConfusingName: boolean;
  confusionReason?: string;
  suggestedName?: string;
  suggestedFolder?: string;
}

interface DuplicateGroup {
  hash: string;
  duplicateFiles: string[];
}

interface FileTidyViewProps {
  onTidyComplete?: () => void;
}

export const FileTidyView: React.FC<FileTidyViewProps> = ({ onTidyComplete }) => {
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [appliedResults, setAppliedResults] = useState<{ appliedCount: number; details: any[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchScan = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/filesystem/scan');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setFiles(data.files || []);
      setDuplicateGroups(data.duplicateGroups || []);

      // Auto-select files that have suggestions by default
      const initialSelected = new Set<string>();
      (data.files || []).forEach((f: ScannedFile) => {
        if (f.suggestedName && f.suggestedName !== f.name) {
          initialSelected.add(f.id);
        }
      });
      setSelectedIds(initialSelected);
      setAppliedResults(null);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  const handleApplyApproved = async () => {
    const selectedFiles = files.filter(f => selectedIds.has(f.id));
    if (selectedFiles.length === 0) return;

    setIsApplying(true);
    setErrorMsg(null);
    const start = performance.now();

    try {
      const operations = selectedFiles.map(f => ({
        sourceRelativePath: f.relativePath,
        targetFolder: f.suggestedFolder || 'General',
        targetFileName: f.suggestedName || f.name,
        action: 'move' as const
      }));

      const res = await fetch('/api/filesystem/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply changes');

      setAppliedResults(data);

      // Record Sloth Score: benchmark ~45s per file manually vs execution time
      const actualSec = (performance.now() - start) / 1000;
      const manualMins = (operations.length * 45) / 60;
      db.recordTimeSaved(
        'File Tidy',
        `Reorganized and renamed ${data.appliedCount} files in sandbox`,
        manualMins,
        actualSec
      );

      onTidyComplete?.();
      // Re-scan sandbox to reflect new state
      await fetchScan();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetSandbox = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/filesystem/reset-demo', { method: 'POST' });
      await fetchScan();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Smart File Tidy</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Identify duplicate files by cryptographic hash, decode confusing filenames, and review proposed changes before any rename or move occurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSandbox}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg shadow-2xs transition-colors"
            title="Reset sandbox folder to initial messy test state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reset Demo Sandbox</span>
          </button>

          <button
            onClick={fetchScan}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/70 rounded-lg shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Scan Sandbox</span>
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/90 text-xs text-stone-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-stone-900">Deterministic Safety Invariants Enforced:</div>
          <p className="text-stone-600 leading-relaxed">
            1. Scans strictly within the user-approved sandbox folder (no root directory traversal).<br />
            2. <strong>Collision Prevention:</strong> Aborts any operation if the target filename already exists, completely preventing accidental overwriting.<br />
            3. <strong>Zero Automatic Deletion:</strong> Duplicates are surfaced for review; no file is ever deleted silently.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-900 border border-red-200 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Duplicate Candidates Section */}
      {duplicateGroups.length > 0 && (
        <div className="bg-amber-50/50 rounded-xl border border-amber-200/70 p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
            <Copy className="w-4 h-4 text-amber-800" />
            <h2 className="text-sm font-bold text-amber-950">
              Identical Content Duplicates Detected ({duplicateGroups.length} group{duplicateGroups.length > 1 ? 's' : ''})
            </h2>
          </div>
          <div className="mt-2.5 space-y-2">
            {duplicateGroups.map((grp, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded-lg border border-amber-200/70 text-xs">
                <div className="text-[11px] font-mono text-stone-400 mb-1">
                  MD5 Content Hash: <span className="text-stone-600 font-semibold">{grp.hash}</span>
                </div>
                <div className="text-stone-800 space-y-1">
                  {grp.duplicateFiles.map((fn, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span className="font-mono text-stone-900">{fn}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applied Outcome Feedback */}
      {appliedResults && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold">
              Successfully organized {appliedResults.appliedCount} file{appliedResults.appliedCount > 1 ? 's' : ''}!
            </span>
          </div>
          <span className="text-emerald-700 font-mono text-[11px]">Audit log saved locally</span>
        </div>
      )}

      {/* Proposed Changes Preview Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-stone-900"
            >
              {selectedIds.size === files.length && files.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-700" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
              <span>Select All ({selectedIds.size}/{files.length})</span>
            </button>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs text-stone-500 font-mono tabular-nums">
              slothmate_sandbox/Downloads_Unsorted
            </span>
          </div>

          <button
            onClick={handleApplyApproved}
            disabled={isApplying || selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] disabled:opacity-50 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            {isApplying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Applying Safely...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-3.5 h-3.5" />
                <span>Apply Approved Operations ({selectedIds.size})</span>
              </>
            )}
          </button>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/70 border-b border-stone-100 text-stone-500 font-medium">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">Approve</th>
                <th className="py-2.5 px-3">Current File</th>
                <th className="py-2.5 px-3 w-8 text-center"></th>
                <th className="py-2.5 px-3">Proposed Target</th>
                <th className="py-2.5 px-3">Category Folder</th>
                <th className="py-2.5 px-3 text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No files found in sandbox. Click "Reset Demo Sandbox" to initialize sample files.
                  </td>
                </tr>
              ) : (
                files.map((file) => {
                  const isSelected = selectedIds.has(file.id);
                  const willChange = file.suggestedName !== file.name || file.suggestedFolder;

                  return (
                    <tr 
                      key={file.id} 
                      className={`hover:bg-stone-50/60 transition-colors ${isSelected ? 'bg-emerald-50/20' : ''}`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(file.id)}
                          className="cursor-pointer text-stone-600 hover:text-stone-900"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-300" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono text-stone-800 font-medium">{file.name}</div>
                        {file.isConfusingName && (
                          <div className="text-[11px] text-amber-700 mt-0.5 flex items-center gap-1">
                            <span className="font-semibold">Confusing:</span> {file.confusionReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center text-stone-300">
                        <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono text-emerald-900 font-semibold">
                          {file.suggestedName || file.name}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700">
                          <Folder className="w-3 h-3 text-stone-500" />
                          <span>{file.suggestedFolder || 'General'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-stone-500 tabular-nums">
                        {(file.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
