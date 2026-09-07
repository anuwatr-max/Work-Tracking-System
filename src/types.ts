export type UserRole = 'editor' | 'viewer';

export interface SharedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  division?: string;
  addedAt: string;
}

export type DivisionId = 'admin' | 'academic' | 'research' | 'finance';

export interface DivisionInfo {
  id: DivisionId;
  name: string;
  code: string;
  description: string;
  color: string;
  units: UnitInfo[];
}

export interface UnitInfo {
  id: string;
  divisionId: DivisionId;
  name: string;
  code: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'pending_review' | 'completed' | 'delayed';

export interface MonthInfo {
  id: string; // e.g. '2569-10'
  label: string; // 'ตุลาคม 2569'
  shortLabel: string; // 'ต.ค. 69'
  quarter: 1 | 2 | 3 | 4;
  year: number; // 2569 or 2570
}

export interface WorkTask {
  id: string;
  title: string;
  divisionId: DivisionId;
  unitId: string;
  monthId: string; // e.g. '2569-10'
  assignee: string; // ผู้รับผิดชอบ
  status: TaskStatus;
  progress: number; // 0 - 100
  startDate: string;
  dueDate: string;
  description: string; // รายละเอียด/เป้าหมาย
  output: string; // ผลการดำเนินงานประจำงวด
  issues?: string; // ปัญหา / อุปสรรค / แนวทางแก้ไข
  budget?: number; // งบประมาณ (ถ้ามี)
  priority: 'low' | 'medium' | 'high' | 'urgent';
  updatedAt: string;
}

export interface MonthlyDivisionSummary {
  id: string;
  monthId: string;
  divisionId: DivisionId;
  unitId?: string;
  summaryText: string; // สรุปผลการดำเนินงานภาพรวม
  achievements: string; // ผลงานเด่น / ความสำเร็จ
  obstacles: string; // ปัญหาและอุปสรรค
  nextPlan: string; // แผนงานและข้อเสนอแนะในเดือนถัดไป
  reporter: string; // ผู้รายงาน
  reportedDate: string;
  isCustomEdited?: boolean; // True if an editor manually typed and saved custom notes
}

export const DIVISIONS_DATA: DivisionInfo[] = [
  {
    id: 'admin',
    name: 'งานธุรการ',
    code: '1',
    description: 'บริหารจัดการงานทั่วไป แผนงาน สารบรรณ บุคลากร อาคารสถานที่และยานพาหนะ',
    color: 'emerald',
    units: [
      { id: 'admin-plan', divisionId: 'admin', name: 'หน่วยแผน', code: '1.1' },
      { id: 'admin-doc', divisionId: 'admin', name: 'หน่วยสารบรรณ', code: '1.2' },
      { id: 'admin-hr', divisionId: 'admin', name: 'หน่วยบุคคล', code: '1.3' },
      { id: 'admin-facility', divisionId: 'admin', name: 'หน่วยอาคารสถานที่และยานพาหนะ', code: '1.4' },
    ],
  },
  {
    id: 'academic',
    name: 'งานบริการการศึกษา',
    code: '2',
    description: 'จัดการเรียนการสอน ปริญญาตรี บัณฑิตศึกษา กิจการนิสิต และประชาสัมพันธ์สื่อสารองค์กร',
    color: 'blue',
    units: [
      { id: 'acad-undergrad', divisionId: 'academic', name: 'หน่วยวิชาการระดับปริญญาตรี', code: '2.1' },
      { id: 'acad-grad', divisionId: 'academic', name: 'หน่วยวิชาการระดับบัณฑิตศึกษา', code: '2.2' },
      { id: 'acad-student', divisionId: 'academic', name: 'หน่วยกิจการนิสิตและศิษย์เก่าสัมพันธ์', code: '2.3' },
      { id: 'acad-pr', divisionId: 'academic', name: 'หน่วยประชาสัมพันธ์และสื่อสารองค์กร', code: '2.4' },
    ],
  },
  {
    id: 'research',
    name: 'งานวิจัยและพัฒนาคุณภาพการศึกษา',
    code: '3',
    description: 'ส่งเสริมงานวิจัย นวัตกรรม การประกันคุณภาพการศึกษา และพัฒนาระบบเทคโนโลยีสารสนเทศ',
    color: 'purple',
    units: [
      { id: 'res-it', divisionId: 'research', name: 'หน่วยเทคโนโลยีสารสนเทศ', code: '3.1' },
      { id: 'res-research', divisionId: 'research', name: 'หน่วยวิจัย', code: '3.2' },
      { id: 'res-service', divisionId: 'research', name: 'หน่วยบริการวิชาการ', code: '3.3' },
    ],
  },
  {
    id: 'finance',
    name: 'งานการเงินและพัสดุ',
    code: '4',
    description: 'ควบคุมและบริหารงบประมาณ การเบิกจ่ายเงิน บัญชี การจัดซื้อจัดจ้าง และการบริหารพัสดุ',
    color: 'amber',
    units: [
      { id: 'fin-finance', divisionId: 'finance', name: 'หน่วยการเงิน', code: '4.1' },
      { id: 'fin-accounting', divisionId: 'finance', name: 'หน่วยบัญชี', code: '4.2' },
      { id: 'fin-supply', divisionId: 'finance', name: 'หน่วยพัสดุ', code: '4.3' },
    ],
  },
];

export const FISCAL_MONTHS: MonthInfo[] = [
  { id: '2569-10', label: 'ตุลาคม 2569', shortLabel: 'ต.ค. 69', quarter: 1, year: 2569 },
  { id: '2569-11', label: 'พฤศจิกายน 2569', shortLabel: 'พ.ย. 69', quarter: 1, year: 2569 },
  { id: '2569-12', label: 'ธันวาคม 2569', shortLabel: 'ธ.ค. 69', quarter: 1, year: 2569 },
  { id: '2570-01', label: 'มกราคม 2570', shortLabel: 'ม.ค. 70', quarter: 2, year: 2570 },
  { id: '2570-02', label: 'กุมภาพันธ์ 2570', shortLabel: 'ก.พ. 70', quarter: 2, year: 2570 },
  { id: '2570-03', label: 'มีนาคม 2570', shortLabel: 'มี.ค. 70', quarter: 2, year: 2570 },
  { id: '2570-04', label: 'เมษายน 2570', shortLabel: 'เม.ย. 70', quarter: 3, year: 2570 },
  { id: '2570-05', label: 'พฤษภาคม 2570', shortLabel: 'พ.ค. 70', quarter: 3, year: 2570 },
  { id: '2570-06', label: 'มิถุนายน 2570', shortLabel: 'มิ.ย. 70', quarter: 3, year: 2570 },
  { id: '2570-07', label: 'กรกฎาคม 2570', shortLabel: 'ก.ค. 70', quarter: 4, year: 2570 },
  { id: '2570-08', label: 'สิงหาคม 2570', shortLabel: 'ส.ค. 70', quarter: 4, year: 2570 },
  { id: '2570-09', label: 'กันยายน 2570', shortLabel: 'ก.ย. 70', quarter: 4, year: 2570 },
];

export const STATUS_CONFIG: Record<TaskStatus, { label: string; badgeClass: string; borderClass: string; dotClass: string; color: string }> = {
  completed: {
    label: 'เสร็จสิ้น',
    badgeClass: 'bg-emerald-950/30 text-emerald-300/90 border-emerald-700/25',
    borderClass: 'border-l-[#2e9369]',
    dotClass: 'bg-[#2e9369]',
    color: '#2e9369',
  },
  in_progress: {
    label: 'กำลังดำเนินการ',
    badgeClass: 'bg-slate-800/80 text-[#9bbad2] border-slate-600/40',
    borderClass: 'border-l-[#6b8fae]',
    dotClass: 'bg-[#6b8fae]',
    color: '#6b8fae',
  },
  pending_review: {
    label: 'รอตรวจ/รออนุมัติ',
    badgeClass: 'bg-[#3f3114]/35 text-[#dfbe73] border-[#9c7d37]/30',
    borderClass: 'border-l-[#c5a059]',
    dotClass: 'bg-[#c5a059]',
    color: '#c5a059',
  },
  delayed: {
    label: 'ล่าช้ากว่ากำหนด',
    badgeClass: 'bg-[#451b16]/30 text-[#e57373] border-rose-500/20',
    borderClass: 'border-l-[#e57373]',
    dotClass: 'bg-[#e57373]',
    color: '#e57373',
  },
  not_started: {
    label: 'ยังไม่เริ่ม',
    badgeClass: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
    borderClass: 'border-l-slate-500',
    dotClass: 'bg-slate-500',
    color: '#94a3b8',
  },
};
