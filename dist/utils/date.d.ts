import type { AttendanceStatus } from '../types/index.js';
export declare function getCurrentDate(): string;
export declare function getCurrentTime(): string;
export declare function determineStatus(currentTime: string, threshold: string): AttendanceStatus;
