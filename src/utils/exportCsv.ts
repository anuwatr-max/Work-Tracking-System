import { WorkTask, DIVISIONS_DATA, FISCAL_MONTHS, STATUS_CONFIG, TaskStatus, DivisionId } from '../types';

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'เร่งด่วนที่สุด',
  high: 'ความสำคัญสูง',
  medium: 'ปานกลาง',
  low: 'ปกติ',
};

const REVERSE_PRIORITY_LABELS: Record<string, 'urgent' | 'high' | 'medium' | 'low'> = {
  'เร่งด่วนที่สุด': 'urgent',
  'ความสำคัญสูง': 'high',
  'ปานกลาง': 'medium',
  'ปกติ': 'low',
  'urgent': 'urgent',
  'high': 'high',
  'medium': 'medium',
  'low': 'low',
};

const REVERSE_STATUS_LABELS: Record<string, TaskStatus> = {
  'ยังไม่เริ่ม': 'not_started',
  'กำลังดำเนินการ': 'in_progress',
  'รอตรวจทาน': 'pending_review',
  'เสร็จสิ้น': 'completed',
  'ล่าช้ากว่าแผน': 'delayed',
  'not_started': 'not_started',
  'in_progress': 'in_progress',
  'pending_review': 'pending_review',
  'completed': 'completed',
  'delayed': 'delayed',
};

const escapeCsvCell = (val: unknown): string => {
  if (val === null || val === undefined) return '""';
  // Replace internal newlines with space to prevent breaking row parsing in Excel
  const str = String(val)
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/"/g, '""')
    .trim();
  return `"${str}"`;
};

export interface ExportResult {
  success: boolean;
  count: number;
  filename: string;
  csvContent: string;
}

/**
 * Exports an array of WorkTask objects to a properly encoded CSV file with UTF-8 BOM.
 * Delays object URL revocation so that browsers (and iframes) can complete saving the file.
 */
