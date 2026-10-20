// AI Inference service connecting to local Ollama runtime with offline deterministic fallback

export interface OllamaModelInfo {
  name: string;
  size: number;
  modified_at: string;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
    family?: string;
  };
}

export interface OllamaStatus {
  connected: boolean;
  host: string;
  version?: string;
  models: OllamaModelInfo[];
  hardwareGuidance?: {
    recommendedModel: string;
    lightweightOption: string;
    coderOption: string;
    visionOption: string;
  };
  message?: string;
  guidance?: string;
}

export interface BriefingResult {
  summaryLine1: string;
  summaryLine2: string;
  actionItems: Array<{ task: string; owner: string; source: string }>;
  deadlines: Array<{ text: string; date: string; source: string }>;
  unansweredQuestions: string[];
  verifiedFacts: string[];
  interpretations: string[];
  engineUsed: string;
  durationMs?: number;
}

export interface TaskExtractionResult {
  tasks: Array<{
    title: string;
    priority: 'High' | 'Medium' | 'Low';
    reason: string;
    deadline: string;
    evidence: string;
  }>;
  engineUsed: string;
  durationMs?: number;
}

// User-configurable settings stored in localStorage
export interface AISettings {
  ollamaHost: string;
  selectedModel: string;
  forceOfflineSimulation: boolean;
}

const DEFAULT_SETTINGS: AISettings = {
  ollamaHost: 'http://127.0.0.1:11434',
  selectedModel: 'qwen2.5:1.5b',
  forceOfflineSimulation: false,
};

export function getAISettings(): AISettings {
  try {
    const saved = localStorage.getItem('slothmate_ai_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAISettings(settings: Partial<AISettings>): AISettings {
  const current = getAISettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem('slothmate_ai_settings', JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
  return updated;
}

// Check Ollama daemon connectivity
export async function checkOllamaStatus(): Promise<OllamaStatus> {
  const settings = getAISettings();
  if (settings.forceOfflineSimulation) {
    return {
      connected: false,
      host: settings.ollamaHost,
      models: [],
      message: 'Simulated Offline Mode is currently active by user choice.',
      guidance: 'All operations run via the built-in deterministic offline engine. Toggle in Settings.'
    };
  }

  try {
    const res = await fetch(`/api/ollama/status?host=${encodeURIComponent(settings.ollamaHost)}`);
    if (!res.ok) {
      return {
        connected: false,
        host: settings.ollamaHost,
        models: [],
        message: 'Local server proxy returned HTTP error: ' + res.status
      };
    }
    return await res.json();
  } catch (err: unknown) {
    return {
      connected: false,
      host: settings.ollamaHost,
      models: [],
      message: 'Network error connecting to local server: ' + (err as Error).message
    };
  }
}

// Run Morning Briefing Inference
export async function runMorningBriefing(rawNotes: string): Promise<BriefingResult> {
  const settings = getAISettings();
  const start = performance.now();

  const systemPrompt = `You are SlothMate AI, a privacy-first personal assistant.
Analyze the user's raw notes or conversation export.
Output strictly JSON matching this structure:
{
  "summaryLine1": "Short 1-line executive synopsis.",
  "summaryLine2": "Short second line highlighting key pending decision or workload.",
  "actionItems": [
    { "task": "concise task description", "owner": "name or Unassigned", "source": "exact quotation or snippet" }
  ],
  "deadlines": [
    { "text": "milestone description", "date": "explicit date/day", "source": "exact quotation" }
  ],
  "unansweredQuestions": ["explicit question asked but not answered"],
  "verifiedFacts": ["clear facts or confirmed decisions"],
  "interpretations": ["tentative interpretations separated from facts"]
}
Never hallucinate access to messaging apps. Base every point directly on provided notes.`;

  if (settings.forceOfflineSimulation) {
    const res = await fetch('/api/ollama/infer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'invalid-offline-test',
        taskType: 'briefing',
        userPrompt: rawNotes
      })
    });
    const json = await res.json();
    return {
      ...json.data,
      engineUsed: 'Deterministic Local Parser (Offline Sim)',
      durationMs: +(performance.now() - start).toFixed(1)
    };
  }

  const res = await fetch('/api/ollama/infer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: settings.ollamaHost,
      model: settings.selectedModel,
      systemPrompt,
      userPrompt: rawNotes,
      taskType: 'briefing',
      format: 'json'
    })
  });

  const json = await res.json();
  return {
    ...json.data,
    engineUsed: json.engine || 'Deterministic Local Engine',
    durationMs: +(performance.now() - start).toFixed(1)
  };
}

