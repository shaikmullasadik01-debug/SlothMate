import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Trash2, 
  Plus, 
  Calendar, 
  ShieldAlert, 
  Sparkles, 
  CalendarClock, 
  ChevronRight, 
  Edit3, 
  Check, 
  X,
  ListFilter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskItem, db } from '../services/db';
import { extractTasksFromNotes } from '../services/ai';

interface TodoAssistantViewProps {
  onTaskChange?: () => void;
}

export const TodoAssistantView: React.FC<TodoAssistantViewProps> = ({ onTaskChange }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => db.getTasks());
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [quickNote, setQuickNote] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  const refreshTasks = () => {
    setTasks(db.getTasks());
    onTaskChange?.();
  };

  const handleToggleTask = (task: TaskItem) => {
    const updated = db.toggleTask(task.id);
    if (updated?.status === 'completed') {
      // Confetti celebration!
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#047857', '#10B981', '#34D399', '#F59E0B']
      });
      // Sloth Score credit
      db.recordTimeSaved('Task Planning', `Completed task: ${task.title}`, 8.0, 1.0);
    }
    refreshTasks();
  };

  const handlePostponeTask = (id: string) => {
    db.postponeTask(id);
    refreshTasks();
  };

  const handleDeleteTask = (id: string) => {
    db.deleteTask(id);
    refreshTasks();
  };

  const handleStartEdit = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDeadline(task.deadline);
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    db.updateTask(id, {
      title: editTitle.trim(),
      deadline: editDeadline.trim() || 'Flexible'
    });
    setEditingTaskId(null);
    refreshTasks();
  };

  const handleConvertNotesToTasks = async () => {
    if (!quickNote.trim()) return;
    setIsExtracting(true);
    try {
      const result = await extractTasksFromNotes(quickNote);
      for (const t of result.tasks) {
        db.addTask({
          title: t.title,
          priority: t.priority,
          reason: t.reason,
          deadline: t.deadline,
          evidence: t.evidence,
          status: 'pending',
          category: 'Quick Extract'
        });
      }
      setQuickNote('');
      refreshTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Sloth Anti-Overwhelm Daily Plan partitioning:
  // Top 3 Essential (High priority or due soon)
  // Next Up (Medium/Low)
  // Thoughtfully Postponed
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const postponedTasks = tasks.filter(t => t.status === 'postponed');

  const top3Focus = pendingTasks.slice(0, 3);
  const remainingPending = pendingTasks.slice(3);

  const filteredTasks = filter === 'all' 
    ? tasks 
    : filter === 'pending' 
      ? tasks.filter(t => t.status !== 'completed') 
      : completedTasks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Instant To-Do Assistant</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Turn messy thoughts into prioritized tasks. Sloth principle: Focus only on the top 3 essential items per day to prevent burnout.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'all' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'pending' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pending ({pendingTasks.length + postponedTasks.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'completed' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Completed ({completedTasks.length})
          </button>
        </div>
      </div>

      {/* Quick Convert Unstructured Note Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
        <label className="block text-xs font-semibold text-stone-800 mb-1">
          Convert Freeform Notes into Actionable Tasks
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="e.g. Call accountant tomorrow morning before 11am and email budget PDF to client"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConvertNotesToTasks();
            }}
            className="flex-1 text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
          />
          <button
            onClick={handleConvertNotesToTasks}
            disabled={isExtracting || !quickNote.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] disabled:opacity-50 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isExtracting ? 'Extracting...' : 'Extract & Prioritize'}</span>
          </button>
        </div>
      </div>

      {/* Daily Sloth Focus: Top 3 Essential */}
      {filter !== 'completed' && top3Focus.length > 0 && (
        <div className="bg-emerald-900 text-emerald-50 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Today's Essential Focus (Top 3 Maximum)</h2>
            </div>
            <span className="text-[11px] text-emerald-300 font-mono">Conserve energy · Finish these first</span>
          </div>

          <div className="mt-3.5 space-y-2.5">
            {top3Focus.map((task, idx) => (
              <div 
                key={task.id}
                className="p-3 bg-emerald-800/60 rounded-lg border border-emerald-700/60 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="mt-0.5 text-emerald-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="font-semibold text-white text-sm">{task.title}</div>
                    <div className="text-[11px] text-emerald-200/80 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Priority: <strong className="text-white">{task.priority}</strong></span>
                      <span>·</span>
                      <span>{task.reason}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[11px] text-emerald-200 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-700/50">
                    {task.deadline}
                  </span>
                  <button
                    onClick={() => handlePostponeTask(task.id)}
                    title="Postpone thoughtfully (+1 day)"
                    className="text-emerald-300 hover:text-white text-[11px] p-1 hover:bg-emerald-700/50 rounded transition-colors"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Task List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
          <span>Task Inventory ({filteredTasks.length})</span>
          <span className="font-mono tabular-nums">{completedTasks.length} completed</span>
        </div>

        <div className="divide-y divide-stone-100">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No tasks in this view. Convert a note or extract items from your Morning Briefing.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isEditing = editingTaskId === task.id;

              return (
                <div 
                  key={task.id}
                  className={`p-3.5 hover:bg-stone-50/70 transition-colors flex items-start justify-between gap-3 text-xs ${
                    isCompleted ? 'bg-stone-50/40 opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xs p-1.5 border border-stone-300 rounded bg-white"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editDeadline}
                            onChange={(e) => setEditDeadline(e.target.value)}
                            placeholder="Deadline (e.g. Tomorrow 4pm)"
                            className="text-xs p-1.5 border border-stone-300 rounded bg-white w-48"
                          />
                          <button
                            onClick={() => handleSaveEdit(task.id)}
                            className="px-2 py-1 bg-emerald-800 text-white rounded text-[11px] font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="px-2 py-1 text-stone-600 hover:bg-stone-100 rounded text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className={`font-semibold text-stone-900 ${isCompleted ? 'line-through text-stone-400' : ''}`}>
                          {task.title}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-1 flex flex-wrap items-center gap-2">
                          <span className={`font-medium ${
                            task.priority === 'High' ? 'text-amber-800 font-semibold' : 'text-stone-600'
                          }`}>
                            {task.priority} Priority
                          </span>
                          <span>·</span>
                          <span>{task.reason}</span>
                          {task.evidence && (
                            <>
                              <span>·</span>
                              <span className="italic text-stone-400">"{task.evidence.slice(0, 45)}..."</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60">
                        {task.deadline}
                      </span>

                      {!isCompleted && (
                        <button
                          onClick={() => handlePostponeTask(task.id)}
                          title="Postpone with sloth calm"
                          className="p-1 text-stone-400 hover:text-amber-700 hover:bg-stone-100 rounded transition-colors"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleStartEdit(task)}
                        title="Edit task"
                        className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete task"
                        className="p-1 text-stone-400 hover:text-red-700 hover:bg-stone-100 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
