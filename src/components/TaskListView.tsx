import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  WorkTask, 
  TaskStatus, 
  DivisionId, 
  DIVISIONS_DATA, 
  FISCAL_MONTHS, 
  STATUS_CONFIG,
  UserRole,
  MonthlyDivisionSummary
} from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  LayoutGrid,
  List,
  Calendar,
  User,
  SlidersHorizontal,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Upload,
  ShieldAlert,
  Share2,
  Zap,
  Building2,
  TrendingUp,
  Save,
  ArrowUpRight,
  Sparkles,
  Check
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { CsvImportModal } from './CsvImportModal';
import { exportTasksToCSV } from '../utils/exportCsv';
import { compileSummaryFromTasks, buildSyncedSummary } from '../utils/summarySync';

interface TaskListViewProps {
  tasks: WorkTask[];
  summaries?: MonthlyDivisionSummary[];
  onSaveSummary?: (summary: MonthlyDivisionSummary) => void;
  onViewMonthlyReport?: (monthId: string) => void;
  onAddTask: () => void;
  onEditTask: (task: WorkTask) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  selectedDivisionInitial?: DivisionId | 'all';
  resetFilterSignal?: number;
  onSyncData?: () => void;
  onShowToast?: (msg: string) => void;
  onSaveImportedTasks?: (updatedTasks: WorkTask[], updatedCount: number, newCount: number) => void;
  currentRole?: UserRole;
  onOpenShare?: () => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  summaries = [],
  onSaveSummary,
  onViewMonthlyReport,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onQuickStatusChange,
  selectedDivisionInitial = 'all',
  resetFilterSignal,
  onSyncData,
  onShowToast,
  onSaveImportedTasks,
  currentRole = 'editor',
  onOpenShare,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(selectedDivisionInitial);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [inspectTaskId, setInspectTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<WorkTask | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Synchronize division if prop changes from parent (e.g. from Dashboard or Navbar)
  useEffect(() => {
    setSelectedDivision(selectedDivisionInitial);
    setSelectedUnit('all');
  }, [selectedDivisionInitial]);

  // Synchronize and reset all filters when resetFilterSignal is triggered (e.g. clicking 'ทะเบียนติดตามงาน (ทั้งหมด)')
  useEffect(() => {
    if (resetFilterSignal !== undefined && resetFilterSignal > 0) {
      setSelectedMonth('all');
      setSelectedDivision('all');
      setSelectedUnit('all');
      setSelectedStatus('all');
      setSearchQuery('');
    }
  }, [resetFilterSignal]);

  // Dynamically derive inspected task so changes from editing/saving are always live
  const inspectTask = useMemo(() => {
    return tasks.find((t) => t.id === inspectTaskId) || null;
  }, [tasks, inspectTaskId]);

  // Monthly Summary Sync state & variables
  const [isSummaryWidgetOpen, setIsSummaryWidgetOpen] = useState(true);
  const [summaryDivisionTab, setSummaryDivisionTab] = useState<DivisionId>('admin');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryEditForm, setSummaryEditForm] = useState({
    summaryText: '',
    achievements: '',
    obstacles: '',
    nextPlan: '',
    reporter: ''
  });

  // Active month & division for monthly summary widget
  const activeSummaryMonthId = selectedMonth !== 'all' ? selectedMonth : '2569-10';
  const activeSummaryDivId: DivisionId = selectedDivision !== 'all' ? selectedDivision : summaryDivisionTab;

  const activeSummaryMonthInfo = useMemo(() => {
    return FISCAL_MONTHS.find(m => m.id === activeSummaryMonthId) || FISCAL_MONTHS[0];
  }, [activeSummaryMonthId]);

  const activeSummaryDivInfo = useMemo(() => {
    return DIVISIONS_DATA.find(d => d.id === activeSummaryDivId) || DIVISIONS_DATA[0];
  }, [activeSummaryDivId]);

  // Tasks in task register that belong to active summary month and division
  const summaryMatchingTasks = useMemo(() => {
    return tasks.filter(t => t.monthId === activeSummaryMonthId && t.divisionId === activeSummaryDivId);
  }, [tasks, activeSummaryMonthId, activeSummaryDivId]);

