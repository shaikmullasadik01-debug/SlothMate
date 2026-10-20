import React from 'react';
import { 
  FileText, 
  FolderTree, 
  CheckSquare, 
  ShoppingBag, 
  Wind, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Cpu, 
  Plus, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { SLOTH_MASCOT_IMAGE } from '../assets';
import { SlothScoreCard } from './SlothScoreCard';
import { db, TaskItem, BriefingRecord } from '../services/db';
import { OllamaStatus, AISettings } from '../services/ai';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  ollamaStatus: OllamaStatus | null;
  settings: AISettings;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  ollamaStatus,
  settings
}) => {
  const tasks = db.getTasks();
  const briefings = db.getBriefings();
  const fridgeItems = db.getFridgeItems();
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const latestBriefing = briefings[0] || null;

  return (
    <div className="space-y-6">
      
      {/* 1. Personalized Greeting Hero Banner with Sloth Mascot */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/70">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Slow and Steady — Open-Source AI</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight text-balance">
            Good morning. Work less, relax more.
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            SlothMate AI is your privacy-first personal productivity agent. We use local open-weight models to automate the boring stuff while keeping 100% of your personal data on your machine.
          </p>
        </div>

        <div className="relative shrink-0">
          <img 
            src={SLOTH_MASCOT_IMAGE} 
            alt="SlothMate calm mascot" 
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-stone-100 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-2 -right-2 bg-emerald-800 text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-xs border border-white">
            Local Agent
          </div>
        </div>
      </div>

      {/* 2. "Let Your Sloth Handle It" Quick-Action Panel */}
      <div>
        <div className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
          Let Your Sloth Handle It
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              tab: 'briefing',
              icon: FileText,
              title: 'Morning Briefing',
              desc: 'Distill notes to 2 lines',
              color: 'text-emerald-700 bg-emerald-50/70 border-emerald-200/70'
            },
            {
              tab: 'file-tidy',
              icon: FolderTree,
              title: 'Smart File Tidy',
              desc: 'Hash dedup & safe rename',
              color: 'text-amber-700 bg-amber-50/70 border-amber-200/70'
            },
            {
              tab: 'tasks',
              icon: CheckSquare,
              title: 'To-Do Assistant',
              desc: 'Top 3 anti-overwhelm plan',
              color: 'text-emerald-800 bg-emerald-50/70 border-emerald-200/70'
            },
            {
              tab: 'fridge',
              icon: ShoppingBag,
              title: 'Fridge-to-List',
              desc: 'Pantry gap analysis',
              color: 'text-emerald-700 bg-emerald-50/70 border-emerald-200/70'
            },
            {
              tab: 'relax',
              icon: Wind,
              title: 'Relax Mode',
              desc: 'Sloth pacing breathing',
              color: 'text-stone-700 bg-stone-100/70 border-stone-200/70'
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.tab}
                onClick={() => onNavigateTab(item.tab)}
                className="p-3.5 bg-white rounded-xl border border-stone-200/80 hover:border-emerald-700/50 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border mb-2 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 group-hover:text-emerald-900 transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. The Signature Feature: The Sloth Score Card & Busywork Busted */}
      <SlothScoreCard pendingTasksCount={pendingTasks.length} />

      {/* 4 & 5. Two-Column Dashboard Split: Tasks & Latest Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Prioritized Tasks */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-stone-900">Today's Prioritized Tasks</h2>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1"
              >
                <span>View All ({tasks.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-stone-100">
              {pendingTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-stone-900">{task.title}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                      <span className="font-medium text-amber-800">{task.priority} Priority</span>
                      <span>·</span>
                      <span>{task.reason}</span>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60 shrink-0">
                    {task.deadline}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Sloth discipline: Focus on one thing at a time.</span>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200/70 text-stone-800 rounded-lg font-medium transition-colors"
            >
              Manage Tasks
            </button>
          </div>
        </div>

        {/* Right Column: Latest Morning Briefing Snippet */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-stone-900">Morning Briefing Snapshot</h2>
              </div>
              <button
                onClick={() => onNavigateTab('briefing')}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1"
              >
                <span>Synthesize</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {latestBriefing ? (
              <div className="mt-3 space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100 text-stone-800 space-y-1">
                  <div className="font-semibold text-emerald-950">{latestBriefing.summaryLine1}</div>
                  <div className="text-stone-600 text-[11px]">{latestBriefing.summaryLine2}</div>
                </div>

                <div className="text-stone-500 text-[11px] flex items-center justify-between">
                  <span>{latestBriefing.actionItems.length} action items</span>
                  <span>·</span>
                  <span>{latestBriefing.deadlines.length} deadlines</span>
                  <span>·</span>
                  <span className="font-mono text-stone-400">{latestBriefing.engineUsed}</span>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center py-6 text-xs text-stone-400 space-y-2">
                <FileText className="w-6 h-6 mx-auto text-stone-300" />
                <p>No briefings generated yet today.</p>
                <button
                  onClick={() => onNavigateTab('briefing')}
                  className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold"
                >
                  Generate First Briefing
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Verified facts kept strictly separated from model hypotheses.</span>
          </div>
        </div>

      </div>

      {/* 8. Local AI & Offline Privacy Status Banner */}
      <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4 text-emerald-800" />
          </div>
          <div>
            <div className="font-semibold text-stone-900">
              Active Engine: {settings.forceOfflineSimulation ? 'Simulated Offline Mode' : ollamaStatus?.connected ? `Ollama (${settings.selectedModel})` : 'Deterministic Local Offline Engine'}
            </div>
            <div className="text-[11px] text-stone-500">
              Zero outbound network traffic. Private local data preservation active.
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('privacy')}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Run Test Suite & View Privacy Architecture</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
