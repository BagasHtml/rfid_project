import type { AttendanceDuplicate, AttendanceResult } from '../types/index.js';
export declare function processAttendance(uid: string): Promise<AttendanceResult | AttendanceDuplicate>;
export declare function getTodayList(limit?: number, offset?: number): Promise<{
    data: import("../types/index.js").AttendanceWithStudent[];
    total: number;
}>;
