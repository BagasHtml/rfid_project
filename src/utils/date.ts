import type { AttendanceStatus } from '../types/index.js';

export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

export function determineStatus(currentTime: string, threshold: string): AttendanceStatus {
  return currentTime <= threshold ? 'Tepat Waktu' : 'Terlambat';
}
