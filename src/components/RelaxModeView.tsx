import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, 
  Wind, 
  BookOpen, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  ShieldAlert,
  Leaf
} from 'lucide-react';
import { SLOTH_ZEN_IMAGE } from '../assets';
import { generateRelaxContent } from '../services/ai';
import { db } from '../services/db';

export const RelaxModeView: React.FC = () => {
  const [sessionDurationMins, setSessionDurationMins] = useState<number>(2);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(120);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Breathing cycle: Inhale (4s) -> Hold (4s) -> Exhale (6s) -> Pause (2s) = 16s total
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [breathCount, setBreathCount] = useState<number>(4);

  // Content tab: 'breathing' | 'story' | 'reflection'
  const [activeTab, setActiveTab] = useState<'breathing' | 'story' | 'reflection'>('breathing');
  const [storyContent, setStoryContent] = useState<{ title: string; content: string; engine: string } | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Synthesize soft ambient singing bowl bell using Web Audio API
  const playChime = (freq = 432) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.99, ctx.currentTime + 2.5);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 3.0);
    } catch {
      // Audio not permitted without interaction
    }
  };

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (isRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            db.recordTimeSaved('Relaxation Pause', `Completed ${sessionDurationMins}-min mindful pause`, 0, sessionDurationMins * 60);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerSecondsLeft, sessionDurationMins]);

  // Breathing rhythm loop
  useEffect(() => {
    if (!isRunning) return;

    let timeout: any;
    const cycle = () => {
      // Phase 1: Inhale (4s)
      setBreathPhase('Inhale');
      setBreathCount(4);
      playChime(432);

      timeout = setTimeout(() => {
        // Phase 2: Hold (4s)
        setBreathPhase('Hold');
        setBreathCount(4);

        timeout = setTimeout(() => {
          // Phase 3: Exhale (6s)
          setBreathPhase('Exhale');
          setBreathCount(6);
          playChime(324);

          timeout = setTimeout(() => {
            // Phase 4: Pause (2s)
            setBreathPhase('Pause');
            setBreathCount(2);

            timeout = setTimeout(() => {
              cycle();
            }, 2000);
          }, 6000);
        }, 4000);
      }, 4000);
    };

    cycle();
    return () => clearTimeout(timeout);
  }, [isRunning]);

  const handleSelectDuration = (mins: number) => {
    setSessionDurationMins(mins);
    setTimerSecondsLeft(mins * 60);
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimerSecondsLeft(sessionDurationMins * 60);
    setBreathPhase('Inhale');
  };

  const handleLoadContent = async (type: 'story' | 'reflection') => {
    setActiveTab(type);
    setIsLoadingStory(true);
    try {
      const res = await generateRelaxContent(type, sessionDurationMins);
      setStoryContent(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStory(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0F1715] text-stone-100 p-8 overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Sloth Relax Mode</h1>
            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Low Arousal Focus
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Unhurried breathing exercises, calming reflections, and gentle bedtime stories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            title={soundEnabled ? 'Mute ambient chimes' : 'Enable ambient chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Distraction-free fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mode navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('breathing')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'breathing' ? 'bg-emerald-800 text-white font-semibold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Sloth Pacing Breath</span>
        </button>

        <button
          onClick={() => handleLoadContent('reflection')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'reflection' ? 'bg-emerald-800 text-white font-semibold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Leaf className="w-3.5 h-3.5" />
          <span>Calming Reflection</span>
        </button>

        <button
          onClick={() => handleLoadContent('story')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'story' ? 'bg-emerald-800 text-white font-semibold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Bedtime Canopy Story</span>
        </button>
      </div>

      {activeTab === 'breathing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Breathing Sanctuary Stage */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-8 shadow-xs flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
            {/* Background subtle zen texture */}
            <div 
              className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: `url(${SLOTH_ZEN_IMAGE})` }}
            />

            {/* Visual Animated Breathing Circle */}
            <div className="relative flex items-center justify-center my-6">
              {/* Outer halo ring */}
              <div 
                className={`w-64 h-64 rounded-full border-2 border-emerald-300/40 flex items-center justify-center transition-all ease-in-out ${
                  breathPhase === 'Inhale' 
                    ? 'scale-110 duration-[4000ms] bg-emerald-50/50' 
                    : breathPhase === 'Hold' 
                      ? 'scale-110 duration-[4000ms] bg-emerald-100/40 ring-4 ring-emerald-300/30' 
                      : breathPhase === 'Exhale'
                        ? 'scale-90 duration-[6000ms] bg-emerald-50/20'
                        : 'scale-90 duration-[2000ms] bg-transparent'
                }`}
              >
                {/* Core breath indicator */}
                <div 
                  className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-center shadow-sm transition-all ease-in-out ${
                    breathPhase === 'Inhale'
                      ? 'bg-emerald-700 text-white duration-[4000ms] scale-105'
                      : breathPhase === 'Hold'
                        ? 'bg-emerald-800 text-emerald-100 duration-[4000ms] scale-105'
                        : breathPhase === 'Exhale'
                          ? 'bg-emerald-900 text-emerald-200 duration-[6000ms] scale-95'
                          : 'bg-stone-200 text-stone-700 duration-[2000ms] scale-95'
                  }`}
                >
                  <span className="text-xs uppercase tracking-widest font-semibold opacity-80">
                    {breathPhase}
                  </span>
                  <span className="text-xl font-bold font-mono mt-1">
                    {isRunning ? breathPhase : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Session Timer & Controls */}
            <div className="text-center space-y-4 z-10">
              <div className="font-mono text-2xl font-bold tabular-nums text-stone-800">
                {formatTimer(timerSecondsLeft)}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isRunning ? 'Pause Session' : 'Begin Breathing'}</span>
                </button>

                <button
                  onClick={handleReset}
                  className="p-2.5 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                  title="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Session Preset Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider pb-2 border-b border-stone-100">
                Choose Session Duration
              </h3>

              <div className="mt-3 space-y-2">
                {[
                  { mins: 2, label: '2-Minute Micro-Pause', desc: 'Quick cognitive reset between demanding tasks' },
                  { mins: 5, label: '5-Minute Calm Stretch', desc: 'Gentle nervous system down-regulation' },
                  { mins: 10, label: '10-Minute Deep Unwind', desc: 'Pre-sleep or end-of-workday transition' }
                ].map((s) => (
                  <button
                    key={s.mins}
                    onClick={() => handleSelectDuration(s.mins)}
                    className={`w-full p-3 text-left rounded-lg text-xs transition-all border ${
                      sessionDurationMins === s.mins
                        ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 font-semibold shadow-2xs'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl border border-stone-200/80 p-4 text-xs text-stone-600 space-y-2">
              <div className="font-semibold text-stone-800">The Sloth Breathing Method:</div>
              <p className="leading-relaxed text-[11px]">
                Slow breaths with an extended exhale (6s) signal safety to the parasympathetic nervous system, lowering resting heart rate without needing intense effort.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Stories / Reflections Reader */}
      {(activeTab === 'story' || activeTab === 'reflection') && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 max-w-3xl mx-auto shadow-xs">
          {isLoadingStory ? (
            <div className="py-16 text-center text-xs text-stone-400 space-y-2">
              <Sparkles className="w-5 h-5 mx-auto animate-spin text-emerald-700" />
              <p>Composing soothing unhurried prose with local intelligence...</p>
            </div>
          ) : storyContent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 text-xs text-stone-400">
                <span className="font-semibold text-emerald-900 text-base">{storyContent.title}</span>
                <span className="font-mono text-[11px]">{storyContent.engine}</span>
              </div>
              <div className="text-sm text-stone-700 leading-relaxed space-y-3 font-serif">
                <p>{storyContent.content}</p>
              </div>
              <div className="pt-4 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() => handleLoadContent(activeTab)}
                  className="px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-50 rounded-lg font-medium transition-colors"
                >
                  Generate Another Reflection
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Medical Disclaimer Banner */}
      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-[11px] text-stone-500 text-center leading-relaxed max-w-2xl mx-auto">
        <strong>Mindfulness Disclaimer:</strong> Sloth Relax Mode is intended solely for general personal well-being, everyday focus pauses, and unhurried rest. It makes no medical claims and is not a substitute for clinical psychological therapy or medical diagnosis.
      </div>
    </div>
  );
};
