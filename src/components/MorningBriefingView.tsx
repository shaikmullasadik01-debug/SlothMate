import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Clock, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  Cpu, 
  BookmarkCheck,
  RefreshCw
} from 'lucide-react';
import { runMorningBriefing, BriefingResult } from '../services/ai';
import { db } from '../services/db';

const SAMPLE_NOTE_1 = `Sprint 42 Weekly Catch-Up & Compliance Audit (Oct 20, 2026)
Attendees: Marcus, Priya, Elena, Dave

- Status: Elena confirmed that database migration script passed initial staging dry-run without errors.
- Critical Gate: Marcus stated we MUST finalize the SOC2 security disclosure document before Oct 24 compliance audit gate. Priya agreed to handle Section 4.
- Dave mentioned: "Can someone check if our AWS reserved instances renew automatically on Friday?" (Nobody answered during the meeting).
- Customer Feedback: Two enterprise trials asked for offline data export. Dave thinks we could maybe build a simple JSON exporter by next week, but we haven't scoped the engineering hours yet.
- Agreed Action Item: Priya to draft the vendor risk assessment by Wednesday afternoon.
- Agreed Action Item: Marcus to schedule pen-test kick-off call with CyberSafe team.
- Open Question: Who is handling the on-call pager rotation for the upcoming long weekend?
- Budget Note: Dave confirmed $420 cloud invoice has been paid.`;

const SAMPLE_NOTE_2 = `Support & Operations Chat Log Extract (Oct 19, 2026)
[10:14] Sarah: Hey team, we just had 3 customer tickets regarding the PDF report download filename being corrupted.
[10:16] Leo: Looking into it. Looks like special characters in user names broke the slug generator.
[10:22] Leo: Fixed in PR #182. Status: verified in staging.
[10:35] Sarah: Thanks Leo! Also reminder: All team members need to submit their Q4 hardware budget requests by Oct 28.
[10:41] Nina: Is there a specific spreadsheet template for the budget, or can we just email our itemized list?
[10:42] Sarah: Good question, let me ask finance and report back later.
[11:05] Leo: TODO: need to rotate the staging database test credentials before next sprint kickoff on Monday.`;

interface MorningBriefingViewProps {
  onTaskAdded?: () => void;
  onBriefingComplete?: () => void;
}

