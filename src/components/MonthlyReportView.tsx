import React, { useState, useMemo } from 'react';
import { 
  WorkTask, 
  MonthlyDivisionSummary, 
  DivisionId, 
  DIVISIONS_DATA, 
  FISCAL_MONTHS, 
  STATUS_CONFIG 
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
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface MonthlyReportViewProps {
  tasks: WorkTask[];
  summaries: MonthlyDivisionSummary[];
  onSaveSummary: (summary: MonthlyDivisionSummary) => void;
  selectedMonthId?: string;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  tasks,
  summaries,
  onSaveSummary,
  selectedMonthId = '2569-10',
}) => {
  const [activeMonthId, setActiveMonthId] = useState<string>(selectedMonthId);
  const [editingDivision, setEditingDivision] = useState<DivisionId | null>(null);
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
    };

    onSaveSummary(updated);
    setEditingDivision(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                สรุปผลการดำเนินงานของแต่ละงานประจำเดือน
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                รายงานผลการปฏิบัติงาน 4 งานหลัก ประจำปีงบประมาณ 2570
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              เลือกเดือน:
            </span>
            <select
              value={activeMonthId}
              onChange={(e) => setActiveMonthId(e.target.value)}
              className="text-sm font-semibold text-amber-400 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {FISCAL_MONTHS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} (ไตรมาส {m.quarter})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>พิมพ์รายงานสรุป</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Statistics Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-amber-400">
              Executive Monthly Summary
            </span>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-white">
              รายงานผลการดำเนินงาน ประจำเดือน {currentMonthInfo.label}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              สรุปภาพรวมและผลสัมฤทธิ์การดำเนินงานของ 4 สายงานหลัก เพื่อนำเสนอต่อที่ประชุมคณะกรรมการบริหาร
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-slate-800/80 backdrop-blur-xs p-3 rounded-lg border border-slate-700 text-center">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-white">{monthStats.total}</div>
              <div className="text-[11px] text-slate-400">ภารกิจในเดือน</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-emerald-400">{monthStats.completed}</div>
              <div className="text-[11px] text-slate-400">เสร็จสิ้น ({monthStats.rate}%)</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-amber-400">{monthStats.inProgress}</div>
              <div className="text-[11px] text-slate-400">กำลังทำ</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-rose-400">{monthStats.delayed}</div>
              <div className="text-[11px] text-slate-400">ล่าช้า</div>
            </div>
          </div>
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

          return (
            <div 
              key={division.id}
              className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-slate-800/70 border-b border-slate-700 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-xs">
                    {division.code}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                      {division.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ประกอบด้วย {division.units.map((u) => u.name).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right text-xs">
                    <span className="text-slate-400">ความก้าวหน้าเดือนนี้: </span>
                    <span className="font-bold text-amber-400">{divCompleted}/{divTotal} งาน ({divRate}%)</span>
                  </div>
                  <button
                    onClick={() => handleStartEdit(division.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขรายงานสรุป</span>
                  </button>
                </div>
              </div>

              {/* Narrative Content */}
              <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
                {/* 1. สรุปผลภาพรวม */}
                <div>
                  <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    สรุปผลการดำเนินงานภาพรวมประจำเดือน
                  </h4>
                  <p className="text-slate-200 bg-slate-800/60 p-3.5 rounded-lg leading-relaxed border border-slate-700/60">
                    {summary?.summaryText || (
                      <span className="text-slate-500 italic">
                        ยังไม่ได้บันทึกบทสรุปผลการดำเนินงานประจำเดือนนี้ คลิกปุ่ม "แก้ไขรายงานสรุป" เพื่อเพิ่มข้อมูล
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
                    <div className="text-slate-200 bg-emerald-950/20 p-3.5 rounded-lg leading-relaxed border border-emerald-500/30 min-h-20">
                      {summary?.achievements || (
                        <span className="text-slate-500 italic">ยังไม่ได้ระบุผลงานเด่น</span>
                      )}
                    </div>
                  </div>

                  {/* ปัญหาและอุปสรรค */}
                  <div>
                    <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-rose-400 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      ปัญหา อุปสรรค และแนวทางแก้ไข (Issues & Solutions)
                    </h4>
                    <div className="text-slate-200 bg-rose-950/20 p-3.5 rounded-lg leading-relaxed border border-rose-500/30 min-h-20">
                      {summary?.obstacles || (
                        <span className="text-slate-500 italic">ไม่มีปัญหาหรืออุปสรรคที่ต้องรายงาน</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. แผนงานในเดือนถัดไป */}
                <div>
                  <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-400 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    แผนงานสำคัญและข้อเสนอแนะในเดือนถัดไป (Next Steps)
                  </h4>
                  <div className="text-slate-200 bg-amber-950/20 p-3.5 rounded-lg leading-relaxed border border-amber-500/30">
                    {summary?.nextPlan || (
                      <span className="text-slate-500 italic">ยังไม่ได้ระบุแผนงานเดือนถัดไป</span>
                    )}
                  </div>
                </div>

                {/* Tasks in this month for this division */}
                {divTasks.length > 0 && (
                  <div className="pt-3 border-t border-slate-700/60">
                    <h5 className="font-bold text-xs text-slate-400 mb-2">
                      ภารกิจและกิจกรรมที่กำหนดส่งในเดือน {currentMonthInfo.label} ({divTasks.length} รายการ):
                    </h5>
                    <div className="divide-y divide-slate-700/60 border border-slate-700 rounded-lg overflow-hidden bg-slate-800/40">
                      {divTasks.map((t) => {
                        const statusConf = STATUS_CONFIG[t.status];
                        const unit = division.units.find((u) => u.id === t.unitId);
                        return (
                          <div key={t.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <div className="font-medium text-slate-200 truncate">{t.title}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="font-medium text-slate-300">{unit?.name}</span>
                                <span>• ผู้รับผิดชอบ: {t.assignee}</span>
                                <span>• ความก้าวหน้า: {t.progress}%</span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 border ${statusConf.badgeClass}`}>
                              {statusConf.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Card Footer info */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>ผู้รายงาน: {summary?.reporter || 'หัวหน้า' + division.name}</span>
                  <span>วันที่รายงาน: {summary?.reportedDate || '-'}</span>
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
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {currentMonthInfo.label}
              </span>
              <span className="text-xs text-slate-400">ปีงบประมาณ 2570</span>
            </div>

            <h3 className="text-lg font-bold text-white">
              บันทึกสรุปผลการดำเนินงาน: {DIVISIONS_DATA.find(d => d.id === editingDivision)?.name}
            </h3>

            <div className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  สรุปผลการดำเนินงานภาพรวมของงานประจำเดือน
                </label>
                <textarea
                  rows={3}
                  value={editForm.summaryText}
                  onChange={(e) => setEditForm({ ...editForm, summaryText: e.target.value })}
                  placeholder="ระบุภาพรวมการดำเนินงานของสายงานในเดือนนี้..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  ผลงานสำคัญ / ความสำเร็จเด่น (Key Achievements)
                </label>
                <textarea
                  rows={2}
                  value={editForm.achievements}
                  onChange={(e) => setEditForm({ ...editForm, achievements: e.target.value })}
                  placeholder="เช่น บรรลุเป้าหมายตัวชี้วัด, ยอดผู้สมัครเกินเป้า, ตรวจนับพัสดุครบ 100%..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  ปัญหาและอุปสรรค และแนวทางแก้ไข (Issues & Solutions)
                </label>
                <textarea
                  rows={2}
                  value={editForm.obstacles}
                  onChange={(e) => setEditForm({ ...editForm, obstacles: e.target.value })}
                  placeholder="ระบุปัญหาที่พบ อุปสรรค และสิ่งที่ต้องการการสนับสนุน..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs sm:text-sm transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
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
