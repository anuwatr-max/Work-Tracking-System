import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  itemTitle?: string;
  itemSubtitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemTitle,
  itemSubtitle,
  confirmLabel = 'ยืนยันการลบ',
  cancelLabel = 'ยกเลิก',
  variant = 'danger',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="bg-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 text-slate-200 relative animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="ปิด"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className={`p-3 rounded-xl shrink-0 ${
            isDanger ? 'bg-[#451b16]/30 text-[#e57373] border border-rose-500/20' : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">
              {title}
            </h3>
            {message && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Highlighted item info if provided */}
        {itemTitle && (
          <div className="my-4 p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/80 text-sm">
            <p className="font-semibold text-slate-100 line-clamp-2">
              "{itemTitle}"
            </p>
            {itemSubtitle && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                {itemSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-700/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
              isDanger
                ? 'bg-[#d96b6b] hover:bg-[#c95b5b] text-slate-100 shadow-[#d96b6b]/20'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-100 shadow-sky-500/25'
            }`}
          >
            {isDanger && <Trash2 className="w-3.5 h-3.5" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
