/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TaskListView } from './components/TaskListView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { TaskModal } from './components/TaskModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CsvImportModal } from './components/CsvImportModal';
import { ShareModal } from './components/ShareModal';
import { 
  WorkTask, 
  MonthlyDivisionSummary, 
  DivisionId, 
  TaskStatus,
  UserRole,
  SharedUser,
  DIVISIONS_DATA,
  FISCAL_MONTHS
} from './types';
import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  loadSummariesFromStorage, 
  saveSummariesToStorage, 
  resetToDefaults,
  loadUserRole,
  saveUserRole,
  loadSharedUsers,
  saveSharedUsers,
  loadCurrentUserId,
  saveCurrentUserId
} from './utils/storage';
import { exportTasksToCSV } from './utils/exportCsv';
import { CheckCircle, AlertCircle, Building, Calendar, Layers } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [summaries, setSummaries] = useState<MonthlyDivisionSummary[]>([]);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'tasks' | 'monthly_report'>('dashboard');
  const [selectedDivisionInitial, setSelectedDivisionInitial] = useState<DivisionId | 'all'>('all');
  const [selectedMonthForReport, setSelectedMonthForReport] = useState<string>('2569-10');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<WorkTask | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isGlobalImportModalOpen, setIsGlobalImportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('editor');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [activeUser, setActiveUser] = useState<SharedUser | null>(null);

  // Initialize data on mount and process query parameters (?role=..., ?user=...)
  useEffect(() => {
    const loadedTasks = loadTasksFromStorage();
    const loadedSummaries = loadSummariesFromStorage();
    const users = loadSharedUsers();
    setTasks(loadedTasks);
    setSummaries(loadedSummaries);
    setSharedUsers(users);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      const userId = params.get('user');
      const email = params.get('email');

      let matchedUser: SharedUser | undefined;
      if (userId) {
        matchedUser = users.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
      } else if (email) {
        matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      }

      if (matchedUser) {
        setActiveUser(matchedUser);
        setCurrentRole(matchedUser.role);
        saveUserRole(matchedUser.role);
        saveCurrentUserId(matchedUser.id);
        showToast(`เข้าสู่ระบบ: คุณ${matchedUser.name} (${matchedUser.division}) • สิทธิ์ ${matchedUser.role === 'editor' ? 'Editor (ผู้แก้ไข)' : 'Viewer (ผู้เข้าชม)'}`);
      } else if (urlRole === 'editor' || urlRole === 'viewer') {
        setCurrentRole(urlRole);
        saveUserRole(urlRole);
        showToast(`เปิดระบบในสิทธิ์ "${urlRole === 'editor' ? 'Editor (ผู้ปฏิบัติงาน/แก้ไข)' : 'Viewer (ผู้เข้าชม/ดูอย่างเดียว)'}"`);
      } else {
        const savedRole = loadUserRole();
        setCurrentRole(savedRole);
        const savedUserId = loadCurrentUserId();
        if (savedUserId) {
          const user = users.find(u => u.id === savedUserId);
          if (user) setActiveUser(user);
        }
      }
    }
  }, []);

  const [filterResetCount, setFilterResetCount] = useState(0);

  // Sync state when localStorage changes in other tabs or through storage events
  useEffect(() => {
    const handleSync = () => {
      setTasks(loadTasksFromStorage());
      setSummaries(loadSummariesFromStorage());
      setCurrentRole(loadUserRole());
      setSharedUsers(loadSharedUsers());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('app-storage-sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('app-storage-sync', handleSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    saveUserRole(newRole);
  };

  const handleSaveSharedUsers = (updatedUsers: SharedUser[]) => {
    setSharedUsers(updatedUsers);
    saveSharedUsers(updatedUsers);
  };

  const [taskModalInitialDiv, setTaskModalInitialDiv] = useState<DivisionId | undefined>(undefined);
  const [taskModalInitialMonth, setTaskModalInitialMonth] = useState<string | undefined>(undefined);

  // Add / Edit Task
  const handleOpenAddTask = (initialDivId?: DivisionId, initialMonthId?: string) => {
    if (currentRole === 'viewer') {
      showToast('คุณอยู่ในสิทธิ์ "Viewer (ผู้เข้าชม)" ไม่สามารถเพิ่มภารกิจได้');
      setIsShareModalOpen(true);
      return;
    }
    setTaskModalInitialDiv(initialDivId);
    setTaskModalInitialMonth(initialMonthId);
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: WorkTask) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSyncAllData = () => {
    const latestTasks = loadTasksFromStorage();
    const latestSummaries = loadSummariesFromStorage();
    setTasks(latestTasks);
    setSummaries(latestSummaries);
    setSelectedDivisionInitial('all');
    setFilterResetCount((prev) => prev + 1);
    showToast(`ซิงค์ข้อมูลทะเบียนติดตามงานทั้งหมดเรียบร้อยแล้ว (${latestTasks.length} รายการ)`);
  };

  const handleSaveTask = (savedTask: WorkTask) => {
    if (currentRole === 'viewer') {
      showToast('ไม่สามารถบันทึกข้อมูลได้เนื่องจากคุณอยู่ในสิทธิ์ Viewer (อ่านอย่างเดียว)');
      return;
    }
    let updated: WorkTask[];
    const exists = tasks.some((t) => t.id === savedTask.id);
    if (exists) {
      updated = tasks.map((t) => (t.id === savedTask.id ? savedTask : t));
      showToast(`แก้ไขข้อมูล "${savedTask.title}" เรียบร้อยแล้ว`);
    } else {
      updated = [savedTask, ...tasks];
      showToast(`เพิ่มภารกิจใหม่ "${savedTask.title}" เรียบร้อยแล้ว`);
    }
    setTasks(updated);
    saveTasksToStorage(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    if (currentRole === 'viewer') {
      showToast('ไม่สามารถลบข้อมูลได้เนื่องจากคุณอยู่ในสิทธิ์ Viewer (อ่านอย่างเดียว)');
      return;
    }
    const target = tasks.find((t) => t.id === taskId);
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveTasksToStorage(updated);
    showToast(`ลบรายการ "${target?.title || 'ภารกิจ'}" แล้ว`);
  };

  const handleQuickStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (currentRole === 'viewer') {
      showToast('ไม่สามารถเปลี่ยนสถานะได้เนื่องจากคุณอยู่ในสิทธิ์ Viewer (อ่านอย่างเดียว)');
      return;
    }
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        let newProgress = t.progress;
        if (newStatus === 'completed') newProgress = 100;
        else if (newStatus === 'not_started') newProgress = 0;
        else if (newStatus === 'in_progress' && t.progress === 100) newProgress = 50;
        else if (newStatus === 'in_progress' && t.progress === 0) newProgress = 25;
        return {
          ...t,
          status: newStatus,
          progress: newProgress,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return t;
    });
    setTasks(updated);
    saveTasksToStorage(updated);
    showToast(`อัปเดตสถานะงานเรียบร้อยแล้ว`);
  };

  const handleSaveSummary = (summary: MonthlyDivisionSummary) => {
    if (currentRole === 'viewer') {
      showToast('ไม่สามารถบันทึกรายงานสรุปได้เนื่องจากคุณอยู่ในสิทธิ์ Viewer (อ่านอย่างเดียว)');
      return;
    }
    const existingIndex = summaries.findIndex(
      (s) => s.monthId === summary.monthId && s.divisionId === summary.divisionId
    );
    let updated: MonthlyDivisionSummary[];
    if (existingIndex >= 0) {
      updated = [...summaries];
      updated[existingIndex] = summary;
    } else {
      updated = [...summaries, summary];
    }
    setSummaries(updated);
    saveSummariesToStorage(updated);
    showToast(`บันทึกรายงานสรุปผลการดำเนินงานเรียบร้อยแล้ว`);
  };

  const handleResetData = () => {
    if (currentRole === 'viewer') {
      showToast('ไม่สามารถรีเซ็ตข้อมูลได้เนื่องจากคุณอยู่ในสิทธิ์ Viewer');
      return;
    }
    setIsConfirmResetOpen(true);
  };

  const handleImportTasks = (updatedTasks: WorkTask[], updatedCount: number, newCount: number) => {
    if (currentRole === 'viewer') {
      showToast('ไม่สามารถนำเข้าข้อมูลได้เนื่องจากคุณอยู่ในสิทธิ์ Viewer');
      return;
    }
    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks);
    showToast(`บันทึกข้อมูลจากไฟล์ CSV สำเร็จ: ปรับปรุง ${updatedCount} รายการ, เพิ่มใหม่ ${newCount} รายการ (รวม ${updatedTasks.length} รายการ)`);
  };

  const handleConfirmReset = () => {
    const res = resetToDefaults();
    setTasks(res.tasks);
    setSummaries(res.summaries);
    setIsConfirmResetOpen(false);
    showToast('รีเซ็ตข้อมูลระบบกลับเป็นข้อมูลเริ่มต้นเรียบร้อยแล้ว');
  };

  const handleExportAllTasksCSV = () => {
    if (tasks.length === 0) {
      showToast('ไม่มีข้อมูลภารกิจสำหรับส่งออก');
      return;
    }
    const result = exportTasksToCSV(tasks, 'ทะเบียนติดตามงาน_ทั้งหมด_คณะโลจิสติกส์_2570');
    showToast(`ส่งออกทะเบียนติดตามงาน (ทั้งหมด) จำนวน ${result.count} รายการ และบันทึกไฟล์สำเร็จ`);
  };

  // Navigation callbacks from Dashboard
  const handleSelectDivisionFromDashboard = (divId: DivisionId) => {
    setSelectedDivisionInitial(divId);
    setCurrentTab('tasks');
  };

  const handleSelectMonthFromDashboard = (monthId: string) => {
    setSelectedMonthForReport(monthId);
    setCurrentTab('monthly_report');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1e293b] text-slate-100 border border-slate-700 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Official Header for Print Mode */}
      <div className="hidden print:block p-6 border-b border-slate-300 bg-white text-slate-900">
        <div className="flex items-center justify-center gap-4 mb-3">
          <img
            src="/logo-Nu-logistics-01.png"
            alt="ตราสัญลักษณ์ คณะโลจิสติกส์และดิจิทัลซัพพลายเชน มหาวิทยาลัยนเรศวร"
            className="h-16 w-auto object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-0.5 text-left">
            <h1 className="text-xl font-bold text-slate-900">
              ระบบติดตามงาน (Work Tracking System)
            </h1>
            <h2 className="text-sm font-semibold text-slate-700">
              คณะโลจิสติกส์และดิจิทัลซัพพลายเชน มหาวิทยาลัยนเรศวร • ประจำปีงบประมาณ ตุลาคม 2569 – กันยายน 2570
            </h2>
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center">
          ครอบคลุม 4 งานหลัก: 1. งานธุรการ, 2. งานบริการการศึกษา, 3. งานวิจัยและพัฒนาคุณภาพการศึกษา, 4. งานการเงินและพัสดุ
        </p>
      </div>

      {/* Main App Navbar */}
      <div className="no-print">
        <Navbar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            if (tab === 'tasks') {
              setSelectedDivisionInitial('all');
              setFilterResetCount((prev) => prev + 1);
            }
          }}
          onAddTask={handleOpenAddTask}
          onResetData={handleResetData}
          onExportCSV={handleExportAllTasksCSV}
          onImportCSV={() => setIsGlobalImportModalOpen(true)}
          totalTasks={tasks.length}
          currentRole={currentRole}
          activeUser={activeUser}
          onOpenShare={() => setIsShareModalOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            tasks={tasks}
            onSelectDivision={handleSelectDivisionFromDashboard}
            onSelectMonth={handleSelectMonthFromDashboard}
            onEditTask={handleOpenEditTask}
            onViewAllTasks={() => {
              setSelectedDivisionInitial('all');
              setFilterResetCount((prev) => prev + 1);
              setCurrentTab('tasks');
            }}
            onViewMonthlyReport={(monthId) => {
              setSelectedMonthForReport(monthId);
              setCurrentTab('monthly_report');
            }}
          />
        )}

        {currentTab === 'tasks' && (
          <TaskListView
            tasks={tasks}
            summaries={summaries}
            onSaveSummary={handleSaveSummary}
            onViewMonthlyReport={handleSelectMonthFromDashboard}
            onAddTask={handleOpenAddTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onQuickStatusChange={handleQuickStatusChange}
            selectedDivisionInitial={selectedDivisionInitial}
            resetFilterSignal={filterResetCount}
            onSyncData={handleSyncAllData}
            onShowToast={showToast}
            onSaveImportedTasks={handleImportTasks}
            currentRole={currentRole}
            onOpenShare={() => setIsShareModalOpen(true)}
          />
        )}

        {currentTab === 'monthly_report' && (
          <MonthlyReportView
            tasks={tasks}
            summaries={summaries}
            onSaveSummary={handleSaveSummary}
            onEditTask={handleOpenEditTask}
            onQuickStatusChange={handleQuickStatusChange}
            onAddTask={(divId, mId) => handleOpenAddTask(divId, mId)}
            onShowToast={showToast}
            selectedMonthId={selectedMonthForReport}
            currentRole={currentRole}
          />
        )}
      </main>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
          setTaskModalInitialDiv(undefined);
          setTaskModalInitialMonth(undefined);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        taskToEdit={taskToEdit}
        isReadOnly={currentRole === 'viewer'}
        initialDivisionId={taskModalInitialDiv}
        initialMonthId={taskModalInitialMonth}
      />

      {/* Reset System Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        onClose={() => setIsConfirmResetOpen(false)}
        onConfirm={handleConfirmReset}
        title="รีเซ็ตข้อมูลระบบกลับเป็นค่าเริ่มต้น"
        message="คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างใช่หรือไม่? ข้อมูลงานที่สร้างหรือแก้ไขใหม่จะถูกเขียนทับด้วยข้อมูลเริ่มต้นของคณะฯ"
        confirmLabel="ยืนยันการรีเซ็ตข้อมูล"
        cancelLabel="ยกเลิก"
        variant="danger"
      />

      {/* Global CSV Import Modal */}
      <CsvImportModal
        isOpen={isGlobalImportModalOpen}
        onClose={() => setIsGlobalImportModalOpen(false)}
        currentTasks={tasks}
        onSaveTasks={handleImportTasks}
      />

      {/* Share / Role Permission Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        sharedUsers={sharedUsers}
        onSaveSharedUsers={handleSaveSharedUsers}
        onShowToast={showToast}
      />

      {/* Footer */}
      <footer className="no-print bg-[#1e293b]/60 border-t border-slate-800 mt-12 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-Nu-logistics-01.png"
              alt="ตราสัญลักษณ์ คณะโลจิสติกส์และดิจิทัลซัพพลายเชน มหาวิทยาลัยนเรศวร"
              className="h-6 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="font-semibold text-slate-200">คณะโลจิสติกส์และดิจิทัลซัพพลายเชน มหาวิทยาลัยนเรศวร</span>
            <span className="text-slate-500">• ระบบติดตามงาน ปีงบประมาณ 2570 (ตุลาคม 2569 – กันยายน 2570)</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
            <span>1. งานธุรการ (4 หน่วย)</span>
            <span>2. งานบริการการศึกษา (4 หน่วย)</span>
            <span>3. งานวิจัยและพัฒนาคุณภาพการศึกษา (3 หน่วย)</span>
            <span>4. งานการเงินและพัสดุ (3 หน่วย)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
