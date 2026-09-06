import React, { useState, useMemo } from 'react';
import { 
  WorkTask, 
  DIVISIONS_DATA, 
  FISCAL_MONTHS, 
  STATUS_CONFIG, 
  DivisionId,
  TaskStatus
} from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PlayCircle, 
  Layers, 
  ChevronRight,
  Filter,
  TrendingUp,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';

interface DashboardProps {
  tasks: WorkTask[];
  onSelectDivision: (divId: DivisionId) => void;
  onSelectMonth: (monthId: string) => void;
  onEditTask: (task: WorkTask) => void;
  onViewAllTasks: () => void;
  onViewMonthlyReport: (monthId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  onSelectDivision,
  onSelectMonth,
  onEditTask,
  onViewAllTasks,
  onViewMonthlyReport,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');

  // Filter tasks based on selected month or quarter
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedMonth !== 'all' && t.monthId !== selectedMonth) {
        return false;
      }
      if (selectedQuarter !== 'all') {
        const monthObj = FISCAL_MONTHS.find(m => m.id === t.monthId);
        if (monthObj && String(monthObj.quarter) !== selectedQuarter) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedMonth, selectedQuarter]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status === 'completed').length;
    const inProgress = filteredTasks.filter((t) => t.status === 'in_progress').length;
    const pending = filteredTasks.filter((t) => t.status === 'pending_review').length;
    const delayed = filteredTasks.filter((t) => t.status === 'delayed').length;
    const notStarted = filteredTasks.filter((t) => t.status === 'not_started').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      delayed,
      notStarted,
      completionRate,
    };
  }, [filteredTasks]);

  // Division performance data for BarChart
  const divisionChartData = useMemo(() => {
    return DIVISIONS_DATA.map((div) => {
      const divTasks = filteredTasks.filter((t) => t.divisionId === div.id);
      const total = divTasks.length;
      const completed = divTasks.filter((t) => t.status === 'completed').length;
      const inProgress = divTasks.filter((t) => t.status === 'in_progress').length;
      const delayed = divTasks.filter((t) => t.status === 'delayed').length;
      const pending = divTasks.filter((t) => t.status === 'pending_review').length;
      const notStarted = divTasks.filter((t) => t.status === 'not_started').length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        name: div.name,
        code: div.code,
        completed,
        inProgress,
        delayed,
        pending,
        notStarted,
        total,
        percent,
      };
    });
  }, [filteredTasks]);

  // Status breakdown data for PieChart
  const pieChartData = useMemo(() => {
    return [
      { name: 'เสร็จสิ้น', value: stats.completed, color: STATUS_CONFIG.completed.color },
      { name: 'กำลังดำเนินการ', value: stats.inProgress, color: STATUS_CONFIG.in_progress.color },
      { name: 'รอตรวจ/อนุมัติ', value: stats.pending, color: STATUS_CONFIG.pending_review.color },
      { name: 'ล่าช้ากว่ากำหนด', value: stats.delayed, color: STATUS_CONFIG.delayed.color },
      { name: 'ยังไม่เริ่ม', value: stats.notStarted, color: STATUS_CONFIG.not_started.color },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Monthly trend across the entire fiscal year
  const monthlyTrendData = useMemo(() => {
    return FISCAL_MONTHS.map((m) => {
      const monthTasks = tasks.filter((t) => t.monthId === m.id);
      const completed = monthTasks.filter((t) => t.status === 'completed').length;
      const ongoing = monthTasks.filter((t) => t.status === 'in_progress' || t.status === 'pending_review').length;
      const delayed = monthTasks.filter((t) => t.status === 'delayed').length;

      return {
        name: m.shortLabel,
        monthId: m.id,
        total: monthTasks.length,
        completed,
        ongoing,
        delayed,
      };
    });
  }, [tasks]);

  // Delayed / urgent watchlist
  const delayedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'delayed' || (t.priority === 'urgent' && t.status !== 'completed'));
  }, [tasks]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Filter & Period Bar */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              ภาพรวมผลการดำเนินงาน ประจำปีงบประมาณ 2570
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            ติดตามความก้าวหน้า 4 งานหลัก และ 14 หน่วยงานย่อย (ตุลาคม 2569 – กันยายน 2570)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>กรองตามงวด:</span>
          </div>

          <select
            id="filter-quarter-select"
            value={selectedQuarter}
            onChange={(e) => {
              setSelectedQuarter(e.target.value);
              setSelectedMonth('all');
            }}
            className="text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-200 hover:bg-slate-700/80 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">ทุกไตรมาส (ทั้งปี 2570)</option>
            <option value="1">ไตรมาสที่ 1 (ต.ค. - ธ.ค. 69)</option>
            <option value="2">ไตรมาสที่ 2 (ม.ค. - มี.ค. 70)</option>
            <option value="3">ไตรมาสที่ 3 (เม.ย. - มิ.ย. 70)</option>
            <option value="4">ไตรมาสที่ 4 (ก.ค. - ก.ย. 70)</option>
          </select>

          <select
            id="filter-month-select"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              if (e.target.value !== 'all') {
                setSelectedQuarter('all');
              }
            }}
            className="text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-200 hover:bg-slate-700/80 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">ทุกเดือน (ต.ค. 69 - ก.ย. 70)</option>
            {FISCAL_MONTHS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          {selectedMonth !== 'all' && (
            <button
              onClick={() => onViewMonthlyReport(selectedMonth)}
              className="text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 border border-sky-500/20"
            >
              <span>ดูสรุปประจำเดือนนี้</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">ภารกิจทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-slate-100">{stats.total}</div>
            <div className="text-xs text-slate-400 mt-1">
              ครอบคลุม 14 หน่วยงาน
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#3eb489]">ดำเนินการแล้วเสร็จ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/30 text-[#3eb489] flex items-center justify-center border border-emerald-700/25">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#3eb489]">{stats.completed}</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-700/25">
                {stats.completionRate}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-[#2e9369] h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9bbad2]">กำลังดำเนินการ</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-[#9bbad2] flex items-center justify-center border border-slate-600/40">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-[#9bbad2]">{stats.inProgress}</div>
            <div className="text-xs text-[#9bbad2]/80 mt-1 font-medium">
              คิดเป็น {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}% ของงาน
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#dfbe73]">รอตรวจ/รออนุมัติ</span>
            <div className="w-8 h-8 rounded-lg bg-[#3f3114]/35 text-[#dfbe73] flex items-center justify-center border border-[#9c7d37]/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-[#dfbe73]">{stats.pending}</div>
            <div className="text-xs text-[#dfbe73]/80 mt-1">
              อยู่ระหว่างประเมินผล
            </div>
          </div>
        </div>

        {/* Delayed */}
        <div className={`rounded-xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1 ${
          stats.delayed > 0 ? 'bg-[#3b1915]/20 border-rose-500/20' : 'bg-[#1e293b] border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#e57373]">ล่าช้ากว่ากำหนด</span>
            <div className="w-8 h-8 rounded-lg bg-[#451b16]/30 text-[#e57373] flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#e57373]">{stats.delayed}</span>
              {stats.delayed > 0 && (
                <span className="text-xs font-bold text-[#e57373] px-1.5 py-0.5 rounded-md bg-[#451b16]/40 border border-rose-500/20">
                  ต้องเร่งรัด
                </span>
              )}
            </div>
            <div className="text-xs text-[#e57373]/80 mt-1">
              ยังไม่แล้วเสร็จตามแผน
            </div>
          </div>
        </div>
      </div>

      {/* Main Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Division Breakdown (BarChart) */}
        <div className="lg:col-span-2 bg-[#1e293b] rounded-xl border border-slate-700 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b border-slate-700/60 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                สถานะผลการดำเนินงาน เปรียบเทียบ 4 งานหลัก
              </h3>
              <p className="text-xs text-slate-400">
                สัดส่วนงานที่เสร็จสิ้น กำลังดำเนินการ และล่าช้าของแต่ละส่วนงาน
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={divisionChartData}
                margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '8px', 
                    border: '1px solid #475569', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#cbd5e1' }} 
                />
                <Bar dataKey="completed" name="เสร็จสิ้น" stackId="a" fill={STATUS_CONFIG.completed.color} radius={[0, 0, 0, 0]} />
                <Bar dataKey="inProgress" name="กำลังดำเนินการ" stackId="a" fill={STATUS_CONFIG.in_progress.color} />
                <Bar dataKey="pending" name="รอตรวจ/อนุมัติ" stackId="a" fill={STATUS_CONFIG.pending_review.color} />
                <Bar dataKey="delayed" name="ล่าช้า" stackId="a" fill={STATUS_CONFIG.delayed.color} />
                <Bar dataKey="notStarted" name="ยังไม่เริ่ม" stackId="a" fill={STATUS_CONFIG.not_started.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Proportion (PieChart) */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-2 pb-3 border-b border-slate-700/60">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              สัดส่วนสถานะงานภาพรวม
            </h3>
            <p className="text-xs text-slate-400">
              ร้อยละของสถานะงานทั้งหมดในระบบ
            </p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} รายการ`, 'จำนวน']}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '8px', 
                    border: '1px solid #475569', 
                    color: '#f8fafc',
                    fontSize: '12px' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-100">{stats.completionRate}%</span>
              <span className="text-[10px] text-slate-400">อัตราสำเร็จ</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
            {pieChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-100">
                  {item.value} รายการ ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Fiscal Year 12-Month Trend (ต.ค. 69 - ก.ย. 70) */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b border-slate-700/60 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              แนวโน้มและการกระจายตัวของภารกิจประจำเดือน (ตุลาคม 2569 – กันยายน 2570)
            </h3>
            <p className="text-xs text-slate-400">
              แสดงจำนวนภารกิจทั้งหมดเทียบกับงานที่เสร็จสิ้นในแต่ละเดือนตลอดทั้งปีงบประมาณ
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={STATUS_CONFIG.completed.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={STATUS_CONFIG.completed.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  borderRadius: '8px', 
                  border: '1px solid #475569', 
                  color: '#f8fafc',
                  fontSize: '12px' 
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px', color: '#cbd5e1' }} />
              <Area type="monotone" dataKey="total" name="ภารกิจทั้งหมดในเดือน" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
              <Area type="monotone" dataKey="completed" name="เสร็จสิ้นแล้ว" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Division Status Cards with 14 Units Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              ผลการดำเนินงานแยกตาม 4 งานหลัก (14 หน่วยงานย่อย)
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              โครงสร้างองค์กรและการกระจายภารกิจตามสายงาน
            </p>
          </div>
          <button
            onClick={onViewAllTasks}
            className="text-xs sm:text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>ดูรายการทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {DIVISIONS_DATA.map((division) => {
            const divTasks = tasks.filter((t) => t.divisionId === division.id);
            const total = divTasks.length;
            const completed = divTasks.filter((t) => t.status === 'completed').length;
            const inProgress = divTasks.filter((t) => t.status === 'in_progress').length;
            const delayed = divTasks.filter((t) => t.status === 'delayed').length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div 
                key={division.id} 
                className="bg-[#1e293b] rounded-xl border border-slate-700 p-5 shadow-sm hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-800 text-sky-400 font-bold text-sm flex items-center justify-center border border-slate-700">
                      {division.code}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">{division.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{division.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectDivision(division.id)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors"
                  >
                    ดูงาน
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300">ความสำเร็จภาพรวม:</span>
                    <span className="font-bold text-slate-100">{percent}% ({completed}/{total} งาน)</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-sky-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Units List */}
                <div className="mt-4 pt-3 border-t border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    หน่วยงานย่อย ({division.units.length} หน่วย):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {division.units.map((unit) => {
                      const unitTasks = tasks.filter((t) => t.unitId === unit.id);
                      const unitCompleted = unitTasks.filter((t) => t.status === 'completed').length;
                      return (
                        <div 
                          key={unit.id}
                          className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs text-slate-300"
                        >
                          <div className="truncate pr-2">
                            <span className="font-medium text-slate-200 text-xs truncate block">
                              {unit.code} {unit.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                            {unitCompleted}/{unitTasks.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Status Tags */}
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      เสร็จ {completed}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      กำลังทำ {inProgress}
                    </span>
                    {delayed > 0 && (
                      <span className="flex items-center gap-1 text-[#e57373] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#e57373]"></span>
                        ล่าช้า {delayed}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delayed & Urgent Watchlist */}
      {delayedTasks.length > 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-rose-500/20 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-500/15">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#e57373]" />
              <div>
                <h3 className="font-bold text-slate-100 text-base">
                  ภารกิจที่ล่าช้าหรือต้องเร่งรัดติดตาม ({delayedTasks.length} รายการ)
                </h3>
                <p className="text-xs text-slate-400">
                  รายการที่ต้องการการสนับสนุน หรือเร่งรัดให้ทันกำหนดเวลา
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800/80 text-slate-300 uppercase font-semibold text-xs border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">ชื่องาน / ภารกิจ</th>
                  <th className="px-3 py-2.5">หน่วยงาน</th>
                  <th className="px-3 py-2.5">ผู้รับผิดชอบ</th>
                  <th className="px-3 py-2.5">กำหนดส่ง</th>
                  <th className="px-3 py-2.5">สถานะ / ปัญหาอุปสรรค</th>
                  <th className="px-3 py-2.5 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {delayedTasks.map((t) => {
                  const div = DIVISIONS_DATA.find((d) => d.id === t.divisionId);
                  const unit = div?.units.find((u) => u.id === t.unitId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-100">
                        <div>{t.title}</div>
                        <div className="text-xs text-slate-400 font-normal">
                          ความก้าวหน้า {t.progress}%
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-300 text-xs">
                        <div className="font-medium text-slate-200">{unit?.name || div?.name}</div>
                        <div className="text-[11px] text-slate-500">{div?.name}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-300 text-xs font-medium whitespace-nowrap">
                        {t.assignee}
                      </td>
                      <td className="px-3 py-3 text-slate-300 text-xs whitespace-nowrap">
                        {t.dueDate}
                      </td>
                      <td className="px-3 py-3 max-w-xs text-xs">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mb-1 ${STATUS_CONFIG[t.status].badgeClass}`}>
                          {STATUS_CONFIG[t.status].label}
                        </span>
                        {t.issues && (
                          <div className="text-[#e57373] text-xs line-clamp-1 italic">
                            ⚠️ {t.issues}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onEditTask(t)}
                          className="text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 rounded-lg transition-colors border border-sky-500/20"
                        >
                          อัปเดตงาน
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
