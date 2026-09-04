import React, { useState, useMemo } from 'react';
import { 
  WorkTask, 
  TaskStatus, 
  DivisionId, 
  DIVISIONS_DATA, 
  FISCAL_MONTHS, 
  STATUS_CONFIG 
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
  X
} from 'lucide-react';

interface TaskListViewProps {
  tasks: WorkTask[];
  onAddTask: () => void;
  onEditTask: (task: WorkTask) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  selectedDivisionInitial?: DivisionId | 'all';
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onQuickStatusChange,
  selectedDivisionInitial = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(selectedDivisionInitial);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [inspectTask, setInspectTask] = useState<WorkTask | null>(null);

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

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'ชื่องาน / ภารกิจ',
      'งานหลัก',
      'หน่วยงานย่อย',
      'ประจำเดือน',
      'ผู้รับผิดชอบ',
      'สถานะ',
      'ความก้าวหน้า (%)',
      'วันที่เริ่ม',
      'กำหนดส่ง',
      'รายละเอียด',
      'ผลการดำเนินงาน',
      'ปัญหาและอุปสรรค'
    ];

    const rows = filteredTasks.map((t, idx) => {
      const div = DIVISIONS_DATA.find((d) => d.id === t.divisionId);
      const unit = div?.units.find((u) => u.id === t.unitId);
      const month = FISCAL_MONTHS.find((m) => m.id === t.monthId);
      return [
        idx + 1,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${div?.name || ''}"`,
        `"${unit?.name || ''}"`,
        `"${month?.label || ''}"`,
        `"${t.assignee}"`,
        `"${STATUS_CONFIG[t.status].label}"`,
        t.progress,
        t.startDate,
        t.dueDate,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.output || '').replace(/"/g, '""')}"`,
        `"${(t.issues || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `work_tracking_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Controls */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              ทะเบียนติดตามงาน (Work Items Register)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              รายการภารกิจและโครงการทั้งหมด ประจำปีงบประมาณ 2570
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors shadow-xs"
              title="ส่งออกรายการเป็นไฟล์ Excel / CSV"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={onAddTask}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 active:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มงานใหม่</span>
            </button>
          </div>
        </div>

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
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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

        {/* Filter Summary & View Mode Switcher */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div>
            พบภารกิจ <span className="font-semibold text-slate-200">{filteredTasks.length}</span> รายการ
            {(selectedMonth !== 'all' || selectedDivision !== 'all' || selectedStatus !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedMonth('all');
                  setSelectedDivision('all');
                  setSelectedUnit('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
                className="ml-2 text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-1"
              >
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1 border border-slate-700 rounded-lg p-0.5 bg-slate-800">
            <button
              onClick={() => setViewMode('table')}
              title="มุมมองตาราง"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-700 text-amber-400 font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="มุมมองการ์ด"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-slate-700 text-amber-400 font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
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
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 shadow-md shadow-amber-500/20"
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
                          className="font-semibold text-white hover:text-amber-400 cursor-pointer transition-colors"
                          onClick={() => setInspectTask(task)}
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
                                task.status === 'completed' ? 'bg-emerald-500' :
                                task.status === 'delayed' ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-300">{task.progress}%</span>
                        </div>
                      </td>

                      {/* Status Dropdown Quick Change */}
                      <td className="px-3 py-3 whitespace-nowrap">
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
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setInspectTask(task)}
                            title="ดูรายละเอียดงาน"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditTask(task)}
                            title="แก้ไขข้อมูลงาน"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`ยืนยันการลบภารกิจ "${task.title}" ?`)) {
                                onDeleteTask(task.id);
                              }
                            }}
                            title="ลบภารกิจ"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                    onClick={() => setInspectTask(task)}
                    className="font-bold text-white text-sm sm:text-base hover:text-amber-400 cursor-pointer line-clamp-2 transition-colors"
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
                    <div className="text-xs text-rose-400 mt-1.5 bg-rose-950/30 p-2 rounded border border-rose-500/30">
                      ⚠️ ปัญหา: {task.issues}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>ความก้าวหน้า</span>
                    <span className="font-bold text-white">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden mb-3">
                    <div 
                      className={`h-1.5 rounded-full ${
                        task.status === 'completed' ? 'bg-emerald-500' :
                        task.status === 'delayed' ? 'bg-rose-500' : 'bg-amber-500'
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
                        onClick={() => onEditTask(task)}
                        className="p-1 text-slate-400 hover:text-amber-400 rounded cursor-pointer"
                        title="แก้ไข"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`ยืนยันการลบภารกิจ "${task.title}" ?`)) {
                            onDeleteTask(task.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
              onClick={() => setInspectTask(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20">
                {FISCAL_MONTHS.find(m => m.id === inspectTask.monthId)?.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[inspectTask.status].badgeClass}`}>
                {STATUS_CONFIG[inspectTask.status].label}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mt-1">
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
                <span className="font-bold text-amber-400">{inspectTask.assignee}</span>
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
                  <h5 className="font-bold text-xs uppercase tracking-wider text-rose-400 mb-1">
                    ปัญหา / อุปสรรค / แนวทางแก้ไข
                  </h5>
                  <p className="text-rose-200 bg-rose-950/30 border border-rose-500/30 p-3 rounded-lg leading-relaxed">
                    {inspectTask.issues}
                  </p>
                </div>
              )}

              {inspectTask.budget && (
                <div className="text-xs text-slate-400 pt-1">
                  งบประมาณดำเนินโครงการ: <span className="font-bold text-white">{inspectTask.budget.toLocaleString()} บาท</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                อัปเดตล่าสุด: {inspectTask.updatedAt}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const t = inspectTask;
                    setInspectTask(null);
                    onEditTask(t);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  แก้ไขงานนี้
                </button>
                <button
                  onClick={() => setInspectTask(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
