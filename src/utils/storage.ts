import { WorkTask, MonthlyDivisionSummary, TaskStatus, DivisionId } from '../types';
import { INITIAL_TASKS, INITIAL_MONTHLY_SUMMARIES } from '../data/initialData';

const TASKS_STORAGE_KEY = 'work_tracking_system_tasks_v1';
const SUMMARIES_STORAGE_KEY = 'work_tracking_system_summaries_v1';

export function loadTasksFromStorage(): WorkTask[] {
  try {
    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    if (data) {
      const parsed: WorkTask[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all default initial tasks exist (merge any newly introduced tasks)
        const existingIds = new Set(parsed.map((t) => t.id));
        const missingInitialTasks = INITIAL_TASKS.filter((t) => !existingIds.has(t.id));
        if (missingInitialTasks.length > 0) {
          const merged = [...parsed, ...missingInitialTasks];
          saveTasksToStorage(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading tasks from localStorage', e);
  }
  // Default to initial tasks
  saveTasksToStorage(INITIAL_TASKS);
  return INITIAL_TASKS;
}

export function saveTasksToStorage(tasks: WorkTask[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-storage-sync', { detail: { key: TASKS_STORAGE_KEY } }));
    }
  } catch (e) {
    console.error('Error saving tasks to localStorage', e);
  }
}

export function loadSummariesFromStorage(): MonthlyDivisionSummary[] {
  try {
    const data = localStorage.getItem(SUMMARIES_STORAGE_KEY);
    if (data) {
      const parsed: MonthlyDivisionSummary[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((s) => s.id));
        const missing = INITIAL_MONTHLY_SUMMARIES.filter((s) => !existingIds.has(s.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          saveSummariesToStorage(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading summaries from localStorage', e);
  }
  saveSummariesToStorage(INITIAL_MONTHLY_SUMMARIES);
  return INITIAL_MONTHLY_SUMMARIES;
}

export function saveSummariesToStorage(summaries: MonthlyDivisionSummary[]): void {
  try {
    localStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(summaries));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-storage-sync', { detail: { key: SUMMARIES_STORAGE_KEY } }));
    }
  } catch (e) {
    console.error('Error saving summaries to localStorage', e);
  }
}

export function resetToDefaults(): { tasks: WorkTask[]; summaries: MonthlyDivisionSummary[] } {
  localStorage.removeItem(TASKS_STORAGE_KEY);
  localStorage.removeItem(SUMMARIES_STORAGE_KEY);
  saveTasksToStorage(INITIAL_TASKS);
  saveSummariesToStorage(INITIAL_MONTHLY_SUMMARIES);
  return { tasks: INITIAL_TASKS, summaries: INITIAL_MONTHLY_SUMMARIES };
}
