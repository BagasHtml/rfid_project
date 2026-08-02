import type { AttendanceStatus } from '../types/index.js';
import { env } from '../config/env.js';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: env.timezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: env.timezone,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function getCurrentDate(): string {
  return dateFormatter.format(new Date());
}

export function getCurrentTime(): string {
  return timeFormatter.format(new Date());
}

export function formatDateTime(d: Date): string {
  return `${dateFormatter.format(d)} ${timeFormatter.format(d)}`;
}

export function determineStatus(currentTime: string, threshold: string): AttendanceStatus {
  return currentTime <= threshold ? 'Tepat Waktu' : 'Terlambat';
}
