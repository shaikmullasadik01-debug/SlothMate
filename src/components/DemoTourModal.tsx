import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  FolderTree, 
  WifiOff, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import { SLOTH_MASCOT_IMAGE } from '../assets';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const STEPS = [
    {
      step: 1,
      title: 'Import Fictional Messy Meeting Note',
      description: 'Load a messy sprint catch-up note containing action items, unanswered questions, budget figures, and ambiguity.',
      targetTab: 'briefing',
      actionLabel: 'Go to Morning Briefing',
      tag: 'Sample Data'
    },
    {
      step: 2,
      title: 'Generate Lazy Morning Briefing',
      description: 'Run the local open-weight model to generate an executive two-line summary and separate hard facts from uncertain interpretations.',
      targetTab: 'briefing',
      actionLabel: 'Review Briefing Synthesis',
      tag: 'Local Inference'
    },
    {
      step: 3,
      title: 'Extract Three Actionable Tasks',
      description: 'Extract prioritized tasks with clear reasons and supported deadlines directly into your local To-Do inventory.',
      targetTab: 'tasks',
      actionLabel: 'Open To-Do Assistant',
      tag: 'Task Extraction'
    },
    {
      step: 4,
      title: 'Preview File Organization Changes',
      description: 'Scan the demo sandbox folder to decode confusing filenames (like final_v2_edit(2).pdf) and detect identical content duplicates via MD5 hash.',
      targetTab: 'file-tidy',
      actionLabel: 'Inspect File Tidy Preview',
      tag: 'File Analysis'
    },
    {
      step: 5,
      title: 'Approve Safe File Operations',
      description: 'Review the proposed rename and categorical folder moves. Execute deterministic rename with collision protection (zero automatic deletes).',
      targetTab: 'file-tidy',
      actionLabel: 'Approve Operations in Tidy',
      tag: 'Deterministic Code'
    },
    {
      step: 6,
      title: 'Simulate Offline Disconnection',
      description: 'Toggle offline simulation in settings to prove that all local processing continues operating without an active internet connection.',
      targetTab: 'privacy',
      actionLabel: 'Open Privacy & Settings',
      tag: 'Offline Invariant'
    },
    {
      step: 7,
      title: 'Verify Offline Core Operations',
      description: 'Confirm that briefings, to-do extraction, and file management run 100% locally with zero cloud dependencies.',
      targetTab: 'dashboard',
      actionLabel: 'Return to Dashboard',
      tag: 'Verified'
    }
  ];

  const current = STEPS[currentStep - 1];

  const handleStepAction = () => {
    onNavigateTab(current.targetTab);
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mascot & Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <img 
            src={SLOTH_MASCOT_IMAGE} 
            alt="Sloth mascot" 
            className="w-11 h-11 rounded-full object-cover border border-emerald-800/20"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              Challenge Demonstration Guide
            </div>
            <h2 className="text-base font-bold text-stone-900">
              SlothMate AI Guided Walkthrough
            </h2>
          </div>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center justify-between my-4 px-1">
          {STEPS.map((s) => (
            <div 
              key={s.step} 
              className={`h-1.5 flex-1 mx-0.5 rounded-full transition-all ${
                s.step === currentStep 
                  ? 'bg-emerald-800' 
                  : s.step < currentStep 
                    ? 'bg-emerald-300' 
                    : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Current Step Content */}
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-stone-400">Step {currentStep} of 7</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
              {current.tag}
            </span>
          </div>

          <h3 className="text-sm font-bold text-stone-900">
            {current.title}
          </h3>

          <p className="text-xs text-stone-600 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:hover:text-stone-500 px-2 py-1 rounded"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleStepAction}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <span>{current.actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
