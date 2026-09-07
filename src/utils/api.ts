import { WorkTask, MonthlyDivisionSummary, SharedUser } from '../types';
import {
  saveTasksToStorage,
  saveSummariesToStorage,
  saveSharedUsers,
  loadTasksFromStorage,
  loadSummariesFromStorage,
  loadSharedUsers,
} from './storage';

export interface ServerSyncData {
  tasks: WorkTask[];
  summaries: MonthlyDivisionSummary[];
  sharedUsers: SharedUser[];
  lastUpdated: string;
  isDefault?: boolean;
}

const HAS_EDITS_KEY = 'work_tracking_system_has_edits_v2';

/**
 * Fetch latest synchronized data from Express server API.
 * Falls back to localStorage if offline or during initial startup.
 * If server has default empty/initial data but client has real user edits,
 * it pushes client edits to the server so other users immediately see them.
 */
export async function fetchServerData(): Promise<ServerSyncData | null> {
  try {
    const res = await fetch('/api/data', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data: ServerSyncData = await res.json();
    if (data && Array.isArray(data.tasks)) {
      const hasLocalEdits = typeof window !== 'undefined' && localStorage.getItem(HAS_EDITS_KEY) === 'true';
      const localTasks = loadTasksFromStorage();

      // If server returned default initial data, but client has actual unsynced edits, upload client edits to server
      if (data.isDefault && hasLocalEdits && localTasks.length > 0) {
        console.info('Preserving user edits and synchronizing to server...');
        const saved = await syncSaveTasks(localTasks);
        if (saved && typeof window !== 'undefined') {
          localStorage.removeItem(HAS_EDITS_KEY);
        }
        return {
          ...data,
          tasks: localTasks,
          isDefault: false,
        };
      }

      // Authoritative server data update
      saveTasksToStorage(data.tasks);
      if (Array.isArray(data.summaries)) {
        saveSummariesToStorage(data.summaries);
      }
      if (Array.isArray(data.sharedUsers)) {
        saveSharedUsers(data.sharedUsers);
      }
      return data;
    }
  } catch (err) {
    console.warn('Unable to sync with server API, using local storage cache:', err);
  }
  return null;
}

/**
 * Persist tasks to server API and local storage
 */
export async function syncSaveTasks(tasks: WorkTask[]): Promise<boolean> {
  // Always update local storage immediately
  saveTasksToStorage(tasks);
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    });
    if (res.ok) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(HAS_EDITS_KEY);
      }
      return true;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(HAS_EDITS_KEY, 'true');
    }
    return false;
  } catch (err) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HAS_EDITS_KEY, 'true');
    }
    console.error('Failed to sync tasks to server:', err);
    return false;
  }
}

/**
 * Persist summaries to server API and local storage
 */
export async function syncSaveSummaries(summaries: MonthlyDivisionSummary[]): Promise<boolean> {
  // Always update local storage immediately
  saveSummariesToStorage(summaries);
  try {
    const res = await fetch('/api/summaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summaries }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to sync summaries to server:', err);
    return false;
  }
}

/**
 * Persist shared users to server API and local storage
 */
export async function syncSaveSharedUsers(sharedUsers: SharedUser[]): Promise<boolean> {
  saveSharedUsers(sharedUsers);
  try {
    const res = await fetch('/api/shared-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sharedUsers }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to sync shared users to server:', err);
    return false;
  }
}

/**
 * Reset all data to initial defaults on both server and local storage
 */
export async function syncResetData(): Promise<ServerSyncData | null> {
  try {
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const result = await res.json();
      if (result.data) {
        saveTasksToStorage(result.data.tasks);
        saveSummariesToStorage(result.data.summaries);
        saveSharedUsers(result.data.sharedUsers);
        return result.data;
      }
    }
  } catch (err) {
    console.error('Failed to reset on server:', err);
  }
  return null;
}
