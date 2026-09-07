import { WorkTask, MonthlyDivisionSummary, TaskStatus, DivisionId, UserRole, SharedUser } from '../types';
import { INITIAL_TASKS, INITIAL_MONTHLY_SUMMARIES } from '../data/initialData';

const TASKS_STORAGE_KEY = 'work_tracking_system_tasks_v2';
const SUMMARIES_STORAGE_KEY = 'work_tracking_system_summaries_v2';
export const USER_ROLE_STORAGE_KEY = 'work_tracking_system_role_v1';
export const SHARED_USERS_STORAGE_KEY = 'work_tracking_system_shared_users_v1';

export const DEFAULT_SHARED_USERS: SharedUser[] = [
  {
    id: 'user-1',
    name: 'อนุวัฒน์ (Anuwat R.)',
    email: 'anuwatr@nu.ac.th',
    role: 'editor',
    division: 'ผู้ดูแลระบบและทะเบียนงาน คณะโลจิสติกส์ฯ',
    addedAt: '2569-10-01',
  },
  {
    id: 'user-2',
    name: 'ผู้ประสานงาน งานธุรการ',
    email: 'admin.logistics@nu.ac.th',
    role: 'editor',
    division: 'งานธุรการ (1)',
    addedAt: '2569-10-01',
  },
  {
    id: 'user-3',
    name: 'ผู้ประสานงาน งานบริการการศึกษา',
    email: 'acad.logistics@nu.ac.th',
    role: 'editor',
    division: 'งานบริการการศึกษา (2)',
    addedAt: '2569-10-01',
  },
  {
    id: 'user-4',
    name: 'ผู้ประสานงาน งานวิจัยและพัฒนาคุณภาพการศึกษา',
    email: 'research.logistics@nu.ac.th',
    role: 'editor',
    division: 'งานวิจัยและพัฒนาคุณภาพการศึกษา (3)',
    addedAt: '2569-10-01',
  },
  {
    id: 'user-5',
    name: 'ผู้ประสานงาน งานการเงินและพัสดุ',
    email: 'finance.logistics@nu.ac.th',
    role: 'editor',
    division: 'งานการเงินและพัสดุ (4)',
    addedAt: '2569-10-01',
  },
];

export function loadTasksFromStorage(): WorkTask[] {
  try {
    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    if (data !== null) {
      const parsed: WorkTask[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    // Clean up old v1 storage key if present
    localStorage.removeItem('work_tracking_system_tasks_v1');
  } catch (e) {
    console.error('Error loading tasks from localStorage', e);
  }
  // Default to initial tasks when storage is empty or first run
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
    if (data !== null) {
      const parsed: MonthlyDivisionSummary[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
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

export function loadUserRole(): UserRole {
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get('role');
      if (urlRole === 'editor' || urlRole === 'viewer') {
        localStorage.setItem(USER_ROLE_STORAGE_KEY, urlRole);
        return urlRole;
      }
      const savedRole = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      if (savedRole === 'editor' || savedRole === 'viewer') {
        return savedRole;
      }
    } catch (e) {
      console.error('Error loading role from storage', e);
    }
  }
  // Default to editor so existing users and collaborators have full editing rights
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_ROLE_STORAGE_KEY, 'editor');
    } catch (e) {
      // ignore
    }
  }
  return 'editor';
}

export function saveUserRole(role: UserRole): void {
  try {
    localStorage.setItem(USER_ROLE_STORAGE_KEY, role);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-storage-sync', { detail: { key: USER_ROLE_STORAGE_KEY, role } }));
    }
  } catch (e) {
    console.error('Error saving user role to localStorage', e);
  }
}

export function loadSharedUsers(): SharedUser[] {
  try {
    const data = localStorage.getItem(SHARED_USERS_STORAGE_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading shared users from localStorage', e);
  }
  saveSharedUsers(DEFAULT_SHARED_USERS);
  return DEFAULT_SHARED_USERS;
}

export function saveSharedUsers(users: SharedUser[]): void {
  try {
    localStorage.setItem(SHARED_USERS_STORAGE_KEY, JSON.stringify(users));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-storage-sync', { detail: { key: SHARED_USERS_STORAGE_KEY } }));
    }
  } catch (e) {
    console.error('Error saving shared users to localStorage', e);
  }
}
