import React from 'react';
import { 
  BarChart3, 
  CheckSquare, 
  FileSpreadsheet, 
  Plus, 
  Calendar,
  RotateCcw,
  Printer
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'tasks' | 'monthly_report';
  onTabChange: (tab: 'dashboard' | 'tasks' | 'monthly_report') => void;
  onAddTask: () => void;
  onResetData: () => void;
  totalTasks: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onAddTask,
  onResetData,
  totalTasks,
}) => {
  return (
    <header className="bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <span className="text-xl font-black">W</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  ระบบติดตามงาน <span className="text-amber-500 font-medium text-sm sm:text-base">(Work Tracking System)</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ปีงบประมาณ 2570
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 inline" />
                ประจำเดือน ตุลาคม 2569 – กันยายน 2570 • ({totalTasks} ภารกิจในระบบ)
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              id="reset-data-btn"
              onClick={onResetData}
              title="รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น"
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-medium transition-colors hidden sm:flex items-center gap-1 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตข้อมูล</span>
            </button>

            <button
              id="print-btn"
              onClick={() => window.print()}
              title="พิมพ์หน้านี้ / บันทึกเป็น PDF"
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">พิมพ์รายงาน</span>
            </button>

            <button
              id="add-task-top-btn"
              onClick={onAddTask}
              className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 transition-colors shadow-md shadow-amber-500/20 gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มงานใหม่</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-slate-800 pt-1 -mb-px overflow-x-auto no-scrollbar">
          <button
            id="tab-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'dashboard'
                ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
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
                ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>ทะเบียนติดตามงาน (ทั้งหมด)</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs ${
              currentTab === 'tasks' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {totalTasks}
            </span>
          </button>

          <button
            id="tab-monthly-report"
            onClick={() => onTabChange('monthly_report')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'monthly_report'
                ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
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
