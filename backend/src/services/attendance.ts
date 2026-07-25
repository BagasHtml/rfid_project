import * as repo from '../repositories/attendance.js';
import { broadcast } from '../sse/clients.js';
import { env } from '../config/env.js';
import type { AttendanceResult, AttendanceStatus } from '../types/index.js';

function determineStatus(currentTime: string, threshold: string): AttendanceStatus {
  return currentTime <= threshold ? 'Hadir' : 'Terlambat';
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

export async function processAttendance(uid: string): Promise<AttendanceResult> {
  const card = await repo.findActiveCardByUid(uid);

  if (!card) {
    return { success: false, message: 'Kartu tidak terdaftar' };
  }

  const existing = await repo.findTodayAttendance(card.student_id);

  if (existing) {
    return {
      success: false,
      message: 'Sudah absen hari ini',
      student: {
        name: card.student_name,
        class: card.student_class,
        nis: card.student_nis,
      },
      status: existing.status,
      time: existing.time,
    };
  }

  const threshold = (await repo.getSetting('late_threshold')) ?? env.lateThreshold;
  const time = getCurrentTime();
  const status = determineStatus(time, threshold);

  try {
    await repo.insertAttendance(card.student_id, time, status);
  } catch (err) {
    if (isDuplicateEntryError(err)) {
      return {
        success: false,
        message: 'Sudah absen hari ini',
        student: {
          name: card.student_name,
          class: card.student_class,
          nis: card.student_nis,
        },
      };
    }
    throw err;
  }

  const payload = {
    name: card.student_name,
    class: card.student_class,
    nis: card.student_nis,
    time,
    status,
  };

  broadcast('attendance:new', payload);

  return {
    success: true,
    message: 'Absensi berhasil',
    student: {
      name: card.student_name,
      class: card.student_class,
      nis: card.student_nis,
    },
    status,
    time,
  };
}

export async function getTodayList() {
  return repo.getTodayList();
}