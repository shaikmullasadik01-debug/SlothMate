// Local SQLite and IndexedDB persistent storage engine for SlothMate AI

export interface TaskItem {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  deadline: string;
  evidence: string;
  status: 'pending' | 'completed' | 'postponed';
  category: string;
  createdAt: string;
  completedAt?: string;
  postponeCount: number;
}

export interface BriefingRecord {
  id: string;
  title: string;
  createdAt: string;
  sourceText: string;
  summaryLine1: string;
  summaryLine2: string;
  actionItems: Array<{ task: string; owner: string; source: string }>;
  deadlines: Array<{ text: string; date: string; source: string }>;
  unansweredQuestions: string[];
  verifiedFacts: string[];
  interpretations: string[];
  engineUsed: string;
}

export interface SlothScoreEntry {
  id: string;
  category: 'File Tidy' | 'Morning Briefing' | 'Task Planning' | 'Fridge-to-List' | 'Relaxation Pause';
  description: string;
  manualEstimatedMinutes: number;
  actualSeconds: number;
  minutesSaved: number;
  timestamp: string;
}

export interface FridgeItem {
  id: string;
  name: string;
  category: 'Produce' | 'Dairy & Deli' | 'Pantry & Oil' | 'Protein' | 'Other';
  confidence: number; // 0 to 1
  isUncertain: boolean;
  status: 'in_fridge' | 'need_to_buy';
  addedAt: string;
}

const STORAGE_KEYS = {
  TASKS: 'slothmate_tasks_v1',
  BRIEFINGS: 'slothmate_briefings_v1',
  SLOTH_SCORE: 'slothmate_score_v1',
  FRIDGE: 'slothmate_fridge_v1',
  SETTINGS: 'slothmate_settings_v1',
  AUDIT_LOG: 'slothmate_audit_log_v1',
};

// Initial fictional seed data for instant demonstration
const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Review and approve security disclosure document',
    priority: 'High',
    reason: 'Hard external deadline referenced for Oct 24 audit.',
    deadline: 'Oct 24, 2026',
    evidence: 'From Project Sync: "Must finalize security doc before Oct 24 compliance gate."',
    status: 'pending',
    category: 'Security',
    createdAt: new Date().toISOString(),
    postponeCount: 0
  },
  {
    id: 'task-2',
    title: 'Consolidate Q3 cloud infrastructure invoice receipts',
    priority: 'Medium',
    reason: 'Monthly finance reconciliation.',
    deadline: 'Friday',
    evidence: 'From Finance Channel: "Please gather AWS receipts for Q3 reconciliation by Friday."',
    status: 'pending',
    category: 'Finance',
    createdAt: new Date().toISOString(),
    postponeCount: 0
  },
  {
    id: 'task-3',
    title: 'Archive stale desktop screenshots and temporary files',
    priority: 'Low',
    reason: 'Routine workspace hygiene with zero external dependency.',
    deadline: 'Someday',
    evidence: 'Self note: "Clean up messy screenshots folder."',
    status: 'completed',
    category: 'Hygiene',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date().toISOString(),
    postponeCount: 0
  }
];

const INITIAL_FRIDGE: FridgeItem[] = [
  { id: 'f-1', name: 'Fresh Bell Peppers (Yellow & Red)', category: 'Produce', confidence: 0.96, isUncertain: false, status: 'in_fridge', addedAt: new Date().toISOString() },
  { id: 'f-2', name: 'Baby Spinach & Kale', category: 'Produce', confidence: 0.94, isUncertain: false, status: 'in_fridge', addedAt: new Date().toISOString() },
  { id: 'f-3', name: 'Cremini Mushrooms', category: 'Produce', confidence: 0.89, isUncertain: false, status: 'in_fridge', addedAt: new Date().toISOString() },
  { id: 'f-4', name: 'Cherry Tomatoes', category: 'Produce', confidence: 0.95, isUncertain: false, status: 'in_fridge', addedAt: new Date().toISOString() },
  { id: 'f-5', name: 'Extra Virgin Olive Oil', category: 'Pantry & Oil', confidence: 0.91, isUncertain: false, status: 'in_fridge', addedAt: new Date().toISOString() },
  { id: 'f-6', name: 'Garlic Bulbs', category: 'Produce', confidence: 0.93, isUncertain: false, status: 'in_fridge', addedAt: new Date().toISOString() },
  { id: 'f-7', name: 'Artisan Pasta / Noodles', category: 'Pantry & Oil', confidence: 0.65, isUncertain: true, status: 'need_to_buy', addedAt: new Date().toISOString() },
  { id: 'f-8', name: 'Parmesan or Nutritional Yeast', category: 'Dairy & Deli', confidence: 0.70, isUncertain: true, status: 'need_to_buy', addedAt: new Date().toISOString() },
];

