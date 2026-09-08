import { WorkTask, MonthlyDivisionSummary, DivisionId, DIVISIONS_DATA, FISCAL_MONTHS } from '../types';

/**
 * Automatically compiles executive summary, key achievements, obstacles, and next steps
 * from real tasks in the task register (WorkTask[]) for a given month and division.
 */
export function compileSummaryFromTasks(
  monthId: string,
  divisionId: DivisionId,
  tasks: WorkTask[],
  existingSummary?: MonthlyDivisionSummary
): {
  summaryText: string;
  achievements: string;
  obstacles: string;
  nextPlan: string;
} {
  const monthInfo = FISCAL_MONTHS.find((m) => m.id === monthId) || { label: monthId };
  const divisionInfo = DIVISIONS_DATA.find((d) => d.id === divisionId) || { name: divisionId };

  // Filter tasks for this specific month and division
  const divTasks = tasks.filter((t) => t.monthId === monthId && t.divisionId === divisionId);
  const total = divTasks.length;
  const completedTasks = divTasks.filter((t) => t.status === 'completed');
  const inProgressTasks = divTasks.filter((t) => t.status === 'in_progress');
  const delayedTasks = divTasks.filter((t) => t.status === 'delayed');
  const pendingTasks = divTasks.filter((t) => t.status === 'pending_review');
  const notStartedTasks = divTasks.filter((t) => t.status === 'not_started');

  const completedCount = completedTasks.length;
  const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // 1. Executive Summary Text
  let summaryText = '';
  if (total === 0) {
    summaryText = `${divisionInfo.name} ในเดือน${monthInfo.label} ยังไม่มีภารกิจที่กำหนดส่งในงวดนี้ อยู่ระหว่างเตรียมการดำเนินงานตามแผนประจำปี`;
  } else {
    const statusParts: string[] = [];
    if (completedCount > 0) statusParts.push(`ดำเนินการแล้วเสร็จ ${completedCount} รายการ (${rate}%)`);
    if (inProgressTasks.length > 0) statusParts.push(`อยู่ระหว่างดำเนินการ ${inProgressTasks.length} รายการ`);
    if (pendingTasks.length > 0) statusParts.push(`รอตรวจ/อนุมัติ ${pendingTasks.length} รายการ`);
    if (delayedTasks.length > 0) statusParts.push(`ล่าช้ากว่ากำหนด ${delayedTasks.length} รายการ`);
    if (notStartedTasks.length > 0) statusParts.push(`ยังไม่เริ่ม ${notStartedTasks.length} รายการ`);

    const statusDetail = statusParts.join(', ');
    summaryText = `${divisionInfo.name} ในเดือน${monthInfo.label} มีภารกิจในทะเบียนติดตามงานทั้งหมด ${total} รายการ (${statusDetail}) การขับเคลื่อนงานภาพรวมมีความก้าวหน้าร้อยละ ${rate} และดำเนินงานสอดคล้องตามแผนปฏิบัติการของคณะ`;
  }

  // 2. Key Achievements (ผลงานสำคัญ / ความสำเร็จเด่น)
  const achievementItems: string[] = [];
  completedTasks.forEach((t, idx) => {
    const outputDetail = t.output && t.output.trim() ? ` — ผลสัมฤทธิ์: ${t.output}` : ' — ดำเนินการแล้วเสร็จสมบูรณ์ 100%';
    achievementItems.push(`${idx + 1}. ${t.title} (${t.assignee})${outputDetail}`);
  });

  // If no completed tasks yet, check high-progress tasks
  if (achievementItems.length === 0) {
    const highProgress = inProgressTasks.filter((t) => t.progress >= 70);
    if (highProgress.length > 0) {
      highProgress.forEach((t, idx) => {
        achievementItems.push(`${idx + 1}. ${t.title} (ก้าวหน้า ${t.progress}%) — ${t.output || 'อยู่ระหว่างเร่งรัดขั้นสุดท้าย'}`);
      });
    }
  }

  const achievements = achievementItems.length > 0
    ? achievementItems.join('\n')
    : existingSummary?.achievements || 'อยู่ระหว่างดำเนินงานตามแผนงานประจำเดือน ยังไม่มีภารกิจที่เสร็จสิ้นสมบูรณ์';

  // 3. Issues & Obstacles (ปัญหาและอุปสรรค)
  const obstacleItems: string[] = [];
  delayedTasks.forEach((t, idx) => {
    const issueText = t.issues && t.issues.trim() ? t.issues : 'งานมีความล่าช้ากว่ากำหนดเวลาที่วางไว้ อยู่ระหว่างเร่งรัดติดตาม';
    obstacleItems.push(`${idx + 1}. ${t.title} (สถานะ: ล่าช้า) — ปัญหา: ${issueText}`);
  });

  // Also check tasks with issues explicitly reported
  divTasks
    .filter((t) => t.status !== 'delayed' && t.issues && t.issues.trim())
    .forEach((t, idx) => {
      obstacleItems.push(`${delayedTasks.length + idx + 1}. ${t.title} — ข้อจำกัด: ${t.issues}`);
    });

  const obstacles = obstacleItems.length > 0
    ? obstacleItems.join('\n')
    : (existingSummary?.obstacles && existingSummary.obstacles !== 'ไม่มีปัญหาหรืออุปสรรคที่ต้องรายงาน'
        ? existingSummary.obstacles
        : 'ไม่มีปัญหาหรืออุปสรรคสำคัญที่ส่งผลกระทบต่อเป้าหมาย การดำเนินงานเป็นไปตามแผน');

  // 4. Next Steps (แผนงานในเดือนถัดไป)
  const nextPlanItems: string[] = [];
  const ongoing = [...inProgressTasks, ...notStartedTasks, ...pendingTasks];
  if (ongoing.length > 0) {
    ongoing.slice(0, 4).forEach((t, idx) => {
      nextPlanItems.push(`${idx + 1}. เร่งรัดภารกิจ "${t.title}" ของ${t.assignee} (ความคืบหน้าปัจจุบัน ${t.progress}%) ให้เสร็จสิ้นตามกำหนด`);
    });
  }

  if (nextPlanItems.length === 0) {
    nextPlanItems.push('1. เตรียมการวางแผนงานและโครงการสำหรับเดือนถัดไป');
    nextPlanItems.push('2. ติดตามการประเมินผลการปฏิบัติราชการประจำไตรมาส');
  }

  const nextPlan = nextPlanItems.join('\n');

  return {
    summaryText,
    achievements,
    obstacles,
    nextPlan,
  };
}

/**
 * Creates or updates a MonthlyDivisionSummary by synchronizing with tasks in the register.
 */
export function buildSyncedSummary(
  monthId: string,
  divisionId: DivisionId,
  tasks: WorkTask[],
  existingSummary?: MonthlyDivisionSummary
): MonthlyDivisionSummary {
  const compiled = compileSummaryFromTasks(monthId, divisionId, tasks, existingSummary);
  const divInfo = DIVISIONS_DATA.find((d) => d.id === divisionId);

  return {
    id: existingSummary?.id || `sum-${monthId}-${divisionId}`,
    monthId,
    divisionId,
    summaryText: compiled.summaryText,
    achievements: compiled.achievements,
    obstacles: compiled.obstacles,
    nextPlan: compiled.nextPlan,
    reporter: existingSummary?.reporter || `หัวหน้า${divInfo?.name || 'งาน'}`,
    reportedDate: new Date().toISOString().split('T')[0],
  };
}
