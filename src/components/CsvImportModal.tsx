import React, { useState, useRef } from 'react';
import { WorkTask, STATUS_CONFIG } from '../types';
import { parseAndMergeTasksCSV, ParseTasksResult } from '../utils/exportCsv';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, ArrowRight, RefreshCw } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTasks: WorkTask[];
  onSaveTasks: (updatedTasks: WorkTask[], updatedCount: number, newCount: number) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  currentTasks,
  onSaveTasks,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseTasksResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('กรุณาเลือกไฟล์รูปแบบ .csv เท่านั้น');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('ไม่พบข้อมูลภายในไฟล์');
        }
        const result = parseAndMergeTasksCSV(text, currentTasks);
        setParseResult(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอ่านไฟล์ CSV';
        setErrorMessage(msg);
        setParseResult(null);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
      setIsProcessing(false);
    };

    // Read file as UTF-8
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmSave = () => {
    if (!parseResult) return;
    onSaveTasks(parseResult.mergedTasks, parseResult.updatedCount, parseResult.newCount);
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1e293b] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-700 relative my-8 animate-in fade-in zoom-in-95 duration-150 text-slate-200">
        <button
          onClick={() => {
            handleReset();
            onClose();
          }}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              นำเข้าและบันทึกไฟล์ CSV ที่มีการปรับปรุง
            </h3>
            <p className="text-xs text-slate-400">
              อัปเดตข้อมูลภารกิจจากไฟล์ Excel / CSV ที่คุณได้ทำการแก้ไขกลับเข้าสู่ระบบ
            </p>
          </div>
        </div>

        {/* Upload Drop Zone */}
        {!parseResult && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 ${
              dragActive
                ? 'border-sky-400 bg-sky-500/10'
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-700">
              <Upload className="w-6 h-6 text-sky-400" />
            </div>
            <p className="text-sm font-semibold text-slate-200 mb-1">
              ลากและวางไฟล์ CSV ที่นี่ หรือ <span className="text-sky-400 underline">คลิกเลือกไฟล์</span>
            </p>
            <p className="text-xs text-slate-400">
              รองรับไฟล์ .csv ภาษาไทย UTF-8 (เช่น ไฟล์ที่ส่งออกจากระบบแล้วนำไปแก้ไขข้อมูลใน Excel)
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <p className="font-semibold">ไม่สามารถประมวลผลไฟล์ได้</p>
              <p className="mt-0.5 text-rose-300/80">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isProcessing && (
          <div className="py-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400 mx-auto" />
            <p className="text-xs text-slate-400">กำลังอ่านและตรวจสอบข้อมูลในไฟล์ CSV...</p>
          </div>
        )}

        {/* Preview of Parsed Result */}
        {parseResult && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-semibold text-slate-100">
                    อ่านไฟล์สำเร็จ: {selectedFile?.name}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  เปลี่ยนไฟล์
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-center">
                  <div className="text-xs text-slate-400">ข้อมูลที่พบทั้งหมด</div>
                  <div className="text-base font-bold text-slate-100">{parseResult.totalParsed} รายการ</div>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
                  <div className="text-xs text-emerald-400">ปรับปรุงข้อมูลเดิม</div>
                  <div className="text-base font-bold text-emerald-300">{parseResult.updatedCount} รายการ</div>
                </div>
                <div className="p-2.5 bg-sky-500/10 rounded-lg border border-sky-500/20 text-center">
                  <div className="text-xs text-sky-400">เพิ่มภารกิจใหม่</div>
                  <div className="text-base font-bold text-sky-300">{parseResult.newCount} รายการ</div>
                </div>
              </div>
            </div>

            {/* List preview */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>ตัวอย่างข้อมูลที่จะบันทึกลงทะเบียน</span>
                <span>รวมทั้งหมด {parseResult.mergedTasks.length} รายการ</span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/60 bg-slate-900/40">
                {parseResult.mergedTasks.slice(0, 5).map((t, idx) => {
                  const statusCfg = STATUS_CONFIG[t.status];
                  return (
                    <div key={t.id || idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-800/30">
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="font-medium text-slate-200 truncate">{t.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{t.assignee}</span>
                          <span>•</span>
                          <span>ความก้าวหน้า {t.progress}%</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg?.badgeClass || 'bg-slate-700 text-slate-300'}`}>
                        {statusCfg?.label || t.status}
                      </span>
                    </div>
                  );
                })}
                {parseResult.mergedTasks.length > 5 && (
                  <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-900/60">
                    ... และอีก {parseResult.mergedTasks.length - 5} รายการ
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-sm shadow-sky-600/30 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันบันทึกข้อมูลปรับปรุงลงระบบ ({parseResult.mergedTasks.length} รายการ)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