export const MorningBriefingView: React.FC<MorningBriefingViewProps> = ({
  onTaskAdded,
  onBriefingComplete
}) => {
  const [inputText, setInputText] = useState(SAMPLE_NOTE_1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BriefingResult | null>(null);
  const [sourceExpandedItem, setSourceExpandedItem] = useState<string | null>(null);
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const data = await runMorningBriefing(inputText);
      setResult(data);

      // Save to local database
      db.addBriefing({
        title: `Briefing - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        sourceText: inputText,
        summaryLine1: data.summaryLine1,
        summaryLine2: data.summaryLine2,
        actionItems: data.actionItems,
        deadlines: data.deadlines,
        unansweredQuestions: data.unansweredQuestions,
        verifiedFacts: data.verifiedFacts,
        interpretations: data.interpretations,
        engineUsed: data.engineUsed
      });

      // Credit Sloth Score (benchmark: ~12 minutes manual reading vs seconds)
      db.recordTimeSaved(
        'Morning Briefing',
        `Synthesized briefing from ${inputText.split('\n').length} notes lines`,
        12.0,
        (data.durationMs || 2500) / 1000
      );

      onBriefingComplete?.();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddTaskToTodo = (item: { task: string; owner: string; source: string }) => {
    db.addTask({
      title: item.task,
      priority: 'Medium',
      reason: `Extracted from Morning Briefing (Owner: ${item.owner})`,
      deadline: 'Pending review',
      evidence: item.source,
      status: 'pending',
      category: 'Briefing'
    });
    setAddedTasks(prev => new Set(prev).add(item.task));
    onTaskAdded?.();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Lazy Morning Briefing</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Ingest raw meeting transcripts or team notes. Automatically separate verified facts from AI interpretations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg cursor-pointer transition-colors shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            <span>Upload Text / Markdown</span>
            <input type="file" accept=".txt,.md,.json,.csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Preset selector */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-stone-400 font-medium">Quick Presets:</span>
        <button
          onClick={() => setInputText(SAMPLE_NOTE_1)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            inputText === SAMPLE_NOTE_1 
              ? 'bg-stone-200 text-stone-900 font-medium' 
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Sprint & Compliance Audit Note
        </button>
        <button
          onClick={() => setInputText(SAMPLE_NOTE_2)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            inputText === SAMPLE_NOTE_2 
              ? 'bg-stone-200 text-stone-900 font-medium' 
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Team Support Chat Export
        </button>
      </div>

      {/* Input Textarea & Action */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 text-xs text-stone-500">
          <span>Source Notes (Untrusted Input Sanitized)</span>
          <span className="font-mono tabular-nums">{inputText.length} characters · {inputText.split('\n').filter(Boolean).length} lines</span>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={6}
          placeholder="Paste meeting transcript, notes, or conversation export here..."
          className="w-full text-xs font-mono p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition-all text-stone-800 leading-relaxed"
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-[11px] text-stone-400 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-stone-400" />
            <span>Local open-weight model with offline fallback. No data leaves your machine.</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isProcessing || !inputText.trim()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] disabled:opacity-50 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Distilling Briefing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Distill Morning Briefing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Synthesis Output Display */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Executive 2-Line Summary Card */}
          <div className="bg-emerald-900 text-emerald-50 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-800/80 text-xs text-emerald-300">
              <span className="font-semibold uppercase tracking-wider">Executive Two-Line Summary</span>
              <span className="font-mono text-[11px] opacity-90">{result.engineUsed}</span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm leading-relaxed">
              <p className="font-semibold text-white">{result.summaryLine1}</p>
              <p className="text-emerald-200/90">{result.summaryLine2}</p>
            </div>
          </div>

          {/* Grid of Extracted Intelligence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Action Items with Review Source */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-stone-900">Extracted Action Items</h3>
                </div>
                <span className="text-xs font-mono text-stone-400">{result.actionItems?.length || 0} found</span>
              </div>

              <div className="mt-3 space-y-2.5">
                {result.actionItems && result.actionItems.length > 0 ? (
                  result.actionItems.map((item, idx) => {
                    const isAdded = addedTasks.has(item.task);
                    const isSourceOpen = sourceExpandedItem === `action-${idx}`;

                    return (
                      <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-stone-100 text-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-stone-900">{item.task}</div>
                            <div className="text-[11px] text-stone-500 mt-0.5">
                              Assignee: <span className="font-medium text-stone-700">{item.owner}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddTaskToTodo(item)}
                            disabled={isAdded}
                            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                              isAdded 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>To-Do</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Review Source accordion */}
                        <div>
                          <button
                            onClick={() => setSourceExpandedItem(isSourceOpen ? null : `action-${idx}`)}
                            className="text-[11px] text-emerald-800 hover:text-emerald-950 flex items-center gap-1 font-medium"
                          >
                            <span>Review Source Material</span>
                            {isSourceOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {isSourceOpen && (
                            <div className="mt-1.5 p-2 bg-stone-100/80 rounded font-mono text-[11px] text-stone-700 border-l-2 border-emerald-600">
                              "{item.source}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-stone-400 py-4 text-center">No explicit action items found.</div>
                )}
              </div>
            </div>

            {/* 2. Deadlines with Evidence */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <h3 className="text-sm font-bold text-stone-900">Supported Deadlines</h3>
                </div>
                <span className="text-xs font-mono text-stone-400">{result.deadlines?.length || 0} dates</span>
              </div>

              <div className="mt-3 space-y-2.5">
                {result.deadlines && result.deadlines.length > 0 ? (
                  result.deadlines.map((dl, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-stone-100 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-stone-900">{dl.text}</span>
                        <span className="font-mono font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200/60">
                          {dl.date}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-stone-500 mt-1.5 bg-white p-1.5 rounded border border-stone-100">
                        Evidence: "{dl.source}"
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-stone-400 py-4 text-center">No explicit deadlines identified in notes.</div>
                )}
              </div>
            </div>

            {/* 3. Verified Facts (Strict Separation) */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900">Verified Facts</h3>
                </div>
                <span className="text-[11px] text-stone-400">Directly confirmed</span>
              </div>

              <ul className="mt-3 space-y-2 text-xs text-stone-700">
                {result.verifiedFacts && result.verifiedFacts.length > 0 ? (
                  result.verifiedFacts.map((fact, idx) => (
                    <li key={idx} className="p-2 bg-emerald-50/40 rounded border border-emerald-100 flex items-start gap-2">
                      <span className="text-emerald-700 font-bold shrink-0">·</span>
                      <span>{fact}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-stone-400 py-2">No standalone facts detected.</li>
                )}
              </ul>
            </div>

            {/* 4. Model Interpretations vs Facts */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-stone-400" />
                  <h3 className="text-sm font-bold text-stone-900">Model Interpretations</h3>
                </div>
                <span className="text-[11px] text-stone-400">Uncertain / Inferred</span>
              </div>

              <ul className="mt-3 space-y-2 text-xs text-stone-600">
                {result.interpretations && result.interpretations.length > 0 ? (
                  result.interpretations.map((interp, idx) => (
                    <li key={idx} className="p-2 bg-stone-50 rounded border border-stone-100 flex items-start gap-2">
                      <span className="text-stone-400 font-bold shrink-0">?</span>
                      <span className="italic">{interp}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-stone-400 py-2">No uncertain interpretations required.</li>
                )}
              </ul>
            </div>

            {/* 5. Unanswered Questions */}
            {result.unansweredQuestions && result.unansweredQuestions.length > 0 && (
              <div className="col-span-1 md:col-span-2 bg-amber-50/40 rounded-xl border border-amber-200/60 p-4 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200/50">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <h3 className="text-sm font-bold text-amber-950">Unanswered Questions Requiring Attention</h3>
                </div>
                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-950">
                  {result.unansweredQuestions.map((q, idx) => (
                    <li key={idx} className="p-2.5 bg-white/80 rounded border border-amber-200/50 font-medium">
                      "{q}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
};
