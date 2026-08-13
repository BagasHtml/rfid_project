import * as attendanceRepo from '../repositories/attendance.js';
import * as cardRepo from '../repositories/card.js';
import * as settingRepo from '../repositories/setting.js';
import * as studentRepo from '../repositories/student.js';
import { toAttendanceRecord, toAttendanceWithStudent, toStudentStatus } from '../mappers/attendance.js';
import { toCardWithStudent } from '../mappers/card.js';
import { broadcast } from '../sse/clients.js';
import { env } from '../config/env.js';
import { getCurrentDate, getCurrentTime, determineStatus } from '../utils/date.js';
import { writeOrDuplicate } from '../utils/insert.js';
import { buildStudentInfo } from '../utils/format.js';
import { ok, fail } from '../utils/http.js';
import type { AttendanceDuplicate, AttendanceResult } from '../types/attendance.js';
import type { CardWithStudent } from '../types/card.js';

async function findDuplicate(card: CardWithStudent, date: string): Promise<AttendanceDuplicate | null> {
  const existing = await attendanceRepo.findTodayAttendance(card.student_id, date);
  if (!existing) return null;

  const record = toAttendanceRecord(existing);
  const student = buildStudentInfo(card);
  broadcast('attendance:duplicate', { ...student, student_id: card.student_id, time: record.time, status: record.status });

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

function buildStats(statusCount: { onTime: number; late: number }, totalStudents: number, present: number) {
  return {
    total_students: totalStudents,
    present,
    on_time: statusCount.onTime,
    late: statusCount.late,
    absent: Math.max(totalStudents - present, 0),
  };
}

export async function processAttendance(uid: string, userClass?: string | null): Promise<AttendanceResult | AttendanceDuplicate> {
  const rawCard = await cardRepo.findActiveByUid(uid);

  if (!rawCard) return fail('Kartu tidak terdaftar', 404);

  const card = toCardWithStudent(rawCard);

  if (userClass && card.student_class !== userClass) {
    return fail('Kartu ini bukan milik kelas Anda', 403);
  }

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

  broadcast('attendance:new', { ...student, student_id: card.student_id, time, status });

  return ok('Absensi berhasil', { student, status, time });
}

export async function getTodayList(limit?: number, offset?: number, className?: string) {
  const date = getCurrentDate();
  const [{ data, total }, statusCount, totalStudents] = await Promise.all([
    attendanceRepo.getTodayList(date, limit, offset, className),
    attendanceRepo.getTodayStats(date, className),
    studentRepo.countActive(className),
  ]);
  return {
    data: data.map(toAttendanceWithStudent),
    total,
    stats: buildStats(statusCount, totalStudents, total),
  };
}

export async function getStatusList(limit?: number, offset?: number, className?: string, search?: string) {
  const date = getCurrentDate();
  const [{ data, total }, statusCount, totalStudents] = await Promise.all([
    attendanceRepo.getStudentsStatusList(date, limit, offset, className, search),
    attendanceRepo.getTodayStats(date, className),
    studentRepo.countActive(className),
  ]);
  return {
    data: data.map(toStudentStatus),
    total,
    stats: buildStats(statusCount, totalStudents, statusCount.onTime + statusCount.late),
  };
}