const INITIAL_SLOTH_SCORE: SlothScoreEntry[] = [
  {
    id: 'score-1',
    category: 'File Tidy',
    description: 'Renamed and categorized 8 messy downloads',
    manualEstimatedMinutes: 6.0,
    actualSeconds: 1.4,
    minutesSaved: 5.9,
    timestamp: new Date().toISOString()
  },
  {
    id: 'score-2',
    category: 'Morning Briefing',
    description: 'Executive briefing from 42-line messy meeting transcript',
    manualEstimatedMinutes: 14.0,
    actualSeconds: 2.1,
    minutesSaved: 13.9,
    timestamp: new Date().toISOString()
  }
];

class LocalDatabase {
  private memoryCache: {
    tasks: TaskItem[];
    briefings: BriefingRecord[];
    slothScore: SlothScoreEntry[];
    fridge: FridgeItem[];
    auditLogs: Array<{ action: string; timestamp: string; details: string }>;
  };

  constructor() {
    this.memoryCache = {
      tasks: this.load(STORAGE_KEYS.TASKS, INITIAL_TASKS),
      briefings: this.load(STORAGE_KEYS.BRIEFINGS, []),
      slothScore: this.load(STORAGE_KEYS.SLOTH_SCORE, INITIAL_SLOTH_SCORE),
      fridge: this.load(STORAGE_KEYS.FRIDGE, INITIAL_FRIDGE),
      auditLogs: this.load(STORAGE_KEYS.AUDIT_LOG, [
        { action: 'SYSTEM_BOOT', timestamp: new Date().toISOString(), details: 'Offline database initialized locally.' }
      ])
    };
  }

