import type { AttendanceStatus } from '../types/index.js';

export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

export function determineStatus(currentTime: string, threshold: string): AttendanceStatus {
  return currentTime <= threshold ? 'Tepat Waktu' : 'Terlambat';
}
