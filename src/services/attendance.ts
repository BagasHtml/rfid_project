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
import type { AttendanceDuplicate, AttendanceResult, AttendanceStatus } from '../types/attendance.js';
import type { CardWithStudent } from '../types/card.js';

function handleDuplicate(card: CardWithStudent, status?: AttendanceStatus, time?: string): AttendanceDuplicate {
  const studentInfo = buildStudentInfo(card);
  broadcast('attendance:duplicate', { ...studentInfo, time, status });
  return {
    success: false,
    is_duplicate: true,
    message: 'Sudah absen hari ini',
    statusCode: 409,
    student: studentInfo,
    status,
    time,
  };
}

export async function processAttendance(uid: string): Promise<AttendanceResult | AttendanceDuplicate> {
  const rawCard = await cardRepo.findActiveByUid(uid);

  if (!rawCard) {
    return { success: false, message: 'Kartu tidak terdaftar', statusCode: 404 };
  }

  const card = toCardWithStudent(rawCard);
  const date = getCurrentDate();
  const existing = await attendanceRepo.findTodayAttendance(card.student_id, date);

  if (existing) {
    const record = toAttendanceRecord(existing);
    return handleDuplicate(card, record.status, record.time);
  }

  const threshold = (await settingRepo.get('late_threshold')) ?? env.lateThreshold;
  const time = getCurrentTime();
  const status = determineStatus(time, threshold);

  const conflict = await writeOrDuplicate(
    () => attendanceRepo.insertAttendance(card.student_id, date, time, status),
    async () => {
      const duplicate = await attendanceRepo.findTodayAttendance(card.student_id, date);
      const record = duplicate ? toAttendanceRecord(duplicate) : undefined;
      return handleDuplicate(card, record?.status, record?.time);
    },
  );
  if (conflict) return conflict;

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
