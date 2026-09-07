import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Eye, 
  Edit3, 
  Users, 
  UserPlus, 
  Trash2, 
  ExternalLink,
  Info,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react';
import { UserRole, SharedUser } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  sharedUsers: SharedUser[];
  onSaveSharedUsers: (users: SharedUser[]) => void;
  onShowToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChange,
  sharedUsers,
  onSaveSharedUsers,
  onShowToast,
}) => {
  const [copiedType, setCopiedType] = useState<'editor' | 'viewer' | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDivision, setNewDivision] = useState('งานธุรการ (1)');
  const [newRole, setNewRole] = useState<UserRole>('editor');
  const [isAddingUser, setIsAddingUser] = useState(false);

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

  // Generate shareable URLs
  const getShareUrl = (role: UserRole) => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?role=${role}`;
  };

  const editorUrl = getShareUrl('editor');
  const viewerUrl = getShareUrl('viewer');

  const handleCopyLink = async (role: UserRole) => {
    const url = getShareUrl(role);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedType(role);
      onShowToast(`คัดลอกลิงก์สิทธิ์ ${role === 'editor' ? 'Editor (ผู้แก้ไข)' : 'Viewer (ผู้เข้าชม)'} เรียบร้อยแล้ว`);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
      onShowToast('ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตนเอง');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newUser: SharedUser = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim() || '-',
      role: newRole,
      division: newDivision,
      addedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...sharedUsers, newUser];
    onSaveSharedUsers(updated);
    setNewName('');
    setNewEmail('');
    setIsAddingUser(false);
    onShowToast(`เพิ่มผู้ใช้งาน "${newUser.name}" สิทธิ์ ${newRole === 'editor' ? 'Editor' : 'Viewer'} สำเร็จ`);
  };

  const handleDeleteUser = (userId: string) => {
    const target = sharedUsers.find((u) => u.id === userId);
    const updated = sharedUsers.filter((u) => u.id !== userId);
    onSaveSharedUsers(updated);
    onShowToast(`นำ "${target?.name || 'ผู้ใช้งาน'}" ออกจากรายชื่อแล้ว`);
  };

  const handleToggleUserRole = (userId: string) => {
    const updated = sharedUsers.map((u) => {
      if (u.id === userId) {
        const nextRole: UserRole = u.role === 'editor' ? 'viewer' : 'editor';
        return { ...u, role: nextRole };
      }
      return u;
    });
    onSaveSharedUsers(updated);
    onShowToast(`ปรับปรุงสิทธิ์เรียบร้อยแล้ว`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-[#1e293b] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-700 text-slate-200 relative my-auto animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                แชร์ระบบและจัดการสิทธิ์การใช้งาน
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  สิทธิ์ Editor & Viewer
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                คณะโลจิสติกส์และดิจิทัลซัพพลายเชน มหาวิทยาลัยนเรศวร • ระบบติดตามงาน 2570
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-5 py-4 pr-1 text-sm flex-1 custom-scrollbar">
          {/* Active User Current Role Card */}
          <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 block font-medium">สิทธิ์การใช้งานในเครื่องนี้ (Active Role)</span>
                <div className="flex items-center gap-2 mt-1">
                  {currentRole === 'editor' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      สิทธิ์: Editor (ผู้แก้ไข - สามารถเพิ่ม แก้ไข ลบ นำเข้าได้เต็มรูปแบบ)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      สิทธิ์: Viewer (ผู้เข้าชม - ดูสถิติ ค้นหา และส่งออกข้อมูลอย่างเดียว)
                    </span>
                  )}
                </div>
              </div>

              {/* Role Switcher Button */}
              <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 shrink-0">
                <button
                  id="switch-to-editor-btn"
                  onClick={() => {
                    onRoleChange('editor');
                    onShowToast('สลับเป็นสิทธิ์ "Editor (ผู้แก้ไข)" แล้ว');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRole === 'editor'
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor (ผู้แก้ไข)</span>
                </button>
                <button
                  id="switch-to-viewer-btn"
                  onClick={() => {
                    onRoleChange('viewer');
                    onShowToast('สลับเป็นสิทธิ์ "Viewer (ผู้เข้าชม)" แล้ว');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRole === 'viewer'
                      ? 'bg-sky-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Viewer (ผู้เข้าชม)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Share Links by Role Section */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              ลิงก์แชร์ระบบพร้อมกำหนดสิทธิ์ (Share Links)
            </h3>

            {/* Editor Link Box */}
            <div className="bg-gradient-to-r from-emerald-950/30 to-slate-900/60 border border-emerald-500/30 rounded-xl p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-emerald-300 text-sm flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    ลิงก์สำหรับผู้แก้ไข (Editor Link — สิทธิ์เต็ม)
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  สำหรับผู้ปฏิบัติงาน / คณะทำงาน
                </span>
              </div>
              <p className="text-xs text-slate-300">
                ผู้เปิดลิงก์นี้จะมีสิทธิ์ <strong>Editor</strong>: เพิ่มภารกิจ, แก้ไขความก้าวหน้า/ผลลัพธ์, ลบงาน, นำเข้า CSV และบันทึกรายงานสรุปประจำเดือน
              </p>
              <div className="flex items-center gap-2">
                <input
                  id="share-editor-url-input"
                  type="text"
                  readOnly
                  value={editorUrl}
                  className="flex-1 bg-slate-900/90 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono select-all focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <button
                  id="copy-editor-url-btn"
                  onClick={() => handleCopyLink('editor')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-900/30 cursor-pointer"
                >
                  {copiedType === 'editor' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Viewer Link Box */}
            <div className="bg-slate-900/50 border border-slate-700/80 rounded-xl p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="font-semibold text-sky-300 text-sm flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-sky-400" />
                    ลิงก์สำหรับผู้เข้าชม (Viewer Link — ดูอย่างเดียว)
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  สำหรับผู้บริหาร / ตรวจสอบงาน
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ผู้เปิดลิงก์นี้จะมีสิทธิ์ <strong>Viewer</strong>: ดู Dashboard สถิติภาพรวม, ค้นหากรองงาน, เปิดอ่านรายละเอียด และส่งออก CSV ได้โดยไม่สามารถเผลอกดแก้ไขหรือลบข้อมูล
              </p>
              <div className="flex items-center gap-2">
                <input
                  id="share-viewer-url-input"
                  type="text"
                  readOnly
                  value={viewerUrl}
                  className="flex-1 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono select-all focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <button
                  id="copy-viewer-url-btn"
                  onClick={() => handleCopyLink('viewer')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedType === 'viewer' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-sky-400">คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Comparison / Permission Details Table */}
          <div className="border border-slate-700/70 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-800/80 px-4 py-2 font-medium text-slate-300 flex items-center justify-between border-b border-slate-700/70">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                ตารางเปรียบเทียบสิทธิ์การใช้งาน (Permissions Matrix)
              </span>
            </div>
            <div className="divide-y divide-slate-800">
              <div className="grid grid-cols-12 px-4 py-2 bg-slate-900/40 font-medium text-slate-400">
                <span className="col-span-6">ฟังก์ชันการทำงาน</span>
                <span className="col-span-3 text-center text-emerald-400 font-semibold">Editor (ผู้แก้ไข)</span>
                <span className="col-span-3 text-center text-sky-400 font-semibold">Viewer (ผู้เข้าชม)</span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 items-center hover:bg-slate-800/30">
                <span className="col-span-6 text-slate-200">ดู Dashboard ภาพรวม และสถิติความก้าวหน้า</span>
                <span className="col-span-3 text-center text-emerald-400">✓ อนุญาต</span>
                <span className="col-span-3 text-center text-sky-400">✓ อนุญาต</span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 items-center hover:bg-slate-800/30">
                <span className="col-span-6 text-slate-200">ค้นหา กรอง และเปิดดูรายละเอียดภารกิจ</span>
                <span className="col-span-3 text-center text-emerald-400">✓ อนุญาต</span>
                <span className="col-span-3 text-center text-sky-400">✓ อนุญาต</span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 items-center hover:bg-slate-800/30">
                <span className="col-span-6 text-slate-200">ส่งออกข้อมูลทะเบียนงาน (Excel / CSV) และพิมพ์รายงาน</span>
                <span className="col-span-3 text-center text-emerald-400">✓ อนุญาต</span>
                <span className="col-span-3 text-center text-sky-400">✓ อนุญาต</span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 items-center hover:bg-slate-800/30">
                <span className="col-span-6 text-slate-200">เพิ่มงานใหม่ และแก้ไขรายละเอียดงาน</span>
                <span className="col-span-3 text-center text-emerald-400 font-bold">✓ อนุญาต</span>
                <span className="col-span-3 text-center text-slate-500">✗ ปิดสิทธิ์</span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 items-center hover:bg-slate-800/30">
                <span className="col-span-6 text-slate-200">เปลี่ยนสถานะด่วนและเปอร์เซ็นต์ความก้าวหน้า</span>
                <span className="col-span-3 text-center text-emerald-400 font-bold">✓ อนุญาต</span>
                <span className="col-span-3 text-center text-slate-500">✗ ปิดสิทธิ์</span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 items-center hover:bg-slate-800/30">
                <span className="col-span-6 text-slate-200">นำเข้าข้อมูลไฟล์ CSV (CSV Import / Sync)</span>
                <span className="col-span-3 text-center text-emerald-400 font-bold">✓ อนุญาต</span>
                <span className="col-span-3 text-center text-slate-500">✗ ปิดสิทธิ์</span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 items-center hover:bg-slate-800/30">
                <span className="col-span-6 text-slate-200">เขียนและบันทึกรายงานสรุปประจำเดือน</span>
                <span className="col-span-3 text-center text-emerald-400 font-bold">✓ อนุญาต</span>
                <span className="col-span-3 text-center text-slate-500">✗ ปิดสิทธิ์</span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 items-center hover:bg-slate-800/30">
                <span className="col-span-6 text-slate-200">ลบภารกิจออกจากระบบ</span>
                <span className="col-span-3 text-center text-emerald-400 font-bold">✓ อนุญาต</span>
                <span className="col-span-3 text-center text-slate-500">✗ ปิดสิทธิ์</span>
              </div>
            </div>
          </div>

          {/* Authorized Team Members & Editors */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                รายชื่อผู้ประสานงานและผู้มีสิทธิ์ Editor ประจำหน่วยงาน ({sharedUsers.length} ท่าน)
              </h3>
              <button
                id="toggle-add-user-btn"
                onClick={() => setIsAddingUser(!isAddingUser)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAddingUser ? 'ซ่อนฟอร์ม' : '+ เพิ่มผู้มีสิทธิ์'}</span>
              </button>
            </div>

            {/* Add User Form */}
            {isAddingUser && (
              <form onSubmit={handleAddUser} className="bg-slate-900/80 border border-slate-700 p-3.5 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-medium text-slate-300">เพิ่มรายชื่อผู้ได้รับสิทธิ์ใหม่:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ชื่อ - นามสกุล / ตำแหน่ง</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น อ. ดร. อนุวัฒน์..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">อีเมลหน่วยงาน (@nu.ac.th)</label>
                    <input
                      type="email"
                      placeholder="anuwatr@nu.ac.th"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">งานหลัก / หน่วยงาน</label>
                    <select
                      value={newDivision}
                      onChange={(e) => setNewDivision(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="งานธุรการ (1)">1. งานธุรการ</option>
                      <option value="งานบริการการศึกษา (2)">2. งานบริการการศึกษา</option>
                      <option value="งานวิจัยและพัฒนาคุณภาพการศึกษา (3)">3. งานวิจัยและพัฒนาคุณภาพการศึกษา</option>
                      <option value="งานการเงินและพัสดุ (4)">4. งานการเงินและพัสดุ</option>
                      <option value="คณะผู้บริหาร / กองบริหาร">คณะผู้บริหาร / ส่วนกลาง</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ระดับสิทธิ์</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="editor">Editor (ผู้แก้ไข - บันทึก/ลบ/นำเข้าได้)</option>
                      <option value="viewer">Viewer (ผู้เข้าชม - ดูอย่างเดียว)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingUser(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    บันทึกผู้ใช้งาน
                  </button>
                </div>
              </form>
            )}

            {/* List of Shared Users */}
            <div className="space-y-2">
              {sharedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      user.role === 'editor' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
                    }`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-200 text-xs sm:text-sm truncate flex items-center gap-2">
                        <span>{user.name}</span>
                        {user.id === 'user-1' && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                            ผู้ดูแลหลัก
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {user.division} {user.email !== '-' && `• ${user.email}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleUserRole(user.id)}
                      title="คลิกเพื่อสลับสิทธิ์ระหว่าง Editor และ Viewer"
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                        user.role === 'editor'
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/40'
                          : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      {user.role === 'editor' ? (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-400" />
                          <span>Editor</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Viewer</span>
                        </>
                      )}
                    </button>

                    {user.id !== 'user-1' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        title="ลบออกจากรายชื่อ"
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Studio / Cloud Run Note */}
          <div className="p-3 bg-sky-950/20 border border-sky-500/20 rounded-xl flex items-start gap-2.5 text-xs text-sky-300/90">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong>คำแนะนำ:</strong> เมื่อส่งลิงก์ให้ผู้ร่วมงานใช้งาน หากส่งลิงก์ที่มี <code className="bg-sky-900/40 px-1 py-0.5 rounded text-sky-200">?role=editor</code> ผู้ร่วมงานจะได้รับสิทธิ์แก้ไขภารกิจทันทีโดยไม่ต้องตั้งค่าเพิ่มเติม หรือผู้ใช้งานสามารถเปิดเมนู <strong>"แชร์ (Share)"</strong> เพื่อสลับสิทธิ์ได้ตลอดเวลา
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            สิทธิ์ปัจจุบัน: <strong className="text-slate-300">{currentRole === 'editor' ? 'Editor (ผู้แก้ไข)' : 'Viewer (ดูอย่างเดียว)'}</strong>
          </span>
          <button
            id="close-share-dialog-bottom-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
