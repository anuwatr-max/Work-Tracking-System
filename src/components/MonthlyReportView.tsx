import React, { useState, useMemo } from 'react';
import { 
  WorkTask, 
  MonthlyDivisionSummary, 
  DivisionId, 
  DIVISIONS_DATA, 
  FISCAL_MONTHS, 
  STATUS_CONFIG,
  UserRole,
  TaskStatus
} from '../types';
import { 
  Calendar, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Save, 
  X, 
  Building2,
  Zap,
  RefreshCw,
  Plus,
  Eye,
  Check,
  Clock,
  Briefcase
} from 'lucide-react';
import { compileSummaryFromTasks, buildSyncedSummary } from '../utils/summarySync';

interface MonthlyReportViewProps {
  tasks: WorkTask[];
  summaries: MonthlyDivisionSummary[];
  onSaveSummary: (summary: MonthlyDivisionSummary) => void;
  selectedMonthId?: string;
  currentRole?: UserRole;
  onEditTask?: (task: WorkTask) => void;
  onQuickStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask?: (initialDivisionId?: DivisionId, initialMonthId?: string) => void;
  onShowToast?: (msg: string) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  tasks,
  summaries,
  onSaveSummary,
  selectedMonthId = '2569-10',
  currentRole = 'editor',
  onEditTask,
  onQuickStatusChange,
  onAddTask,
  onShowToast,
}) => {
  const [activeMonthId, setActiveMonthId] = useState<string>(selectedMonthId);
  const [editingDivision, setEditingDivision] = useState<DivisionId | null>(null);
  const [inspectingTask, setInspectingTask] = useState<WorkTask | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isLiveSyncMode, setIsLiveSyncMode] = useState<boolean>(true);
  const [editForm, setEditForm] = useState<{
    summaryText: string;
    achievements: string;
    obstacles: string;
    nextPlan: string;
    reporter: string;
  }>({
    summaryText: '',
    achievements: '',
    obstacles: '',
    nextPlan: '',
    reporter: '',
  });

  const currentMonthInfo = useMemo(() => {
    return FISCAL_MONTHS.find((m) => m.id === activeMonthId) || FISCAL_MONTHS[0];
  }, [activeMonthId]);

  // Tasks in this active month
  const monthTasks = useMemo(() => {
    return tasks.filter((t) => t.monthId === activeMonthId);
  }, [tasks, activeMonthId]);

  // Overall month stats
  const monthStats = useMemo(() => {
    const total = monthTasks.length;
    const completed = monthTasks.filter((t) => t.status === 'completed').length;
    const inProgress = monthTasks.filter((t) => t.status === 'in_progress').length;
    const delayed = monthTasks.filter((t) => t.status === 'delayed').length;
    const pending = monthTasks.filter((t) => t.status === 'pending_review').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, delayed, pending, rate };
  }, [monthTasks]);

  // 1-Click Sync All 4 Divisions in Active Month from Task Register
  const handleAutoSyncAllDivisions = () => {
    setIsSyncingAll(true);
    let count = 0;
    DIVISIONS_DATA.forEach((div) => {
      const existing = summaries.find(
        (s) => s.monthId === activeMonthId && s.divisionId === div.id
      );
      const synced = buildSyncedSummary(activeMonthId, div.id, tasks, existing, true);
      onSaveSummary(synced);
      count++;
    });

    setTimeout(() => {
      setIsSyncingAll(false);
      onShowToast?.(`ซิงค์ข้อมูลสรุปผลงาน 4 สายงานประจำเดือน ${currentMonthInfo.label} จากทะเบียนงานสำเร็จ (${count} สายงาน)`);
    }, 300);
  };

  // Sync a single division from task register
  const handleAutoSyncSingleDivision = (divId: DivisionId) => {
    const divInfo = DIVISIONS_DATA.find((d) => d.id === divId);
    const existing = summaries.find(
      (s) => s.monthId === activeMonthId && s.divisionId === divId
    );
    const synced = buildSyncedSummary(activeMonthId, divId, tasks, existing, true);
    onSaveSummary(synced);
    onShowToast?.(`ซิงค์สรุปผลงานของ "${divInfo?.name}" จากทะเบียนงานเรียบร้อยแล้ว`);
  };

  // Open edit modal for a division
  const handleStartEdit = (divId: DivisionId) => {
    const existing = summaries.find(
      (s) => s.monthId === activeMonthId && s.divisionId === divId
    );

    setEditForm({
      summaryText: existing?.summaryText || '',
      achievements: existing?.achievements || '',
      obstacles: existing?.obstacles || '',
      nextPlan: existing?.nextPlan || '',
      reporter: existing?.reporter || 'หัวหน้า' + (DIVISIONS_DATA.find(d => d.id === divId)?.name || ''),
    });
    setEditingDivision(divId);
  };

  // Auto-fill form from tasks in register while editing
  const handleAutoFillInModal = () => {
    if (!editingDivision) return;
    const existing = summaries.find(
      (s) => s.monthId === activeMonthId && s.divisionId === editingDivision
    );
    const compiled = compileSummaryFromTasks(activeMonthId, editingDivision, tasks, existing);
    setEditForm((prev) => ({
      ...prev,
      summaryText: compiled.summaryText,
      achievements: compiled.achievements,
      obstacles: compiled.obstacles,
      nextPlan: compiled.nextPlan,
    }));
    onShowToast?.('ดึงข้อมูลความก้าวหน้าและผลงานจากทะเบียนงานลงในฟอร์มแล้ว');
  };

  const handleSaveEdit = () => {
    if (!editingDivision) return;
    const existing = summaries.find(
      (s) => s.monthId === activeMonthId && s.divisionId === editingDivision
    );

    const updated: MonthlyDivisionSummary = {
      id: existing?.id || `sum-${activeMonthId}-${editingDivision}`,
      monthId: activeMonthId,
      divisionId: editingDivision,
      summaryText: editForm.summaryText,
      achievements: editForm.achievements,
      obstacles: editForm.obstacles,
      nextPlan: editForm.nextPlan,
      reporter: editForm.reporter,
      reportedDate: new Date().toISOString().split('T')[0],
      isCustomEdited: true,
    };

    onSaveSummary(updated);
    setEditingDivision(null);
    onShowToast?.('บันทึกรายงานสรุปผลการดำเนินงานเรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>สรุปผลการดำเนินงานของแต่ละงานประจำเดือน</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  ซิงค์กับทะเบียนติดตามงาน
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                รายงานผลการปฏิบัติงาน 4 งานหลัก ประจำปีงบประมาณ 2570 ซิงค์ข้อมูลกับทะเบียนงานอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              เลือกเดือน:
            </span>
            <select
              value={activeMonthId}
              onChange={(e) => setActiveMonthId(e.target.value)}
              className="text-sm font-semibold text-sky-400 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              {FISCAL_MONTHS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} (ไตรมาส {m.quarter})
                </option>
              ))}
            </select>
          </div>

          {/* Sync All 4 Divisions Button (Editor Only) */}
          {currentRole === 'editor' && (
            <button
              id="sync-all-monthly-summaries-btn"
              onClick={handleAutoSyncAllDivisions}
              disabled={isSyncingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="ซิงค์และประมวลผลสรุปภาพรวม ผลงานเด่น และอุปสรรคของทั้ง 4 สายงานจากทะเบียนงานทันที"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>ซิงค์ข้อมูลจากทะเบียนงาน (ทั้งหมด)</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-slate-100 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>พิมพ์รายงานสรุป</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Statistics Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 text-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-sky-400">
                Executive Monthly Summary
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                เรียลไทม์ ซิงค์ {monthTasks.length} ภารกิจ
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-slate-100">
              รายงานผลการดำเนินงาน ประจำเดือน {currentMonthInfo.label}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              สรุปภาพรวมและผลสัมฤทธิ์การดำเนินงานของ 4 สายงานหลัก เพื่อนำเสนอต่อที่ประชุมคณะกรรมการบริหาร ประมวลผลจากภารกิจในทะเบียนติดตามงาน
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-slate-800/80 backdrop-blur-xs p-3 rounded-lg border border-slate-700 text-center">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-slate-100">{monthStats.total}</div>
              <div className="text-[11px] text-slate-400">ภารกิจในเดือน</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-[#3eb489]">{monthStats.completed}</div>
              <div className="text-[11px] text-slate-400">เสร็จสิ้น ({monthStats.rate}%)</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-[#9bbad2]">{monthStats.inProgress}</div>
              <div className="text-[11px] text-slate-400">กำลังทำ</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-[#e57373]">{monthStats.delayed}</div>
              <div className="text-[11px] text-slate-400">ล่าช้า</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Dynamic Sync Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm shadow-xs">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isLiveSyncMode 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLiveSyncMode ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isLiveSyncMode ? 'โหมดซิงค์ผลงานสดจากทะเบียนงาน (Live Dynamic Sync)' : 'โหมดแสดงบันทึกฉบับปรับแต่ง (Custom Draft)'}
          </span>
          <span className="text-slate-400 hidden md:inline">
            {isLiveSyncMode 
              ? 'สรุปผลภาพรวม ผลงานเด่น และปัญหาจะอัปเดตตรงกับทะเบียนงานแบบเรียลไทม์เสมอทุกครั้งที่มีการแก้ไข' 
              : 'แสดงข้อความสรุปตามที่มีการบันทึกปรับแต่งเฉพาะกิจ'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiveSyncMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isLiveSyncMode 
                ? 'bg-sky-500 text-slate-100 shadow-sm' 
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
            }`}
          >
            ⚡ ซิงค์สดตามทะเบียนงาน (แนะนำ)
          </button>
          <button
            onClick={() => setIsLiveSyncMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !isLiveSyncMode 
                ? 'bg-sky-500 text-slate-100 shadow-sm' 
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
            }`}
          >
            📝 ฉบับบันทึกปรับแต่ง
          </button>
        </div>
      </div>

      {/* 4 Divisions Monthly Reports */}
      <div className="space-y-6">
        {DIVISIONS_DATA.map((division) => {
          const divTasks = monthTasks.filter((t) => t.divisionId === division.id);
          const divTotal = divTasks.length;
          const divCompleted = divTasks.filter((t) => t.status === 'completed').length;
          const divRate = divTotal > 0 ? Math.round((divCompleted / divTotal) * 100) : 0;

          // Find saved summary for this month and division
          const summary = summaries.find(
            (s) => s.monthId === activeMonthId && s.divisionId === division.id
          );

          // Compute LIVE compiled summary dynamically directly from latest tasks
          const liveCompiled = compileSummaryFromTasks(activeMonthId, division.id, tasks, summary);

          const effectiveSummary = (isLiveSyncMode || !summary?.isCustomEdited) 
            ? liveCompiled 
            : {
                summaryText: summary?.summaryText || liveCompiled.summaryText,
                achievements: summary?.achievements || liveCompiled.achievements,
                obstacles: summary?.obstacles || liveCompiled.obstacles,
                nextPlan: summary?.nextPlan || liveCompiled.nextPlan,
              };

          return (
            <div 
              key={division.id}
              className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-slate-800/70 border-b border-slate-700 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="w-9 h-9 rounded-lg bg-sky-500 text-slate-100 font-bold flex items-center justify-center text-sm shadow-xs">
                    {division.code}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2">
                        {division.name}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        isLiveSyncMode 
                          ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isLiveSyncMode ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        {isLiveSyncMode ? 'ซิงค์สดจากทะเบียนงาน' : 'ฉบับปรับแต่ง'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      ประกอบด้วย {division.units.map((u) => u.name).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="text-right text-xs mr-1">
                    <span className="text-slate-400">ความก้าวหน้าเดือนนี้: </span>
                    <span className="font-bold text-sky-400">{divCompleted}/{divTotal} งาน ({divRate}%)</span>
                  </div>

                  {/* Sync Single Division Button */}
                  {currentRole === 'editor' && (
                    <button
                      onClick={() => handleAutoSyncSingleDivision(division.id)}
                      title="ซิงค์ดึงผลลัพธ์และปัญหาจากทะเบียนงานเฉพาะสายงานนี้"
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ซิงค์จากงานในทะเบียน</span>
                    </button>
                  )}

                  {/* Add Task Button */}
                  {currentRole === 'editor' && onAddTask && (
                    <button
                      onClick={() => onAddTask(division.id, activeMonthId)}
                      title="เพิ่มภารกิจใหม่ลงในงานนี้และเดือนนี้โดยตรง"
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 border border-slate-700 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-400" />
                      <span>เพิ่มภารกิจ</span>
                    </button>
                  )}

                  {/* Edit Summary Button */}
                  {currentRole === 'editor' && (
                    <button
                      onClick={() => handleStartEdit(division.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขรายงานสรุป</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Narrative Content */}
              <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
                {/* 1. สรุปผลภาพรวม */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      สรุปผลการดำเนินงานภาพรวมประจำเดือน
                    </h4>
                    {summary?.reportedDate && (
                      <span className="text-[11px] text-slate-500">
                        รายงานโดย: {summary.reporter || '-'} • {summary.reportedDate}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 bg-slate-800/60 p-3.5 rounded-lg leading-relaxed border border-slate-700/60 whitespace-pre-line">
                    {effectiveSummary.summaryText || (
                      <span className="text-slate-500 italic">
                        ยังไม่ได้บันทึกบทสรุปผลการดำเนินงานประจำเดือนนี้ คลิกปุ่ม "ซิงค์จากงานในทะเบียน" เพื่อสร้างบทสรุปอัตโนมัติ หรือคลิก "แก้ไขรายงานสรุป"
                      </span>
                    )}
                  </p>
                </div>

                {/* 2 Grid: ผลงานเด่น & ปัญหาอุปสรรค */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ผลงานเด่น */}
                  <div>
                    <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-400 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ผลงานสำคัญ / ความสำเร็จเด่น (Key Achievements)
                    </h4>
                    <div className="text-slate-200 bg-emerald-950/20 p-3.5 rounded-lg leading-relaxed border border-emerald-500/30 min-h-20 whitespace-pre-line">
                      {effectiveSummary.achievements || (
                        <span className="text-slate-500 italic">ยังไม่ได้ระบุผลงานเด่น (สามารถกดปุ่มซิงค์เพื่อรวบรวมงานที่เสร็จสิ้นอัตโนมัติ)</span>
                      )}
                    </div>
                  </div>

                  {/* ปัญหาและอุปสรรค */}
                  <div>
                    <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#e57373] mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#e57373]" />
                      ปัญหา อุปสรรค และแนวทางแก้ไข (Issues & Solutions)
                    </h4>
                    <div className="text-slate-200 bg-[#451b16]/20 p-3.5 rounded-lg leading-relaxed border border-rose-500/20 min-h-20 whitespace-pre-line">
                      {effectiveSummary.obstacles || (
                        <span className="text-slate-500 italic">ไม่มีปัญหาหรืออุปสรรคที่ต้องรายงาน</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. แผนงานในเดือนถัดไป */}
                <div>
                  <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-sky-400 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                    แผนงานสำคัญและข้อเสนอแนะในเดือนถัดไป (Next Steps)
                  </h4>
                  <div className="text-slate-200 bg-sky-950/20 p-3.5 rounded-lg leading-relaxed border border-sky-500/30 whitespace-pre-line">
                    {effectiveSummary.nextPlan || (
                      <span className="text-slate-500 italic">ยังไม่ได้ระบุแผนงานเดือนถัดไป</span>
                    )}
                  </div>
                </div>

                {/* Tasks in this month for this division */}
                <div className="pt-3 border-t border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-xs text-slate-400 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                      ภารกิจและกิจกรรมในทะเบียนติดตามงาน ({divTasks.length} รายการ):
                    </h5>
                    <span className="text-[11px] text-slate-500">
                      คลิกที่ภารกิจเพื่อเปิดดูรายละเอียด หรือเปลี่ยนสถานะด่วนเพื่อให้อัปเดตรายงานสรุป
                    </span>
                  </div>

                  {divTasks.length > 0 ? (
                    <div className="divide-y divide-slate-700/60 border border-slate-700 rounded-lg overflow-hidden bg-slate-800/40">
                      {divTasks.map((t) => {
                        const statusConf = STATUS_CONFIG[t.status];
                        const unit = division.units.find((u) => u.id === t.unitId);
                        return (
                          <div 
                            key={t.id} 
                            className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-800/80 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-200 hover:text-sky-300 cursor-pointer" onClick={() => setInspectingTask(t)}>
                                  {t.title}
                                </span>
                                {t.output && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded">
                                    มีผลสัมฤทธิ์
                                  </span>
                                )}
                                {t.issues && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded">
                                    มีปัญหา/อุปสรรค
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                <span className="font-medium text-slate-300">{unit?.name}</span>
                                <span>• ผู้รับผิดชอบ: <strong className="text-sky-400">{t.assignee}</strong></span>
                                <span>• กำหนดส่ง: {t.dueDate}</span>
                                <span>• ความก้าวหน้า: <strong className="text-slate-200">{t.progress}%</strong></span>
                              </div>
                            </div>

                            {/* Actions & Status on each task row */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Quick status dropdown or badge */}
                              {currentRole === 'editor' && onQuickStatusChange ? (
                                <select
                                  value={t.status}
                                  onChange={(e) => onQuickStatusChange(t.id, e.target.value as TaskStatus)}
                                  className={`text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${statusConf.badgeClass}`}
                                >
                                  <option value="not_started">ยังไม่เริ่ม</option>
                                  <option value="in_progress">กำลังทำ</option>
                                  <option value="pending_review">รอตรวจ</option>
                                  <option value="completed">เสร็จสิ้น</option>
                                  <option value="delayed">ล่าช้า</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusConf.badgeClass}`}>
                                  {statusConf.label}
                                </span>
                              )}

                              {/* Inspect button */}
                              <button
                                onClick={() => setInspectingTask(t)}
                                title="ดูรายละเอียดภารกิจ"
                                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 rounded-md transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit button */}
                              {currentRole === 'editor' && onEditTask && (
                                <button
                                  onClick={() => onEditTask(t)}
                                  title="แก้ไขภารกิจในทะเบียนงาน"
                                  className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-700/60 rounded-md transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border border-dashed border-slate-700 text-center text-xs text-slate-500">
                      ยังไม่มีภารกิจในทะเบียนติดตามงานที่กำหนดส่งในเดือนนี้
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Summary Modal */}
      {editingDivision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1e293b] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-700 relative animate-in fade-in duration-150 text-slate-200">
            <button
              onClick={() => setEditingDivision(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 p-1 rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-2 mb-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {currentMonthInfo.label}
                </span>
                <span className="text-xs text-slate-400">ปีงบประมาณ 2570</span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillInModal}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="รวบรวมภารกิจ ผลสัมฤทธิ์ และปัญหาในทะเบียนงานมาเติมในฟอร์มอัตโนมัติ"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>ดึงข้อมูลอัตโนมัติจากทะเบียนงาน</span>
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-100 mt-2">
              บันทึกสรุปผลการดำเนินงาน: {DIVISIONS_DATA.find(d => d.id === editingDivision)?.name}
            </h3>

            <div className="mt-4 space-y-4 text-xs sm:text-sm max-h-[65vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  สรุปผลการดำเนินงานภาพรวมของงานประจำเดือน
                </label>
                <textarea
                  rows={3}
                  value={editForm.summaryText}
                  onChange={(e) => setEditForm({ ...editForm, summaryText: e.target.value })}
                  placeholder="ระบุภาพรวมการดำเนินงานของสายงานในเดือนนี้..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  ผลงานสำคัญ / ความสำเร็จเด่น (Key Achievements)
                </label>
                <textarea
                  rows={3}
                  value={editForm.achievements}
                  onChange={(e) => setEditForm({ ...editForm, achievements: e.target.value })}
                  placeholder="เช่น บรรลุเป้าหมายตัวชี้วัด, ยอดผู้สมัครเกินเป้า, ตรวจนับพัสดุครบ 100%..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  ปัญหาและอุปสรรค และแนวทางแก้ไข (Issues & Solutions)
                </label>
                <textarea
                  rows={3}
                  value={editForm.obstacles}
                  onChange={(e) => setEditForm({ ...editForm, obstacles: e.target.value })}
                  placeholder="ระบุปัญหาที่พบ อุปสรรค และสิ่งที่ต้องการการสนับสนุน..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  แผนงานและข้อเสนอแนะในเดือนถัดไป (Next Steps)
                </label>
                <textarea
                  rows={2}
                  value={editForm.nextPlan}
                  onChange={(e) => setEditForm({ ...editForm, nextPlan: e.target.value })}
                  placeholder="ภารกิจหลักหรือโครงการที่จะดำเนินการต่อในเดือนหน้า..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  ชื่อ-สกุล หรือตำแหน่งผู้รายงาน
                </label>
                <input
                  type="text"
                  value={editForm.reporter}
                  onChange={(e) => setEditForm({ ...editForm, reporter: e.target.value })}
                  placeholder="เช่น นายอนุวัฒน์ รัตนชัย (หัวหน้างาน)"
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-end space-x-2">
              <button
                onClick={() => setEditingDivision(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-100 font-bold rounded-lg text-xs sm:text-sm transition-colors shadow-md shadow-sky-500/25 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกสรุปผลงาน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Inspection Modal inside Monthly Report */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1e293b] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-700 relative animate-in zoom-in-95 duration-150 text-slate-200">
            <button
              onClick={() => setInspectingTask(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {FISCAL_MONTHS.find(m => m.id === inspectingTask.monthId)?.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CONFIG[inspectingTask.status].badgeClass}`}>
                {STATUS_CONFIG[inspectingTask.status].label}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 pr-6">
              {inspectingTask.title}
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div>
                <span className="text-slate-400 block">งานหลัก:</span>
                <span className="font-medium text-slate-200">
                  {DIVISIONS_DATA.find(d => d.id === inspectingTask.divisionId)?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">หน่วยงาน:</span>
                <span className="font-medium text-slate-200">
                  {DIVISIONS_DATA.find(d => d.id === inspectingTask.divisionId)?.units.find(u => u.id === inspectingTask.unitId)?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">ผู้รับผิดชอบ:</span>
                <span className="font-bold text-sky-400">{inspectingTask.assignee}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ความก้าวหน้า:</span>
                <span className="font-bold text-slate-100">{inspectingTask.progress}%</span>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block mb-1">
                  รายละเอียด / วัตถุประสงค์
                </span>
                <p className="text-slate-200 bg-slate-800/60 border border-slate-700 p-2.5 rounded-lg leading-relaxed">
                  {inspectingTask.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </p>
              </div>

              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 block mb-1">
                  ผลการดำเนินงานประจำงวด (Output ที่ซิงค์ไปยังรายงานสรุป)
                </span>
                <p className="text-slate-200 bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-lg leading-relaxed">
                  {inspectingTask.output || 'ยังไม่ได้ระบุผลการดำเนินงาน'}
                </p>
              </div>

              {inspectingTask.issues && (
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-[#e57373] block mb-1">
                    ปัญหา / อุปสรรค (Issues ที่ซิงค์ไปยังรายงานสรุป)
                  </span>
                  <p className="text-[#e57373] bg-[#451b16]/30 border border-rose-500/20 p-2.5 rounded-lg leading-relaxed">
                    {inspectingTask.issues}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-end gap-2">
              {currentRole === 'editor' && onEditTask && (
                <button
                  onClick={() => {
                    const t = inspectingTask;
                    setInspectingTask(null);
                    onEditTask(t);
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขภารกิจ</span>
                </button>
              )}
              <button
                onClick={() => setInspectingTask(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