// Run Task Extraction & Prioritization
export async function extractTasksFromNotes(rawNotes: string): Promise<TaskExtractionResult> {
  const settings = getAISettings();
  const start = performance.now();

  const systemPrompt = `You are SlothMate AI task assistant.
Convert notes into actionable tasks.
Output JSON format:
{
  "tasks": [
    {
      "title": "Actionable task title",
      "priority": "High" | "Medium" | "Low",
      "reason": "Clear explanation of priority (e.g. hard external deadline vs low-friction cleanup)",
      "deadline": "Extracted date or 'Flexible'",
      "evidence": "Source snippet from the notes"
    }
  ]
}
Extract deadlines ONLY when supported by input text. Be thoughtful like a sloth: avoid overwhelming the user.`;

  const res = await fetch('/api/ollama/infer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: settings.forceOfflineSimulation ? 'invalid-offline-test' : settings.ollamaHost,
      model: settings.selectedModel,
      systemPrompt,
      userPrompt: rawNotes,
      taskType: 'tasks',
      format: 'json'
    })
  });

  const json = await res.json();
  return {
    tasks: json.data?.tasks || [],
    engineUsed: json.engine || 'Deterministic Local Engine',
    durationMs: +(performance.now() - start).toFixed(1)
  };
}

// Generate Sloth Bedtime Story or Mindful Reflection
export async function generateRelaxContent(type: 'story' | 'reflection' | 'breathing', minutes: number): Promise<{ title: string; content: string; engine: string }> {
  const settings = getAISettings();

  const prompts = {
    story: `Write a short, cozy, atmospheric bedtime story (approx 200 words) about a gentle sloth named Barnaby who discovers a quiet sunlit canopy in the cloud forest. Keep it soothing, warm, and restful.`,
    reflection: `Write a gentle 150-word mindfulness reflection on the art of moving slowly, letting go of artificial urgency, and conserving energy for what truly matters in life.`,
    breathing: `Provide a calming guide for a ${minutes}-minute 4-4-6 breathing pause with gentle words of encouragement.`
  };

  if (settings.forceOfflineSimulation) {
    const offlineFallbacks = {
      story: {
        title: 'Barnaby and the Sunlit Canopy',
        content: `High above the damp rainforest floor, Barnaby the three-toed sloth rested on a broad, moss-cushioned branch of a wild fig tree. The morning mist had given way to soft, golden rays filtering through the thick canopy. Below, anxious birds darted between trees in a hurry to be somewhere else. But Barnaby took a slow, deep breath of cedar and damp earth. There was no inbox in the canopy. No urgent notifications. Only the steady rustle of emerald leaves and the warm sun warming his fur. He stretched one slow arm, settled his chin upon his paws, and realized that simply being present was the greatest accomplishment of the day.`
      },
      reflection: {
        title: 'The Grace of Moving Thoughtfully',
        content: `In a world that celebrates frantic speed, slowness is a quiet rebellion. When you slow down, you do not lose time—you regain awareness. Most daily urgency is self-created noise. Today, grant yourself permission to pause between actions. Take three conscious breaths before opening the next task. Notice that the world continues to turn, effortlessly, even when you choose to be still.`
      },
      breathing: {
        title: 'Gentle Canopy Breath',
        content: `Inhale slowly for four counts, drawing calm air into your lungs. Hold gently for four counts, resting in stillness. Exhale smoothly for six counts, releasing the weight in your shoulders. Repeat this cycle at your own natural, unhurried pace.`
      }
    };
    return {
      ...offlineFallbacks[type],
      engine: 'Built-in Local Mindfulness Cache (Offline)'
    };
  }

  try {
    const res = await fetch('/api/ollama/infer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: settings.ollamaHost,
        model: settings.selectedModel,
        systemPrompt: 'You are a calming, thoughtful writer for SlothMate AI. Write gentle, restful text with no medical claims.',
        userPrompt: prompts[type],
        taskType: 'briefing',
        format: 'text'
      })
    });
    const json = await res.json();
    return {
      title: type === 'story' ? 'The Canopy Rest' : type === 'reflection' ? 'The Art of Unhurried Focus' : 'Mindful Breath',
      content: json.rawOutput || json.data?.summaryLine1 || 'Breathe in softly, let go of hurry, and rest.',
      engine: json.engine || 'Local Ollama'
    };
  } catch {
    return {
      title: 'Gentle Forest Repose',
      content: 'Rest your eyes, release tension from your neck, and let your breath settle like morning dew on a broad green leaf.',
      engine: 'Deterministic Local Engine'
    };
  }
}
