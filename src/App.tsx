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
import { 
  WorkTask, 
  MonthlyDivisionSummary, 
  DivisionId, 
  TaskStatus,
  DIVISIONS_DATA,
  FISCAL_MONTHS
} from './types';
import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  loadSummariesFromStorage, 
  saveSummariesToStorage, 
  resetToDefaults 
} from './utils/storage';
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

  // Initialize data on mount
  useEffect(() => {
    const loadedTasks = loadTasksFromStorage();
    const loadedSummaries = loadSummariesFromStorage();
    setTasks(loadedTasks);
    setSummaries(loadedSummaries);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Add / Edit Task
  const handleOpenAddTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: WorkTask) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (savedTask: WorkTask) => {
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
    const target = tasks.find((t) => t.id === taskId);
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveTasksToStorage(updated);
    showToast(`ลบรายการ "${target?.title || 'ภารกิจ'}" แล้ว`);
  };

  const handleQuickStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        let newProgress = t.progress;
        if (newStatus === 'completed') newProgress = 100;
        if (newStatus === 'not_started') newProgress = 0;
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
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างใช่หรือไม่?')) {
      const res = resetToDefaults();
      setTasks(res.tasks);
      setSummaries(res.summaries);
      showToast('รีเซ็ตข้อมูลระบบกลับเป็นข้อมูลเริ่มต้นเรียบร้อยแล้ว');
    }
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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1e293b] text-slate-100 border border-slate-700 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Official Header for Print Mode */}
      <div className="hidden print:block p-6 border-b border-slate-300 bg-white text-slate-900">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-slate-900">
            ระบบติดตามงาน (Work Tracking System)
          </h1>
          <h2 className="text-base font-semibold text-slate-700">
            ประจำปีงบประมาณ ตุลาคม 2569 – กันยายน 2570
          </h2>
          <p className="text-xs text-slate-500">
            ครอบคลุม 4 งานหลัก: 1. งานธุรการ, 2. งานบริการการศึกษา, 3. งานวิจัยและพัฒนาคุณภาพการศึกษา, 4. งานการเงินและพัสดุ
          </p>
        </div>
      </div>

      {/* Main App Navbar */}
      <div className="no-print">
        <Navbar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            if (tab === 'tasks') {
              setSelectedDivisionInitial('all');
            }
          }}
          onAddTask={handleOpenAddTask}
          onResetData={handleResetData}
          totalTasks={tasks.length}
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
            onAddTask={handleOpenAddTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onQuickStatusChange={handleQuickStatusChange}
            selectedDivisionInitial={selectedDivisionInitial}
          />
        )}

        {currentTab === 'monthly_report' && (
          <MonthlyReportView
            tasks={tasks}
            summaries={summaries}
            onSaveSummary={handleSaveSummary}
            selectedMonthId={selectedMonthForReport}
          />
        )}
      </main>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
      />

      {/* Footer */}
      <footer className="no-print bg-[#1e293b]/60 border-t border-slate-800 mt-12 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-200">ระบบติดตามงาน (Work Tracking System)</span>
            <span className="text-slate-500">• ปีงบประมาณ 2570 (ตุลาคม 2569 – กันยายน 2570)</span>
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
