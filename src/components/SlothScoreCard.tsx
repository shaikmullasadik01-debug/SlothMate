import React from 'react';
import { Clock, ShieldCheck, Zap, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../services/db';

interface SlothScoreCardProps {
  onRefresh?: () => void;
  pendingTasksCount: number;
}

export const SlothScoreCard: React.FC<SlothScoreCardProps> = ({ pendingTasksCount }) => {
  const summary = db.getSlothScoreSummary();
  const [showFormula, setShowFormula] = React.useState(false);

  // Format hours and minutes cleanly
  const formatTime = (minutes: number) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 tracking-tight">The Sloth Score</h2>
            <button
              onClick={() => setShowFormula(!showFormula)}
              className="text-stone-400 hover:text-stone-700 transition-colors"
              title="How time saved is estimated"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Transparent estimation of cognitive busywork handed off to local automation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/70">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>{summary.completedTasksCount + summary.operationsCount} operations approved</span>
        </div>
      </div>

      {showFormula && (
        <div className="my-3 p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/70 text-xs text-stone-700 leading-relaxed">
          <div className="font-semibold text-emerald-900 mb-1">Transparent Calculation Model:</div>
          <ul className="list-disc list-inside space-y-0.5 text-stone-600">
            <li><strong>File Tidy:</strong> Benchmark ~45 sec manual sorting/renaming per file vs measured local engine time (~1.2s).</li>
            <li><strong>Morning Briefing:</strong> Benchmark ~12 min reading/formatting per raw transcript vs local engine parsing (~2.5s).</li>
            <li><strong>Task Prioritization:</strong> Benchmark ~8 min synthesizing messy notes into focus blocks vs model response (~1.1s).</li>
            <li><strong>Net Time Saved:</strong> Estimated Manual Minutes - Actual Local Computation Seconds / 60.</li>
          </ul>
        </div>
      )}

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
        <div className="p-3 bg-stone-50/70 rounded-lg border border-stone-100">
          <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Estimated Manual</div>
          <div className="text-xl font-bold font-mono tabular-nums text-stone-800 mt-1">
            {formatTime(summary.totalManualMinutes)}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Human review baseline</div>
        </div>

        <div className="p-3 bg-stone-50/70 rounded-lg border border-stone-100">
          <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Local Processing</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-800 mt-1">
            {summary.totalActualSeconds}s
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Zero remote latency</div>
        </div>

        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <div className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">Estimated Saved</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-900 mt-1">
            {formatTime(summary.totalMinutesSaved)}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Energy preserved</div>
        </div>

        <div className="p-3 bg-stone-50/70 rounded-lg border border-stone-100">
          <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Tasks Cleared</div>
          <div className="text-xl font-bold font-mono tabular-nums text-stone-800 mt-1">
            {summary.completedTasksCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">User verified</div>
        </div>
      </div>

      {/* Daily "Busywork Busted" Summary */}
      <div className="pt-3 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold text-stone-800">Today's Busywork Busted:</span>
          <span className="text-stone-600">
            {summary.operationsCount > 0 
              ? `${summary.operationsCount} automated passes processed with zero manual friction.`
              : 'Ready to assist with files, notes, or meal planning.'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-stone-600 shrink-0">
          {pendingTasksCount > 0 ? (
            <span className="flex items-center gap-1.5 text-stone-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingTasksCount} items require your attention</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All daily focus goals completed! Time to relax.</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