export function exportTasksToCSV(tasks: WorkTask[], filename: string = 'ทะเบียนติดตามงาน_ทั้งหมด_คณะโลจิสติกส์_2570'): ExportResult {
  const headers = [
    'ลำดับ',
    'รหัสภารกิจ',
    'ชื่องาน / ภารกิจ',
    'งานหลัก',
    'รหัสงานหลัก',
    'หน่วยงานย่อย',
    'ประจำเดือน',
    'ไตรมาส',
    'ผู้รับผิดชอบ',
    'สถานะการดำเนินงาน',
    'ความก้าวหน้า (%)',
    'วันที่เริ่มต้น',
    'กำหนดส่ง / สิ้นสุด',
    'ระดับความสำคัญ',
    'งบประมาณ (บาท)',
    'รายละเอียด / เป้าหมาย',
    'ผลการดำเนินงานประจำงวด',
    'ปัญหา อุปสรรค และแนวทางแก้ไข',
    'วันที่ปรับปรุงข้อมูลล่าสุด'
  ];

  const rows = tasks.map((t, idx) => {
    const div = DIVISIONS_DATA.find((d) => d.id === t.divisionId);
    const unit = div?.units.find((u) => u.id === t.unitId);
    const month = FISCAL_MONTHS.find((m) => m.id === t.monthId);
    const priorityLabel = PRIORITY_LABELS[t.priority] || t.priority || 'ปกติ';
    const statusLabel = STATUS_CONFIG[t.status]?.label || t.status;
    const quarterLabel = month ? `ไตรมาส ${month.quarter}` : '-';

    return [
      idx + 1,
      escapeCsvCell(t.id),
      escapeCsvCell(t.title),
      escapeCsvCell(div?.name || t.divisionId),
      escapeCsvCell(div?.code || ''),
      escapeCsvCell(unit?.name || t.unitId),
      escapeCsvCell(month?.label || t.monthId),
      escapeCsvCell(quarterLabel),
      escapeCsvCell(t.assignee),
      escapeCsvCell(statusLabel),
      t.progress ?? 0,
      escapeCsvCell(t.startDate || ''),
      escapeCsvCell(t.dueDate || ''),
      escapeCsvCell(priorityLabel),
      t.budget !== undefined && t.budget !== null ? t.budget : 0,
      escapeCsvCell(t.description || ''),
      escapeCsvCell(t.output || ''),
      escapeCsvCell(t.issues || ''),
      escapeCsvCell(t.updatedAt || ''),
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const safeFilename = filename.replace(/[\\/:*?"<>|]/g, '_').trim();
  const today = new Date().toISOString().split('T')[0];
  const fullFilename = `${safeFilename}_${today}.csv`;

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fullFilename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Retain blob URL long enough for asynchronous save operations in modern browsers & iframes
    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 60000);
  } catch (err) {
    console.error('Error triggering CSV download', err);
  }

  return {
    success: true,
    count: tasks.length,
    filename: fullFilename,
    csvContent,
  };
}

/**
 * Robust CSV parser that handles quotes, escaped quotes, and commas.
 */
function parseCSVRows(csvText: string): string[][] {
  // Strip BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export interface ParseTasksResult {
  mergedTasks: WorkTask[];
  updatedCount: number;
  newCount: number;
  totalParsed: number;
  warnings: string[];
}

/**
 * Parses an uploaded/imported CSV file and reconciles with existing tasks.
 */
export function parseAndMergeTasksCSV(csvText: string, currentTasks: WorkTask[]): ParseTasksResult {
  const rows = parseCSVRows(csvText);
  if (rows.length < 2) {
    throw new Error('ไฟล์ CSV ว่างเปล่าหรือไม่พบคอลัมน์ข้อมูล');
  }

  const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  
  // Find column indices
  const getColIdx = (names: string[]): number => {
    return headers.findIndex((h) => names.some((n) => h.includes(n)));
  };

  const idIdx = getColIdx(['รหัสภารกิจ', 'รหัส', 'ID', 'id']);
  const titleIdx = getColIdx(['ชื่องาน', 'ภารกิจ', 'ชื่อโครงการ', 'title']);
  const divIdx = getColIdx(['งานหลัก', 'division', 'กลุ่มงาน']);
  const unitIdx = getColIdx(['หน่วยงานย่อย', 'หน่วยงาน', 'unit']);
  const monthIdx = getColIdx(['ประจำเดือน', 'เดือน', 'month']);
  const assigneeIdx = getColIdx(['ผู้รับผิดชอบ', 'assignee']);
  const statusIdx = getColIdx(['สถานะ', 'status']);
  const progressIdx = getColIdx(['ความก้าวหน้า', 'progress', '%']);
  const startDateIdx = getColIdx(['วันที่เริ่ม', 'start']);
  const dueDateIdx = getColIdx(['กำหนดส่ง', 'สิ้นสุด', 'due']);
  const priorityIdx = getColIdx(['ระดับความสำคัญ', 'ความสำคัญ', 'priority']);
  const budgetIdx = getColIdx(['งบประมาณ', 'budget']);
  const descIdx = getColIdx(['รายละเอียด', 'เป้าหมาย', 'description']);
  const outputIdx = getColIdx(['ผลการดำเนินงาน', 'ผลงาน', 'output']);
  const issuesIdx = getColIdx(['ปัญหา', 'อุปสรรค', 'issues']);

  if (titleIdx === -1) {
    throw new Error('ไม่พบคอลัมน์ "ชื่องาน / ภารกิจ" ในไฟล์ CSV');
  }

  const warnings: string[] = [];
  const updatedTasksMap = new Map<string, WorkTask>();
  currentTasks.forEach((t) => updatedTasksMap.set(t.id, { ...t }));

  let updatedCount = 0;
  let newCount = 0;
  let totalParsed = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || !row[titleIdx]) continue;

    totalParsed++;
    const rawId = idIdx >= 0 ? row[idIdx]?.trim() : '';
    const rawTitle = row[titleIdx]?.trim() || '';
    if (!rawTitle) continue;

    // Determine target task to update: match by ID first, then by exact title
    let targetTask: WorkTask | undefined;
    if (rawId && updatedTasksMap.has(rawId)) {
      targetTask = updatedTasksMap.get(rawId);
    } else {
      targetTask = Array.from(updatedTasksMap.values()).find(
        (t) => t.title.trim().toLowerCase() === rawTitle.toLowerCase()
      );
    }

    // Resolve Division
    let resolvedDivId: DivisionId = targetTask?.divisionId || 'admin';
    if (divIdx >= 0 && row[divIdx]) {
      const dName = row[divIdx].trim();
      const matchedDiv = DIVISIONS_DATA.find((d) => d.name === dName || d.id === dName || d.code === dName);
      if (matchedDiv) resolvedDivId = matchedDiv.id;
    }

    // Resolve Unit
    let resolvedUnitId = targetTask?.unitId || '';
    const divInfo = DIVISIONS_DATA.find((d) => d.id === resolvedDivId);
    if (unitIdx >= 0 && row[unitIdx] && divInfo) {
      const uName = row[unitIdx].trim();
      const matchedUnit = divInfo.units.find((u) => u.name === uName || u.id === uName);
      if (matchedUnit) resolvedUnitId = matchedUnit.id;
    }
    if (!resolvedUnitId && divInfo && divInfo.units.length > 0) {
      resolvedUnitId = divInfo.units[0].id;
    }

    // Resolve Month
    let resolvedMonthId = targetTask?.monthId || '2569-10';
    if (monthIdx >= 0 && row[monthIdx]) {
      const mLabel = row[monthIdx].trim();
      const matchedMonth = FISCAL_MONTHS.find((m) => m.label === mLabel || m.id === mLabel);
      if (matchedMonth) resolvedMonthId = matchedMonth.id;
    }

    // Resolve Status
    let resolvedStatus: TaskStatus = targetTask?.status || 'in_progress';
    if (statusIdx >= 0 && row[statusIdx]) {
      const sVal = row[statusIdx].trim();
      if (REVERSE_STATUS_LABELS[sVal]) {
        resolvedStatus = REVERSE_STATUS_LABELS[sVal];
      }
    }

    // Resolve Progress
    let resolvedProgress = targetTask?.progress ?? 0;
    if (progressIdx >= 0 && row[progressIdx] !== undefined && row[progressIdx] !== '') {
      const parsedNum = parseFloat(row[progressIdx].replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedNum)) {
        resolvedProgress = Math.max(0, Math.min(100, Math.round(parsedNum)));
      }
    }
    // Auto-adjust status if progress is 100 or 0
    if (resolvedProgress === 100 && resolvedStatus !== 'completed') {
      resolvedStatus = 'completed';
    }

    // Resolve Priority
    let resolvedPriority = targetTask?.priority || 'medium';
    if (priorityIdx >= 0 && row[priorityIdx]) {
      const pVal = row[priorityIdx].trim();
      if (REVERSE_PRIORITY_LABELS[pVal]) {
        resolvedPriority = REVERSE_PRIORITY_LABELS[pVal];
      }
    }

    // Resolve Budget
    let resolvedBudget = targetTask?.budget;
    if (budgetIdx >= 0 && row[budgetIdx] !== undefined && row[budgetIdx] !== '') {
      const bNum = parseFloat(row[budgetIdx].replace(/[^0-9.]/g, ''));
      if (!isNaN(bNum)) {
        resolvedBudget = bNum;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (targetTask) {
      // Update existing task
      const updatedItem: WorkTask = {
        ...targetTask,
        title: rawTitle,
        divisionId: resolvedDivId,
        unitId: resolvedUnitId,
        monthId: resolvedMonthId,
        assignee: assigneeIdx >= 0 && row[assigneeIdx] ? row[assigneeIdx].trim() : targetTask.assignee,
        status: resolvedStatus,
        progress: resolvedProgress,
        startDate: startDateIdx >= 0 && row[startDateIdx] ? row[startDateIdx].trim() : targetTask.startDate,
        dueDate: dueDateIdx >= 0 && row[dueDateIdx] ? row[dueDateIdx].trim() : targetTask.dueDate,
        priority: resolvedPriority,
        budget: resolvedBudget,
        description: descIdx >= 0 && row[descIdx] ? row[descIdx].trim() : targetTask.description,
        output: outputIdx >= 0 && row[outputIdx] ? row[outputIdx].trim() : targetTask.output,
        issues: issuesIdx >= 0 && row[issuesIdx] ? row[issuesIdx].trim() : targetTask.issues,
        updatedAt: todayStr,
      };
      updatedTasksMap.set(targetTask.id, updatedItem);
      updatedCount++;
    } else {
      // New task from CSV
      const newId = rawId || `task-csv-${Date.now()}-${r}`;
      const newItem: WorkTask = {
        id: newId,
        title: rawTitle,
        divisionId: resolvedDivId,
        unitId: resolvedUnitId,
        monthId: resolvedMonthId,
        assignee: assigneeIdx >= 0 && row[assigneeIdx] ? row[assigneeIdx].trim() : 'เจ้าหน้าที่ผู้รับผิดชอบ',
        status: resolvedStatus,
        progress: resolvedProgress,
        startDate: startDateIdx >= 0 && row[startDateIdx] ? row[startDateIdx].trim() : '2569-10-01',
        dueDate: dueDateIdx >= 0 && row[dueDateIdx] ? row[dueDateIdx].trim() : '2569-10-31',
        priority: resolvedPriority,
        budget: resolvedBudget,
        description: descIdx >= 0 && row[descIdx] ? row[descIdx].trim() : 'นำเข้าจากไฟล์ CSV',
        output: outputIdx >= 0 && row[outputIdx] ? row[outputIdx].trim() : undefined,
        issues: issuesIdx >= 0 && row[issuesIdx] ? row[issuesIdx].trim() : undefined,
        updatedAt: todayStr,
      };
      updatedTasksMap.set(newId, newItem);
      newCount++;
    }
  }

  return {
    mergedTasks: Array.from(updatedTasksMap.values()),
    updatedCount,
    newCount,
    totalParsed,
    warnings,
  };
}