  private load<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private persist(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage persistence warning:', e);
    }
  }

  public logAudit(action: string, details: string) {
    const entry = { action, details, timestamp: new Date().toISOString() };
    this.memoryCache.auditLogs.unshift(entry);
    if (this.memoryCache.auditLogs.length > 100) this.memoryCache.auditLogs.pop();
    this.persist(STORAGE_KEYS.AUDIT_LOG, this.memoryCache.auditLogs);
  }

  public getAuditLogs() {
    return [...this.memoryCache.auditLogs];
  }

  // --- Tasks API ---
  public getTasks(): TaskItem[] {
    return [...this.memoryCache.tasks];
  }

  public addTask(task: Omit<TaskItem, 'id' | 'createdAt' | 'postponeCount'>): TaskItem {
    const newTask: TaskItem = {
      ...task,
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      postponeCount: 0
    };
    this.memoryCache.tasks.unshift(newTask);
    this.persist(STORAGE_KEYS.TASKS, this.memoryCache.tasks);
    this.logAudit('TASK_CREATED', `Added task: "${newTask.title.slice(0, 40)}"`);
    return newTask;
  }

  public updateTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const idx = this.memoryCache.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const updated = { ...this.memoryCache.tasks[idx], ...updates };
    this.memoryCache.tasks[idx] = updated;
    this.persist(STORAGE_KEYS.TASKS, this.memoryCache.tasks);
    this.logAudit('TASK_UPDATED', `Updated task ${id}`);
    return updated;
  }

  public toggleTask(id: string): TaskItem | null {
    const task = this.memoryCache.tasks.find(t => t.id === id);
    if (!task) return null;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : undefined;
    return this.updateTask(id, { status: newStatus, completedAt });
  }

  public postponeTask(id: string): TaskItem | null {
    const task = this.memoryCache.tasks.find(t => t.id === id);
    if (!task) return null;
    return this.updateTask(id, {
      status: 'postponed',
      postponeCount: (task.postponeCount || 0) + 1,
      reason: task.reason + ' (Postponed thoughtfully by user request)'
    });
  }

  public deleteTask(id: string): boolean {
    const prevLen = this.memoryCache.tasks.length;
    this.memoryCache.tasks = this.memoryCache.tasks.filter(t => t.id !== id);
    this.persist(STORAGE_KEYS.TASKS, this.memoryCache.tasks);
    this.logAudit('TASK_DELETED', `Deleted task ${id}`);
    return this.memoryCache.tasks.length < prevLen;
  }

  // --- Briefings API ---
  public getBriefings(): BriefingRecord[] {
    return [...this.memoryCache.briefings];
  }

  public addBriefing(briefing: Omit<BriefingRecord, 'id' | 'createdAt'>): BriefingRecord {
    const record: BriefingRecord = {
      ...briefing,
      id: 'brief-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    this.memoryCache.briefings.unshift(record);
    this.persist(STORAGE_KEYS.BRIEFINGS, this.memoryCache.briefings);
    this.logAudit('BRIEFING_GENERATED', `Created briefing: ${record.title}`);
    return record;
  }

  public deleteBriefing(id: string): boolean {
    const prevLen = this.memoryCache.briefings.length;
    this.memoryCache.briefings = this.memoryCache.briefings.filter(b => b.id !== id);
    this.persist(STORAGE_KEYS.BRIEFINGS, this.memoryCache.briefings);
    return this.memoryCache.briefings.length < prevLen;
  }

  // --- Sloth Score & Time Saved Ledger ---
  public getSlothScoreSummary() {
    const entries = this.memoryCache.slothScore;
    const totalMinutesSaved = entries.reduce((acc, curr) => acc + curr.minutesSaved, 0);
    const totalActualSeconds = entries.reduce((acc, curr) => acc + curr.actualSeconds, 0);
    const totalManualMinutes = entries.reduce((acc, curr) => acc + curr.manualEstimatedMinutes, 0);
    const completedTasksCount = this.memoryCache.tasks.filter(t => t.status === 'completed').length;

    return {
      totalMinutesSaved: Math.round(totalMinutesSaved * 10) / 10,
      totalActualSeconds: Math.round(totalActualSeconds * 10) / 10,
      totalManualMinutes: Math.round(totalManualMinutes * 10) / 10,
      completedTasksCount,
      operationsCount: entries.length,
      entries: [...entries]
    };
  }

  public recordTimeSaved(
    category: SlothScoreEntry['category'],
    description: string,
    manualEstimatedMinutes: number,
    actualSeconds: number
  ): SlothScoreEntry {
    const minutesSaved = Math.max(0, manualEstimatedMinutes - actualSeconds / 60);
    const entry: SlothScoreEntry = {
      id: 'score-' + Math.random().toString(36).substring(2, 9),
      category,
      description,
      manualEstimatedMinutes,
      actualSeconds,
      minutesSaved: Math.round(minutesSaved * 10) / 10,
      timestamp: new Date().toISOString()
    };
    this.memoryCache.slothScore.unshift(entry);
    this.persist(STORAGE_KEYS.SLOTH_SCORE, this.memoryCache.slothScore);
    this.logAudit('SLOTH_SCORE_RECORDED', `Saved ~${entry.minutesSaved} min via ${category}`);
    return entry;
  }

  // --- Fridge API ---
  public getFridgeItems(): FridgeItem[] {
    return [...this.memoryCache.fridge];
  }

  public addFridgeItem(item: Omit<FridgeItem, 'id' | 'addedAt'>): FridgeItem {
    const newItem: FridgeItem = {
      ...item,
      id: 'f-' + Math.random().toString(36).substring(2, 9),
      addedAt: new Date().toISOString()
    };
    this.memoryCache.fridge.push(newItem);
    this.persist(STORAGE_KEYS.FRIDGE, this.memoryCache.fridge);
    return newItem;
  }

  public toggleFridgeStatus(id: string): FridgeItem | null {
    const item = this.memoryCache.fridge.find(f => f.id === id);
    if (!item) return null;
    item.status = item.status === 'in_fridge' ? 'need_to_buy' : 'in_fridge';
    this.persist(STORAGE_KEYS.FRIDGE, this.memoryCache.fridge);
    return item;
  }

  public removeFridgeItem(id: string): boolean {
    const prevLen = this.memoryCache.fridge.length;
    this.memoryCache.fridge = this.memoryCache.fridge.filter(f => f.id !== id);
    this.persist(STORAGE_KEYS.FRIDGE, this.memoryCache.fridge);
    return this.memoryCache.fridge.length < prevLen;
  }

  // --- Export / Import / Wipe ---
  public exportData(): string {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: this.memoryCache.tasks,
      briefings: this.memoryCache.briefings,
      slothScore: this.memoryCache.slothScore,
      fridge: this.memoryCache.fridge,
      auditLogs: this.memoryCache.auditLogs
    }, null, 2);
  }

  public importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) {
        this.memoryCache.tasks = data.tasks;
        this.persist(STORAGE_KEYS.TASKS, data.tasks);
      }
      if (data.briefings) {
        this.memoryCache.briefings = data.briefings;
        this.persist(STORAGE_KEYS.BRIEFINGS, data.briefings);
      }
      if (data.slothScore) {
        this.memoryCache.slothScore = data.slothScore;
        this.persist(STORAGE_KEYS.SLOTH_SCORE, data.slothScore);
      }
      if (data.fridge) {
        this.memoryCache.fridge = data.fridge;
        this.persist(STORAGE_KEYS.FRIDGE, data.fridge);
      }
      this.logAudit('DATABASE_IMPORTED', 'Imported data backup.');
      return true;
    } catch {
      return false;
    }
  }

  public clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.BRIEFINGS);
    localStorage.removeItem(STORAGE_KEYS.SLOTH_SCORE);
    localStorage.removeItem(STORAGE_KEYS.FRIDGE);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);

    this.memoryCache.tasks = [];
    this.memoryCache.briefings = [];
    this.memoryCache.slothScore = [];
    this.memoryCache.fridge = [];
    this.memoryCache.auditLogs = [
      { action: 'DATABASE_WIPED', timestamp: new Date().toISOString(), details: 'All local records erased.' }
    ];
  }
}

export const db = new LocalDatabase();
