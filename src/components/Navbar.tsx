import React from 'react';
import { 
  BarChart3, 
  CheckSquare, 
  FileSpreadsheet, 
  Plus, 
  Calendar,
  RotateCcw,
  Printer,
  Download,
  Upload,
  Share2,
  Eye,
  Unlock
} from 'lucide-react';
import { UserRole, SharedUser } from '../types';

interface NavbarProps {
  currentTab: 'dashboard' | 'tasks' | 'monthly_report';
  onTabChange: (tab: 'dashboard' | 'tasks' | 'monthly_report') => void;
  onAddTask: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  onImportCSV?: () => void;
  onOpenShare: () => void;
  currentRole: UserRole;
  onRoleChange?: (newRole: UserRole) => void;
  activeUser?: SharedUser | null;
  totalTasks: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onAddTask,
  onResetData,
  onExportCSV,
  onImportCSV,
  onOpenShare,
  currentRole,
  onRoleChange,
  activeUser,
  totalTasks,
}) => {
  return (
    <header className="bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="h-10 sm:h-12 flex items-center justify-center shrink-0">
              <img
                src="/logo-Nu-logistics-01.png"
                alt="ตราสัญลักษณ์ คณะโลจิสติกส์และดิจิทัลซัพพลายเชน มหาวิทยาลัยนเรศวร"
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                  ระบบติดตามงาน <span className="text-sky-400 font-medium text-sm sm:text-base">(Work Tracking System)</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  ปีงบประมาณ 2570
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 inline" />
                คณะโลจิสติกส์และดิจิทัลซัพพลายเชน มหาวิทยาลัยนเรศวร • ({totalTasks} ภารกิจในระบบ)
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Active User Badge if recognized */}
            {activeUser && (
              <div 
                id="active-user-badge" 
                title={`${activeUser.name} (${activeUser.division})`}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs"
              >
                <div className={`w-2 h-2 rounded-full ${currentRole === 'editor' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                <span className="font-medium text-slate-200 truncate max-w-[130px]">{activeUser.name}</span>
              </div>
            )}

            {/* Share & Role Management Button */}
            <button
              id="share-btn"
              onClick={onOpenShare}
              title="แชร์ระบบและจัดการสิทธิ์ผู้ใช้งาน (Editor / Viewer)"
              className="px-2.5 sm:px-3 py-2 text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700 hover:border-sky-500/50 cursor-pointer shadow-sm"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">แชร์</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                currentRole === 'editor'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}>
                {currentRole === 'editor' ? 'Editor' : 'Viewer'}
              </span>
            </button>

            <button
              id="export-csv-nav-btn"
              onClick={onExportCSV}
              title={`ส่งออกทะเบียนติดตามงาน (ทั้งหมด ${totalTasks} ภารกิจ) เป็นไฟล์ Excel / CSV`}
              className="p-2 text-slate-300 hover:text-sky-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span className="hidden lg:inline">ส่งออก CSV</span>
            </button>

            {currentRole === 'editor' && onImportCSV && (
              <button
                id="import-csv-nav-btn"
                onClick={onImportCSV}
                title="นำเข้าและบันทึกข้อมูลจากไฟล์ CSV ที่ปรับปรุงแล้ว"
                className="p-2 text-slate-300 hover:text-emerald-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline">นำเข้า CSV</span>
              </button>
            )}

            {currentRole === 'editor' && (
              <button
                id="reset-data-btn"
                onClick={onResetData}
                title="รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น"
                className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-medium transition-colors hidden xl:flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ต</span>
              </button>
            )}

            <button
              id="print-btn"
              onClick={() => window.print()}
              title="พิมพ์หน้านี้ / บันทึกเป็น PDF"
              className="p-2 text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">พิมพ์รายงาน</span>
            </button>

            {currentRole === 'editor' ? (
              <button
                id="add-task-top-btn"
                onClick={onAddTask}
                className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-100 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 transition-colors shadow-md shadow-sky-500/25 gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มงานใหม่</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="unlock-editor-navbar-btn"
                  onClick={() => onRoleChange?.('editor')}
                  title="คลิกเพื่อเปิดสิทธิ์ Editor สำหรับเครื่องนี้ทันที"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-900/30 gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-200" />
                  <span>เปิดสิทธิ์ Editor</span>
                </button>
                <button
                  id="viewer-mode-badge-btn"
                  onClick={onOpenShare}
                  title="กำลังดูในโหมด Viewer (คลิกเพื่อดูรายละเอียดสิทธิ์)"
                  className="inline-flex items-center justify-center px-2 py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition-colors gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden md:inline">โหมดผู้ดู</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-slate-800 pt-1 -mb-px overflow-x-auto no-scrollbar">
          <button
            id="tab-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'dashboard'
                ? 'border-sky-500 text-sky-400 font-semibold bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>รายงานผล DASHBOARD</span>
          </button>

          <button
            id="tab-tasks"
            onClick={() => onTabChange('tasks')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'tasks'
                ? 'border-sky-500 text-sky-400 font-semibold bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>ทะเบียนติดตามงาน (ทั้งหมด)</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs ${
              currentTab === 'tasks' ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {totalTasks}
            </span>
          </button>

          <button
            id="tab-monthly-report"
            onClick={() => onTabChange('monthly_report')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'monthly_report'
                ? 'border-sky-500 text-sky-400 font-semibold bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>สรุปผลการดำเนินงานประจำเดือน</span>
          </button>
        </div>
      </div>
    </header>
  );
};
