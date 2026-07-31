import type { AttendanceRecord, AttendanceWithStudent, AttendanceStatus } from '../types/index.js';
export declare function findTodayAttendance(studentId: number, date: string): Promise<AttendanceRecord | null>;
export declare function insertAttendance(studentId: number, date: string, time: string, status: AttendanceStatus): Promise<number>;
export declare function getTodayList(date: string, limit?: number, offset?: number): Promise<{
    data: AttendanceWithStudent[];
    total: number;
}>;