  const summaryStats = useMemo(() => {
    const total = summaryMatchingTasks.length;
    const completed = summaryMatchingTasks.filter(t => t.status === 'completed').length;
    const inProgress = summaryMatchingTasks.filter(t => t.status === 'in_progress').length;
    const delayed = summaryMatchingTasks.filter(t => t.status === 'delayed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, delayed, rate };
  }, [summaryMatchingTasks]);

  // Current saved monthly summary
  const activeSavedSummary = useMemo(() => {
    return summaries.find(s => s.monthId === activeSummaryMonthId && s.divisionId === activeSummaryDivId);
  }, [summaries, activeSummaryMonthId, activeSummaryDivId]);

  // 1-Click Sync Summary from Tasks in Register
  const handleSyncSummaryForActiveDivision = () => {
    if (!onSaveSummary) return;
    const synced = buildSyncedSummary(activeSummaryMonthId, activeSummaryDivId, tasks, activeSavedSummary);
    onSaveSummary(synced);
    onShowToast?.(`ซิงค์สรุปผลงาน "${activeSummaryDivInfo.name}" ประจำเดือน "${activeSummaryMonthInfo.label}" จากทะเบียนงานเรียบร้อยแล้ว (${summaryMatchingTasks.length} รายการ)`);
  };

  const handleStartEditSummary = () => {
    setSummaryEditForm({
      summaryText: activeSavedSummary?.summaryText || '',
      achievements: activeSavedSummary?.achievements || '',
      obstacles: activeSavedSummary?.obstacles || '',
      nextPlan: activeSavedSummary?.nextPlan || '',
      reporter: activeSavedSummary?.reporter || `หัวหน้า${activeSummaryDivInfo.name}`
    });
    setIsEditingSummary(true);
  };

  const handleAutoFillSummaryModal = () => {
    const compiled = compileSummaryFromTasks(activeSummaryMonthId, activeSummaryDivId, tasks, activeSavedSummary);
    setSummaryEditForm(prev => ({
      ...prev,
      summaryText: compiled.summaryText,
      achievements: compiled.achievements,
      obstacles: compiled.obstacles,
      nextPlan: compiled.nextPlan
    }));
    onShowToast?.('ดึงข้อมูลความก้าวหน้าและผลลัพธ์จากทะเบียนงานลงในฟอร์มเรียบร้อยแล้ว');
  };

  const handleSaveSummaryEdit = () => {
    if (!onSaveSummary) return;
    const updated: MonthlyDivisionSummary = {
      id: activeSavedSummary?.id || `sum-${activeSummaryMonthId}-${activeSummaryDivId}`,
      monthId: activeSummaryMonthId,
      divisionId: activeSummaryDivId,
      summaryText: summaryEditForm.summaryText,
      achievements: summaryEditForm.achievements,
      obstacles: summaryEditForm.obstacles,
      nextPlan: summaryEditForm.nextPlan,
      reporter: summaryEditForm.reporter,
      reportedDate: new Date().toISOString().split('T')[0]
    };
    onSaveSummary(updated);
    setIsEditingSummary(false);
    onShowToast?.('บันทึกรายงานสรุปผลการดำเนินงานเรียบร้อยแล้ว');
  };

  // When division changes, reset unit if not matching
  const handleDivisionChange = (divId: DivisionId | 'all') => {
    setSelectedDivision(divId);
    setSelectedUnit('all');
  };

  // Available units based on selected division
  const availableUnits = useMemo(() => {
    if (selectedDivision === 'all') {
      return DIVISIONS_DATA.flatMap((d) => d.units);
    }
    const div = DIVISIONS_DATA.find((d) => d.id === selectedDivision);
    return div ? div.units : [];
  }, [selectedDivision]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Month
      if (selectedMonth !== 'all' && t.monthId !== selectedMonth) return false;
      // Division
      if (selectedDivision !== 'all' && t.divisionId !== selectedDivision) return false;
      // Unit
      if (selectedUnit !== 'all' && t.unitId !== selectedUnit) return false;
      // Status
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      // Search
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const titleMatch = t.title.toLowerCase().includes(query);
        const assigneeMatch = t.assignee.toLowerCase().includes(query);
        const descMatch = t.description?.toLowerCase().includes(query);
        const outputMatch = t.output?.toLowerCase().includes(query);
        if (!titleMatch && !assigneeMatch && !descMatch && !outputMatch) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedMonth, selectedDivision, selectedUnit, selectedStatus, searchQuery]);

  // Export CSV functions
  const handleExportAllTasks = () => {
    if (tasks.length === 0) {
      onShowToast?.('ไม่มีข้อมูลภารกิจสำหรับส่งออก');
      setIsExportMenuOpen(false);
      return;
    }
    const result = exportTasksToCSV(tasks, 'ทะเบียนติดตามงาน_ทั้งหมด_คณะโลจิสติกส์_2570');
    onShowToast?.(`ส่งออกทะเบียนติดตามงาน (ทั้งหมด) จำนวน ${result.count} รายการ และบันทึกไฟล์สำเร็จ`);
    setIsExportMenuOpen(false);
  };

