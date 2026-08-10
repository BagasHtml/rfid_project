import * as attendanceRepo from '../repositories/attendance.js';
import * as cardRepo from '../repositories/card.js';
import * as settingRepo from '../repositories/setting.js';
import * as studentRepo from '../repositories/student.js';
import { toAttendanceRecord, toAttendanceWithStudent } from '../mappers/attendance.js';
import { toCardWithStudent } from '../mappers/card.js';
import { broadcast } from '../sse/clients.js';
import { env } from '../config/env.js';
import { getCurrentDate, getCurrentTime, determineStatus } from '../utils/date.js';
import { writeOrDuplicate } from '../utils/insert.js';
import { buildStudentInfo } from '../utils/format.js';
import type { AttendanceDuplicate, AttendanceResult } from '../types/attendance.js';
import type { CardWithStudent } from '../types/card.js';

async function findDuplicate(card: CardWithStudent, date: string): Promise<AttendanceDuplicate | null> {
  const existing = await attendanceRepo.findTodayAttendance(card.student_id, date);
  if (!existing) return null;

  const record = toAttendanceRecord(existing);
  const student = buildStudentInfo(card);
  broadcast('attendance:duplicate', { ...student, time: record.time, status: record.status });

  return {
    success: false,
    is_duplicate: true,
    message: 'Sudah absen hari ini',
    statusCode: 409,
    student,
    status: record.status,
    time: record.time,
  };
}

export async function processAttendance(uid: string): Promise<AttendanceResult | AttendanceDuplicate> {
  const rawCard = await cardRepo.findActiveByUid(uid);

  if (!rawCard) {
    return { success: false, message: 'Kartu tidak terdaftar', statusCode: 404 };
  }

  const card = toCardWithStudent(rawCard);
  const date = getCurrentDate();

  const duplicate = await findDuplicate(card, date);
  if (duplicate) return duplicate;

  const threshold = (await settingRepo.get('late_threshold')) ?? env.lateThreshold;
  const time = getCurrentTime();
  const status = determineStatus(time, threshold);

  const conflict = await writeOrDuplicate(
    () => attendanceRepo.insertAttendance(card.student_id, date, time, status),
    () => findDuplicate(card, date),
  );
  if (conflict) return conflict;

  const student = buildStudentInfo(card);

  broadcast('attendance:new', { ...student, time, status });

  return {
    success: true,
    message: 'Absensi berhasil',
    statusCode: 200,
    student,
    status,
    time,
  };
}

export async function getTodayList(limit?: number, offset?: number) {
  const date = getCurrentDate();
  const [{ data, total }, statusCount, totalStudents] = await Promise.all([
    attendanceRepo.getTodayList(date, limit, offset),
    attendanceRepo.getTodayStats(date),
    studentRepo.countActive(),
  ]);
  return {
    data: data.map(toAttendanceWithStudent),
    total,
    stats: {
      total_students: totalStudents,
      present: total,
      on_time: statusCount.onTime,
      late: statusCount.late,
      absent: Math.max(totalStudents - total, 0),
    },
  };
}
