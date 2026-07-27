import * as repo from '../repositories/attendance.js';
import { broadcast } from '../sse/clients.js';
import { env } from '../config/env.js';
import type { AttendanceResult, AttendanceStatus, CardWithStudent } from '../types/index.js';

function determineStatus(currentTime: string, threshold: string): AttendanceStatus {
  return currentTime <= threshold ? 'Tepat Waktu' : 'Terlambat';
}

function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

function isDuplicateEntryError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'ER_DUP_ENTRY'
  );
}

function buildStudentInfo(card: CardWithStudent) {
  return {
    name: card.student_name,
    class: card.student_class,
    nis: card.student_nis,
  };
}

function buildDuplicateResponse(card: CardWithStudent, status?: AttendanceStatus, time?: string): AttendanceResult {
  return {
    success: false,
    message: 'Sudah absen hari ini',
    student: buildStudentInfo(card),
    status,
    time,
  };
}

export async function processAttendance(uid: string): Promise<AttendanceResult> {
  const card = await repo.findActiveCardByUid(uid);

  if (!card) {
    return { success: false, message: 'Kartu tidak terdaftar' };
  }

  const existing = await repo.findTodayAttendance(card.student_id);

  if (existing) {
    return buildDuplicateResponse(card, existing.status, existing.time);
  }

  const threshold = (await repo.getSetting('late_threshold')) ?? env.lateThreshold;
  const time = getCurrentTime();
  const status = determineStatus(time, threshold);

  try {
    await repo.insertAttendance(card.student_id, time, status);
  } catch (err) {
    if (isDuplicateEntryError(err)) {
      const duplicate = await repo.findTodayAttendance(card.student_id);
      return buildDuplicateResponse(card, duplicate?.status, duplicate?.time);
    }
    throw err;
  }

  const studentInfo = buildStudentInfo(card);

  broadcast('attendance:new', { ...studentInfo, time, status });

  return {
    success: true,
    message: 'Absensi berhasil',
    student: studentInfo,
    status,
    time,
  };
}

export async function getTodayList(limit?: number, offset?: number) {
  return repo.getTodayList(limit, offset);
}