  const handleExportFilteredTasks = () => {
    if (filteredTasks.length === 0) {
      onShowToast?.('ไม่มีรายการที่ตรงตามเงื่อนไขตัวกรองสำหรับส่งออก');
      setIsExportMenuOpen(false);
      return;
    }
    const divName = selectedDivision !== 'all' ? DIVISIONS_DATA.find((d) => d.id === selectedDivision)?.name : '';
    const monthLabel = selectedMonth !== 'all' ? FISCAL_MONTHS.find((m) => m.id === selectedMonth)?.label : '';
    const prefixParts = [
      'ทะเบียนติดตามงาน',
      divName,
      monthLabel,
      selectedStatus !== 'all' ? STATUS_CONFIG[selectedStatus]?.label : '',
      'ที่กรองแล้ว'
    ].filter(Boolean);
    const result = exportTasksToCSV(filteredTasks, prefixParts.join('_') || 'ทะเบียนติดตามงาน_ที่กรองแล้ว');
    onShowToast?.(`ส่งออกรายการที่กรองแล้ว จำนวน ${result.count} รายการ และบันทึกไฟล์สำเร็จ`);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Controls */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              ทะเบียนติดตามงาน (Work Items Register)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              รายการภารกิจและโครงการทั้งหมด ประจำปีงบประมาณ 2570
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onSyncData && (
              <button
                onClick={onSyncData}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-sky-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-sky-200 transition-colors shadow-xs cursor-pointer"
                title="ซิงค์และรีเฟรชข้อมูลภารกิจทั้งหมด"
              >
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>ซิงค์ข้อมูล</span>
              </button>
            )}

