import * as attendanceRepo from '../repositories/attendance.js';
import * as cardRepo from '../repositories/card.js';
import * as settingRepo from '../repositories/setting.js';
import { broadcast } from '../sse/clients.js';
import { env } from '../config/env.js';
import { getCurrentTime, determineStatus } from '../utils/date.js';
import { isDuplicateEntryError } from '../utils/error.js';
import { buildStudentInfo } from '../utils/format.js';
import type { AttendanceDuplicate, AttendanceResult, AttendanceStatus, CardWithStudent } from '../types/index.js';

function handleDuplicate(card: CardWithStudent, status?: AttendanceStatus, time?: string): AttendanceDuplicate {
  const studentInfo = buildStudentInfo(card);
  broadcast('attendance:duplicate', { ...studentInfo, time, status });
  return { 
    is_duplicate: true,
    message: 'Sudah absen hari ini',
    statusCode: 409,
    student: studentInfo,
    status, time 
  };
}

export async function processAttendance(uid: string): Promise<AttendanceResult | AttendanceDuplicate> {
  const card = await cardRepo.findActiveByUid(uid);

  if (!card) {
    return { success: false, message: 'Kartu tidak terdaftar', statusCode: 404 };
  }

  const existing = await attendanceRepo.findTodayAttendance(card.student_id);

  if (existing) {
    return handleDuplicate(card, existing.status, existing.time);
  }

  const threshold = (await settingRepo.get('late_threshold')) ?? env.lateThreshold;
  const time = getCurrentTime();
  const status = determineStatus(time, threshold);

  try {
    await attendanceRepo.insertAttendance(card.student_id, time, status);
  } catch (err) {
    if (isDuplicateEntryError(err)) {
      const duplicate = await attendanceRepo.findTodayAttendance(card.student_id);
      return handleDuplicate(card, duplicate?.status, duplicate?.time);
    }
    throw err;
  }

  const studentInfo = buildStudentInfo(card);

  broadcast('attendance:new', { ...studentInfo, time, status });

  return {
    success: true,
    message: 'Absensi berhasil',
    statusCode: 200,
    student: studentInfo,
    status,
    time,
  };
}

export async function getTodayList(limit?: number, offset?: number) {
  return attendanceRepo.getTodayList(limit, offset);
}
