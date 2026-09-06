import React, { useState, useEffect } from 'react';
import { 
  WorkTask, 
  DivisionId, 
  TaskStatus, 
  DIVISIONS_DATA, 
  FISCAL_MONTHS, 
  STATUS_CONFIG 
} from '../types';
import { X, Save, AlertCircle, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: WorkTask) => void;
  onDelete?: (taskId: string) => void;
  taskToEdit?: WorkTask | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  taskToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [divisionId, setDivisionId] = useState<DivisionId>('admin');
  const [unitId, setUnitId] = useState('admin-plan');
  const [monthId, setMonthId] = useState('2569-10');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [output, setOutput] = useState('');
  const [issues, setIssues] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDivisionId(taskToEdit.divisionId);
      setUnitId(taskToEdit.unitId);
      setMonthId(taskToEdit.monthId);
      setAssignee(taskToEdit.assignee);
      setStatus(taskToEdit.status);
      setProgress(taskToEdit.progress);
      setStartDate(taskToEdit.startDate);
      setDueDate(taskToEdit.dueDate);
      setDescription(taskToEdit.description);
      setOutput(taskToEdit.output);
      setIssues(taskToEdit.issues || '');
      setBudget(taskToEdit.budget ? String(taskToEdit.budget) : '');
      setPriority(taskToEdit.priority);
    } else {
      // Defaults for new task
      setTitle('');
      setDivisionId('admin');
      setUnitId('admin-plan');
      setMonthId('2569-10');
      setAssignee('');
      setStatus('not_started');
      setProgress(0);
      setStartDate('2569-10-01');
      setDueDate('2569-10-31');
      setDescription('');
      setOutput('');
      setIssues('');
      setBudget('');
      setPriority('medium');
    }
    setErrors({});
  }, [taskToEdit, isOpen]);

  // When division changes, update unit to the first unit of that division
  const handleDivisionChange = (newDivId: DivisionId) => {
    setDivisionId(newDivId);
    const div = DIVISIONS_DATA.find((d) => d.id === newDivId);
    if (div && div.units.length > 0) {
      setUnitId(div.units[0].id);
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      setProgress(100);
    } else if (newStatus === 'not_started' && progress === 100) {
      setProgress(0);
    }
  };

  const handleProgressChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setProgress(clamped);
    if (clamped === 100) {
      setStatus('completed');
    } else if (clamped > 0 && status === 'not_started') {
      setStatus('in_progress');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'กรุณาระบุชื่องาน / กิจกรรม';
    }
    if (!assignee.trim()) {
      newErrors.assignee = 'กรุณาระบุชื่อผู้รับผิดชอบ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newTask: WorkTask = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      divisionId,
      unitId,
      monthId,
      assignee: assignee.trim(),
      status,
      progress,
      startDate: startDate || '2569-10-01',
      dueDate: dueDate || '2569-10-31',
      description: description.trim(),
      output: output.trim(),
      issues: issues.trim() || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      priority,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(newTask);
    onClose();
  };

  if (!isOpen) return null;

  const currentDivisionUnits = DIVISIONS_DATA.find((d) => d.id === divisionId)?.units || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1e293b] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-700 relative my-8 animate-in fade-in zoom-in-95 duration-150 text-slate-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-100">
            {taskToEdit ? 'แก้ไขข้อมูลภารกิจติดตามงาน' : 'เพิ่มรายการติดตามงานใหม่'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ประจำปีงบประมาณ 2570 (ตุลาคม 2569 – กันยายน 2570)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              ชื่องาน / โครงการ / กิจกรรม <span className="text-sky-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น จัดทำแผนปฏิบัติการประจำปี 2570, ซ่อมบำรุงระบบ Wi-Fi..."
              className={`w-full p-2.5 bg-slate-800 border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${
                errors.title ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-700'
              }`}
            />
            {errors.title && (
              <p className="text-[#e57373] text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Division & Unit Cascaded */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                งานหลัก (Division) <span className="text-sky-400">*</span>
              </label>
              <select
                value={divisionId}
                onChange={(e) => handleDivisionChange(e.target.value as DivisionId)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-medium focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {DIVISIONS_DATA.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}. {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                หน่วยงานย่อย (Unit) <span className="text-sky-400">*</span>
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-medium focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {currentDivisionUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Month & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                ประจำเดือน (ตุลาคม 2569 – กันยายน 2570)
              </label>
              <select
                value={monthId}
                onChange={(e) => setMonthId(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {FISCAL_MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} (ไตรมาส {m.quarter})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                ผู้รับผิดชอบ <span className="text-sky-400">*</span>
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="ชื่อ-สกุล หรือตำแหน่งผู้รับผิดชอบ"
                className={`w-full p-2 bg-slate-800 border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${
                  errors.assignee ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-700'
                }`}
              />
              {errors.assignee && (
                <p className="text-[#e57373] text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.assignee}
                </p>
              )}
            </div>
          </div>

          {/* Status & Progress Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                สถานะการดำเนินงาน
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg font-semibold text-slate-100 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="not_started">○ ยังไม่เริ่ม</option>
                <option value="in_progress">▶ กำลังดำเนินการ</option>
                <option value="pending_review">⏳ รอตรวจ/รออนุมัติ</option>
                <option value="completed">✓ เสร็จสิ้น</option>
                <option value="delayed">⚠️ ล่าช้ากว่ากำหนด</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between font-semibold text-slate-300 mb-1">
                <span>ความก้าวหน้า (%):</span>
                <span className="text-sky-400 font-bold">{progress}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => handleProgressChange(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => handleProgressChange(Number(e.target.value))}
                  className="w-16 p-1.5 bg-slate-900 border border-slate-700 rounded text-center font-bold text-xs text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Dates & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                วันที่เริ่มต้น
              </label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="เช่น 2569-10-01"
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                กำหนดส่ง / สิ้นสุด
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="เช่น 2569-10-31"
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                งบประมาณ (บาท - ถ้ามี)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="เช่น 50000"
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              รายละเอียดงาน / วัตถุประสงค์ / ตัวชี้วัดเป้าหมาย
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุขอบเขตงาน รายละเอียด หรือเป้าหมายที่ต้องการบรรลุ..."
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Output / Result */}
          <div>
            <label className="block font-semibold text-emerald-400 mb-1">
              ผลการดำเนินงานประจำงวด (Outputs & Achievements)
            </label>
            <textarea
              rows={2}
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="ระบุผลสัมฤทธิ์ เช่น จำนวนหนังสือที่ออก, อัตราการเบิกจ่าย, ผู้เข้าร่วม..."
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Issues / Solutions */}
          <div>
            <label className="block font-semibold text-[#e57373] mb-1">
              ปัญหา / อุปสรรค / แนวทางแก้ไข (ถ้ามี)
            </label>
            <textarea
              rows={2}
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder="เช่น ข้อมูลจากภายนอกส่งล่าช้า, ปรับปรุงร่างข้อกำหนด TOR..."
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-[#e57373] focus:ring-1 focus:ring-[#e57373]"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between gap-3">
            {taskToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#451b16]/30 hover:bg-[#451b16]/50 text-[#e57373] border border-rose-500/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบภารกิจนี้</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-100 font-bold rounded-lg transition-colors shadow-md shadow-sky-500/25 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{taskToEdit ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* In-App Delete Confirmation Modal for TaskModal */}
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={() => {
            if (taskToEdit && onDelete) {
              onDelete(taskToEdit.id);
              setIsConfirmDeleteOpen(false);
              onClose();
            }
          }}
          title="ยืนยันการลบภารกิจ"
          message="คุณต้องการลบภารกิจนี้ออกจากระบบใช่หรือไม่? เมื่อลบแล้วข้อมูลจะไม่สามารถกู้คืนได้"
          itemTitle={taskToEdit?.title}
          itemSubtitle={taskToEdit ? `ผู้รับผิดชอบ: ${taskToEdit.assignee} • กำหนดส่ง: ${taskToEdit.dueDate}` : undefined}
          confirmLabel="ยืนยันการลบภารกิจ"
          cancelLabel="ยกเลิก"
          variant="danger"
        />
      </div>
    </div>
  );
};