            {/* Export CSV Menu with direct link to all tasks register */}
            <div className="relative" ref={exportMenuRef}>
              <button
                id="export-csv-btn"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-sky-300 transition-colors shadow-xs cursor-pointer"
                title="ส่งออกหรือนำเข้าข้อมูลทะเบียนติดตามงานเป็นไฟล์ Excel / CSV"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>จัดการ CSV</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isExportMenuOpen ? 'rotate-180 text-sky-400' : ''}`} />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-xs text-slate-400 font-semibold border-b border-slate-800 flex items-center justify-between">
                    <span>จัดการข้อมูล Excel / CSV</span>
                    <span className="text-[11px] text-sky-400 font-normal">UTF-8 ภาษาไทย</span>
                  </div>

                  <div className="py-1 space-y-1">
                    {/* Export All Tasks in Register */}
                    <button
                      id="export-all-tasks-option"
                      onClick={handleExportAllTasks}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-start gap-2.5 group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 mt-0.5 shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-sky-300 flex items-center justify-between">
                          <span>ส่งออกทะเบียนงาน (ทั้งหมด)</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold ml-1">
                            {tasks.length} งาน
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          บันทึกไฟล์ CSV ฐานข้อมูลภารกิจทั้งหมดในทะเบียน 4 งานหลัก 14 หน่วยงาน
                        </p>
                      </div>
                    </button>

                    {/* Export Filtered Tasks */}
                    <button
                      id="export-filtered-tasks-option"
                      onClick={handleExportFilteredTasks}
                      disabled={filteredTasks.length === 0}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2.5 group cursor-pointer ${
                        filteredTasks.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'
                      }`}
                    >
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 mt-0.5 shrink-0">
                        <Filter className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-emerald-300 flex items-center justify-between">
                          <span>ส่งออกเฉพาะที่กรองไว้</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold ml-1">
                            {filteredTasks.length} งาน
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {selectedDivision !== 'all' || selectedMonth !== 'all' || selectedStatus !== 'all' || searchQuery.trim() !== ''
                            ? 'บันทึกไฟล์ CSV เฉพาะรายการที่ตรงตามเงื่อนไขตัวกรอง'
                            : 'ตรงกับข้อมูลทั้งหมด (ยังไม่มีการกรอง)'}
                        </p>
                      </div>
                    </button>

                    {/* Import / Save Updated CSV (Editor Only) */}
                    {currentRole === 'editor' && onSaveImportedTasks && (
                      <div className="pt-1 mt-1 border-t border-slate-800">
                        <button
                          id="import-updated-csv-option"
                          onClick={() => {
                            setIsExportMenuOpen(false);
                            setIsImportModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-start gap-2.5 group cursor-pointer"
                        >
                          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 mt-0.5 shrink-0">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-indigo-300 flex items-center justify-between">
                              <span>นำเข้า/บันทึกไฟล์ที่ปรับปรุงแล้ว</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-indigo-500/20 text-indigo-300">
                                Import
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              อัปโหลดและบันทึกไฟล์ CSV ที่แก้ไขแล้วกลับคืนสู่ระบบ
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {currentRole === 'editor' ? (
              <button
                id="task-list-add-task-btn"
                onClick={onAddTask}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-100 bg-sky-500 rounded-lg hover:bg-sky-400 active:bg-sky-600 transition-colors shadow-md shadow-sky-500/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มงานใหม่</span>
              </button>
            ) : (
              <button
                id="task-list-viewer-mode-btn"
                onClick={onOpenShare}
                title="สิทธิ์ Viewer: ดูข้อมูลอย่างเดียว (คลิกเพื่อขอสิทธิ์หรือสลับเป็น Editor)"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">สิทธิ์: ดูอย่างเดียว (Viewer)</span>
              </button>
            )}
          </div>
        </div>

            {/* Viewer Role Alert Banner */}
            {currentRole === 'viewer' && (
              <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-sky-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    กำลังดูข้อมูลในสิทธิ์ <strong>Viewer (ผู้เข้าชม)</strong> — สามารถตรวจสอบ ค้นหา และส่งออกข้อมูลได้ (ปุ่มแก้ไขและลบถูกปิดใช้งาน)
                  </span>
                </div>
                {onOpenShare && (
                  <button
                    onClick={onOpenShare}
                    className="px-2.5 py-1 bg-sky-600/80 hover:bg-sky-500 text-white rounded-lg font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>แชร์ลิงก์ดูข้อมูล</span>
                  </button>
                )}
              </div>
            )}

            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-700/60">
              {/* Keyword Search */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นชื่องาน, ผู้รับผิดชอบ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Month Select */}
              <div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">📅 ประจำเดือน: ทุกเดือน</option>
                  {FISCAL_MONTHS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Division Select */}
              <div>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value as DivisionId | 'all')}
                  className="w-full py-1.5 px-2.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">🏢 งานหลัก: ทั้งหมด 4 งาน</option>
                  {DIVISIONS_DATA.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code}. {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Select */}
              <div>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">📂 หน่วยงานย่อย: ทั้งหมด</option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | 'all')}
                  className="w-full py-1.5 px-2.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">🚦 สถานะ: ทั้งหมด</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="in_progress">กำลังดำเนินการ</option>
                  <option value="pending_review">รอตรวจ/รออนุมัติ</option>
                  <option value="delayed">ล่าช้ากว่ากำหนด</option>
                  <option value="not_started">ยังไม่เริ่ม</option>
                </select>
              </div>
            </div>

            {/* Monthly Division Summary Synced Widget */}
            <div className="bg-[#1e293b]/90 border border-slate-700/90 rounded-xl overflow-hidden shadow-sm transition-all mt-3">
              {/* Header of the Summary Widget */}
              <div className="bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 p-3.5 sm:p-4 border-b border-slate-700/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-1.5">
                        <span>สรุปผลการดำเนินงานประจำเดือน:</span>
                        <span className="text-sky-400">{activeSummaryDivInfo.name}</span>
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        {activeSummaryMonthInfo.label} (ไตรมาส {activeSummaryMonthInfo.quarter})
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        ซิงค์กับทะเบียนติดตามงาน
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ประมวลผลสรุปภาพรวม ผลงานเด่น และปัญหาอุปสรรคจากภารกิจในทะเบียนงาน ({summaryMatchingTasks.length} รายการ)
                    </p>
                  </div>
                </div>

                {/* Actions for Summary Widget */}
                <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                  {/* 1-Click Sync Button (Editor only) */}
                  {currentRole === 'editor' && onSaveSummary && (
                    <button
                      onClick={handleSyncSummaryForActiveDivision}
                      title="ประมวลผลดึงผลลัพธ์และอุปสรรคจากภารกิจในทะเบียนงานลงในสรุปผลงานทันที"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ซิงค์สรุปผลงานจากภารกิจนี้</span>
                    </button>
                  )}

                  {/* Edit Summary Button (Editor only) */}
                  {currentRole === 'editor' && onSaveSummary && (
                    <button
                      onClick={handleStartEditSummary}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span>แก้ไขบทสรุป</span>
                    </button>
                  )}

                  {/* View Full Monthly Report Button */}
                  {onViewMonthlyReport && (
                    <button
                      onClick={() => onViewMonthlyReport(activeSummaryMonthId)}
                      title="เปิดดูรายงานสรุปผลการดำเนินงานประจำเดือนฉบับเต็มทั้ง 4 งาน"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ดูรายงานประจำเดือนฉบับเต็ม</span>
                    </button>
                  )}

                  {/* Collapse / Expand Toggle */}
                  <button
                    onClick={() => setIsSummaryWidgetOpen(!isSummaryWidgetOpen)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title={isSummaryWidgetOpen ? 'ย่อแผงสรุปผล' : 'ขยายแผงสรุปผล'}
                  >
                    {isSummaryWidgetOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Division Selector Tabs if user hasn't filtered to a single division */}
              {isSummaryWidgetOpen && selectedDivision === 'all' && (
                <div className="flex border-b border-slate-700/60 bg-slate-900/40 px-3 pt-2 gap-1 overflow-x-auto">
                  {DIVISIONS_DATA.map((div) => {
                    const isTabActive = summaryDivisionTab === div.id;
                    const tabTaskCount = tasks.filter(t => t.monthId === activeSummaryMonthId && t.divisionId === div.id).length;
                    return (
                      <button
                        key={div.id}
                        onClick={() => setSummaryDivisionTab(div.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 border-b-2 ${
                          isTabActive
                            ? 'border-sky-400 text-sky-300 bg-slate-800/80 font-bold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <span>{div.code}. {div.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300">
                          {tabTaskCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Expanded Summary Body */}
              {isSummaryWidgetOpen && (
                <div className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm animate-in fade-in duration-150">
                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
                    <div className="p-1.5">
                      <div className="text-base sm:text-lg font-bold text-slate-100">{summaryStats.total} งาน</div>
                      <div className="text-[11px] text-slate-400">ภารกิจในทะเบียน</div>
                    </div>
                    <div className="p-1.5">
                      <div className="text-base sm:text-lg font-bold text-emerald-400">{summaryStats.completed} งาน ({summaryStats.rate}%)</div>
                      <div className="text-[11px] text-slate-400">บรรลุเป้าหมาย</div>
                    </div>
                    <div className="p-1.5">
                      <div className="text-base sm:text-lg font-bold text-sky-400">{summaryStats.inProgress} งาน</div>
                      <div className="text-[11px] text-slate-400">กำลังดำเนินการ</div>
                    </div>
                    <div className="p-1.5">
                      <div className="text-base sm:text-lg font-bold text-rose-400">{summaryStats.delayed} งาน</div>
                      <div className="text-[11px] text-slate-400">ล่าช้ากว่ากำหนด</div>
                    </div>
                  </div>

                  {/* Narrative Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* 1. สรุปภาพรวม */}
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
                      <div className="font-semibold text-slate-300 text-xs flex items-center gap-1.5 mb-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>สรุปผลการดำเนินงานภาพรวม</span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line">
                        {activeSavedSummary?.summaryText || (
                          <span className="text-slate-500 italic">
                            ยังไม่มีบทสรุปผลการดำเนินงาน คลิกปุ่ม "ซิงค์สรุปผลงานจากภารกิจนี้" เพื่อประมวลผลอัตโนมัติ
                          </span>
                        )}
                      </p>
                    </div>

                    {/* 2. ผลงานสำคัญ / ความสำเร็จเด่น */}
                    <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/30">
                      <div className="font-semibold text-emerald-400 text-xs flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ผลงานสำคัญ / ความสำเร็จเด่น</span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line">
                        {activeSavedSummary?.achievements || (
                          <span className="text-slate-500 italic">
                            ยังไม่ได้ระบุผลงานเด่น (ระบบสามารถรวบรวมจากผลสัมฤทธิ์ของภารกิจที่เสร็จสิ้นอัตโนมัติ)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* 3. ปัญหา อุปสรรค */}
                    <div className="bg-[#451b16]/20 p-3 rounded-lg border border-rose-500/20">
                      <div className="font-semibold text-rose-400 text-xs flex items-center gap-1.5 mb-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>ปัญหา อุปสรรค และแนวทางแก้ไข</span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line">
                        {activeSavedSummary?.obstacles || (
                          <span className="text-slate-500 italic">
                            ไม่มีปัญหาหรืออุปสรรคที่ต้องรายงาน
                          </span>
                        )}
                      </p>
                    </div>

                    {/* 4. แผนงานเดือนถัดไป */}
                    <div className="bg-sky-950/20 p-3 rounded-lg border border-sky-500/30">
                      <div className="font-semibold text-sky-400 text-xs flex items-center gap-1.5 mb-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                        <span>แผนงานสำคัญเดือนถัดไป (Next Steps)</span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line">
                        {activeSavedSummary?.nextPlan || (
                          <span className="text-slate-500 italic">
                            ยังไม่ได้ระบุแผนงานเดือนถัดไป
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {activeSavedSummary?.reportedDate && (
                    <div className="text-[11px] text-slate-400 text-right pt-1">
                      รายงานโดย: {activeSavedSummary.reporter || '-'} • วันที่บันทึก: {activeSavedSummary.reportedDate}
                    </div>
                  )}
                </div>
              )}
            </div>

        {/* Active Filter Notice Banner if any filter is applied */}
        {(selectedMonth !== 'all' || selectedDivision !== 'all' || selectedUnit !== 'all' || selectedStatus !== 'all' || searchQuery.trim() !== '') && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-sky-950/40 border border-sky-500/30 px-3.5 py-2 rounded-lg text-xs text-sky-200">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                กำลังแสดงผลตามตัวกรอง: <strong>{filteredTasks.length}</strong> จากทั้งหมด <strong>{tasks.length}</strong> งาน
                {selectedDivision !== 'all' && ` • ${DIVISIONS_DATA.find(d => d.id === selectedDivision)?.name}`}
                {selectedMonth !== 'all' && ` • ${FISCAL_MONTHS.find(m => m.id === selectedMonth)?.label}`}
                {selectedStatus !== 'all' && ` • ${STATUS_CONFIG[selectedStatus]?.label}`}
                {searchQuery.trim() && ` • "${searchQuery}"`}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedMonth('all');
                setSelectedDivision('all');
                setSelectedUnit('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>แสดงข้อมูลทั้งหมด ({tasks.length} งาน)</span>
            </button>
          </div>
        )}

        {/* Filter Summary & View Mode Switcher */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div>
            พบภารกิจ <span className="font-semibold text-slate-200">{filteredTasks.length}</span> จากทั้งหมด <span className="font-semibold text-slate-200">{tasks.length}</span> รายการ
            {(selectedMonth !== 'all' || selectedDivision !== 'all' || selectedStatus !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedMonth('all');
                  setSelectedDivision('all');
                  setSelectedUnit('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
                className="ml-2 text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>ล้างตัวกรองทั้งหมด</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1 border border-slate-700 rounded-lg p-0.5 bg-slate-800">
            <button
              onClick={() => setViewMode('table')}
              title="มุมมองตาราง"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-700 text-sky-400 font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="มุมมองการ์ด"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-slate-700 text-sky-400 font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Task List Content */}
      {filteredTasks.length === 0 ? (
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-12 text-center shadow-sm">
          <SlidersHorizontal className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">ไม่พบข้อมูลภารกิจตามเงื่อนไขที่ค้นหา</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกตัวกรองเดือน/งานหลักใหม่ หรือคลิกปุ่มด้านล่างเพื่อเพิ่มภารกิจใหม่
          </p>
          <button
            onClick={onAddTask}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-100 bg-sky-500 rounded-lg hover:bg-sky-400 shadow-md shadow-sky-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มงานใหม่ในหมวดนี้</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold text-xs border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3">ชื่องาน / กิจกรรม</th>
                  <th className="px-3 py-3">งาน / หน่วยงาน</th>
                  <th className="px-3 py-3">ประจำเดือน</th>
                  <th className="px-3 py-3">ผู้รับผิดชอบ</th>
                  <th className="px-3 py-3">ความก้าวหน้า</th>
                  <th className="px-3 py-3">สถานะการดำเนินงาน</th>
                  <th className="px-3 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredTasks.map((task, idx) => {
                  const div = DIVISIONS_DATA.find((d) => d.id === task.divisionId);
                  const unit = div?.units.find((u) => u.id === task.unitId);
                  const month = FISCAL_MONTHS.find((m) => m.id === task.monthId);
                  const statusConf = STATUS_CONFIG[task.status];

                  return (
                    <tr key={task.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-500 font-medium text-xs">
                        {idx + 1}
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 max-w-xs sm:max-w-md">
                        <div 
                          className="font-semibold text-slate-100 hover:text-sky-400 cursor-pointer transition-colors"
                          onClick={() => setInspectTaskId(task.id)}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                        {task.issues && (
                          <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span className="truncate">ปัญหา: {task.issues}</span>
                          </div>
                        )}
                      </td>

                      {/* Division & Unit */}
                      <td className="px-3 py-3 text-xs whitespace-nowrap">
                        <div className="font-medium text-slate-200">{unit?.name || '-'}</div>
                        <div className="text-[11px] text-slate-500">{div?.name}</div>
                      </td>

                      {/* Month */}
                      <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-300">
                        {month?.label || task.monthId}
                      </td>

                      {/* Assignee */}
                      <td className="px-3 py-3 text-xs whitespace-nowrap font-medium text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{task.assignee}</span>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                task.status === 'completed' ? 'bg-[#2e9369]' :
                                task.status === 'delayed' ? 'bg-[#e57373]' :
                                task.status === 'pending_review' ? 'bg-[#c5a059]' :
                                task.status === 'in_progress' ? 'bg-[#6b8fae]' : 'bg-slate-500'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-300">{task.progress}%</span>
                        </div>
                      </td>

                      {/* Status Dropdown Quick Change (Editor) or Badge (Viewer) */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {currentRole === 'editor' ? (
                          <select
                            value={task.status}
                            onChange={(e) => onQuickStatusChange(task.id, e.target.value as TaskStatus)}
                            className={`text-xs font-semibold rounded-lg px-2 py-1 border cursor-pointer ${statusConf.badgeClass} focus:outline-hidden bg-slate-800`}
                          >
                            <option value="completed">✓ เสร็จสิ้น</option>
                            <option value="in_progress">▶ กำลังดำเนินการ</option>
                            <option value="pending_review">⏳ รอตรวจ/รออนุมัติ</option>
                            <option value="delayed">⚠️ ล่าช้ากว่ากำหนด</option>
                            <option value="not_started">○ ยังไม่เริ่ม</option>
                          </select>
                        ) : (
                          <span className={`inline-flex text-xs font-semibold rounded-lg px-2.5 py-1 border ${statusConf.badgeClass}`}>
                            {statusConf.label}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setInspectTaskId(task.id)}
                            title="ดูรายละเอียดงาน"
                            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {currentRole === 'editor' && (
                            <>
                              <button
                                onClick={() => onEditTask(task)}
                                title="แก้ไขข้อมูลงาน"
                                className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setTaskToDelete(task)}
                                title="ลบภารกิจ"
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const div = DIVISIONS_DATA.find((d) => d.id === task.divisionId);
            const unit = div?.units.find((u) => u.id === task.unitId);
            const month = FISCAL_MONTHS.find((m) => m.id === task.monthId);
            const statusConf = STATUS_CONFIG[task.status];

            return (
              <div 
                key={task.id} 
                className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-slate-600 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {month?.shortLabel}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusConf.badgeClass}`}>
                      {statusConf.label}
                    </span>
                  </div>

                  <h4 
                    onClick={() => setInspectTaskId(task.id)}
                    className="font-bold text-slate-100 text-sm sm:text-base hover:text-sky-400 cursor-pointer line-clamp-2 transition-colors"
                  >
                    {task.title}
                  </h4>

                  <div className="text-xs text-slate-400 mt-1">
                    <span className="font-medium text-slate-300">{unit?.name}</span> • {div?.name}
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 bg-slate-800/60 p-2 rounded-md border border-slate-700/60">
                      {task.description}
                    </p>
                  )}

                  {task.output && (
                    <div className="text-xs text-emerald-400 mt-2 font-medium">
                      🎯 ผลสัมฤทธิ์: <span className="font-normal text-slate-300">{task.output}</span>
                    </div>
                  )}

                  {task.issues && (
                    <div className="text-xs text-[#e57373] mt-1.5 bg-[#451b16]/30 p-2 rounded border border-rose-500/20">
                      ⚠️ ปัญหา: {task.issues}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>ความก้าวหน้า</span>
                    <span className="font-bold text-slate-100">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden mb-3">
                    <div 
                      className={`h-1.5 rounded-full ${
                        task.status === 'completed' ? 'bg-[#2e9369]' :
                        task.status === 'delayed' ? 'bg-[#e57373]' :
                        task.status === 'pending_review' ? 'bg-[#c5a059]' :
                        task.status === 'in_progress' ? 'bg-[#6b8fae]' : 'bg-slate-500'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {task.assignee}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setInspectTaskId(task.id)}
                        className="p-1 text-slate-400 hover:text-sky-400 rounded cursor-pointer"
                        title="ดูรายละเอียดงาน"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {currentRole === 'editor' && (
                        <>
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1 text-slate-400 hover:text-sky-400 rounded cursor-pointer"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTaskToDelete(task)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Inspection Modal */}
      {inspectTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1e293b] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-700 relative animate-in fade-in duration-150 text-slate-200">
            <button
              onClick={() => setInspectTaskId(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 p-1 rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-sky-500/10 text-sky-400 border-sky-500/20">
                {FISCAL_MONTHS.find(m => m.id === inspectTask.monthId)?.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[inspectTask.status].badgeClass}`}>
                {STATUS_CONFIG[inspectTask.status].label}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 mt-1">
              {inspectTask.title}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div>
                <span className="text-slate-400 block">งานหลัก:</span>
                <span className="font-medium text-slate-200">
                  {DIVISIONS_DATA.find(d => d.id === inspectTask.divisionId)?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">หน่วยงานย่อย:</span>
                <span className="font-medium text-slate-200">
                  {DIVISIONS_DATA.find(d => d.id === inspectTask.divisionId)?.units.find(u => u.id === inspectTask.unitId)?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">ผู้รับผิดชอบ:</span>
                <span className="font-bold text-sky-400">{inspectTask.assignee}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ระยะเวลา:</span>
                <span className="font-medium text-slate-200">{inspectTask.startDate} ถึง {inspectTask.dueDate}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">
                  รายละเอียด / เป้าหมาย
                </h5>
                <p className="text-slate-200 bg-slate-800/60 border border-slate-700 p-3 rounded-lg leading-relaxed">
                  {inspectTask.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-400 mb-1">
                  ผลการดำเนินงานประจำงวด
                </h5>
                <p className="text-slate-200 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-lg leading-relaxed">
                  {inspectTask.output || 'ยังไม่ได้ระบุผลการดำเนินงาน'}
                </p>
              </div>

              {inspectTask.issues && (
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-[#e57373] mb-1">
                    ปัญหา / อุปสรรค / แนวทางแก้ไข
                  </h5>
                  <p className="text-[#e57373] bg-[#451b16]/30 border border-rose-500/20 p-3 rounded-lg leading-relaxed">
                    {inspectTask.issues}
                  </p>
                </div>
              )}

              {inspectTask.budget && (
                <div className="text-xs text-slate-400 pt-1">
                  งบประมาณดำเนินโครงการ: <span className="font-bold text-slate-100">{inspectTask.budget.toLocaleString()} บาท</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                อัปเดตล่าสุด: {inspectTask.updatedAt}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(inspectTask)}
                  className="px-3 py-1.5 bg-[#451b16]/30 hover:bg-[#451b16]/50 text-[#e57373] border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบงานนี้</span>
                </button>
                <button
                  onClick={() => {
                    const t = inspectTask;
                    setInspectTaskId(null);
                    onEditTask(t);
                  }}
                  className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  แก้ไขงานนี้
                </button>
                <button
                  onClick={() => setInspectTaskId(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            onDeleteTask(taskToDelete.id);
            if (inspectTaskId === taskToDelete.id) {
              setInspectTaskId(null);
            }
            setTaskToDelete(null);
          }
        }}
        title="ยืนยันการลบภารกิจ"
        message="คุณต้องการลบภารกิจนี้ออกจากระบบใช่หรือไม่? ข้อมูลการติดตามและผลการดำเนินงานของภารกิจนี้จะถูกลบออกถาวร"
        itemTitle={taskToDelete?.title}
        itemSubtitle={taskToDelete ? `ผู้รับผิดชอบ: ${taskToDelete.assignee} • กำหนดส่ง: ${taskToDelete.dueDate}` : undefined}
        confirmLabel="ยืนยันการลบภารกิจ"
        cancelLabel="ยกเลิก"
        variant="danger"
      />

      {/* CSV Import / Save Updated File Modal */}
      {onSaveImportedTasks && (
        <CsvImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          currentTasks={tasks}
          onSaveTasks={(updatedTasks, updatedCount, newCount) => {
            onSaveImportedTasks(updatedTasks, updatedCount, newCount);
          }}
        />
      )}

      {/* Edit Monthly Summary Modal */}
      {isEditingSummary && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-700 relative animate-in fade-in duration-150 text-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    แก้ไขสรุปผลการดำเนินงาน: {activeSummaryDivInfo.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeSummaryMonthInfo.label} (ไตรมาส {activeSummaryMonthInfo.quarter})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingSummary(false)}
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs sm:text-sm">
              <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-sky-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    มีภารกิจในทะเบียนติดตามงาน <strong>{summaryMatchingTasks.length} รายการ</strong> (เสร็จสิ้น {summaryStats.completed} งาน, ล่าช้า {summaryStats.delayed} งาน)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillSummaryModal}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ดึงข้อมูลอัตโนมัติจากทะเบียนงาน</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  1. สรุปผลการดำเนินงานภาพรวม
                </label>
                <textarea
                  rows={3}
                  value={summaryEditForm.summaryText}
                  onChange={(e) => setSummaryEditForm(prev => ({ ...prev, summaryText: e.target.value }))}
                  placeholder="ระบุภาพรวมการดำเนินงานของงาน..."
                  className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  2. ผลงานสำคัญ / ความสำเร็จเด่น (Key Achievements)
                </label>
                <textarea
                  rows={3}
                  value={summaryEditForm.achievements}
                  onChange={(e) => setSummaryEditForm(prev => ({ ...prev, achievements: e.target.value }))}
                  placeholder="ระบุความสำเร็จ ผลสัมฤทธิ์ หรือโครงการที่เสร็จสิ้น..."
                  className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-400 mb-1">
                  3. ปัญหา อุปสรรค และแนวทางแก้ไข
                </label>
                <textarea
                  rows={3}
                  value={summaryEditForm.obstacles}
                  onChange={(e) => setSummaryEditForm(prev => ({ ...prev, obstacles: e.target.value }))}
                  placeholder="ระบุอุปสรรค ข้อติดขัด หรือสิ่งที่ต้องขอรับการสนับสนุน..."
                  className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sky-400 mb-1">
                  4. แผนงานสำคัญเดือนถัดไป (Next Steps)
                </label>
                <textarea
                  rows={2}
                  value={summaryEditForm.nextPlan}
                  onChange={(e) => setSummaryEditForm(prev => ({ ...prev, nextPlan: e.target.value }))}
                  placeholder="ระบุภารกิจที่เตรียมดำเนินการในงวดถัดไป..."
                  className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ผู้รายงาน / ตำแหน่ง
                </label>
                <input
                  type="text"
                  value={summaryEditForm.reporter}
                  onChange={(e) => setSummaryEditForm(prev => ({ ...prev, reporter: e.target.value }))}
                  placeholder="เช่น หัวหน้างานธุรการ"
                  className="w-full p-2 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingSummary(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors cursor-pointer text-xs sm:text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveSummaryEdit}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-semibold transition-colors cursor-pointer text-xs sm:text-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกสรุปผลงาน</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
