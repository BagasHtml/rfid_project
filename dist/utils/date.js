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
export function getCurrentDate() {
    return dateFormatter.format(new Date());
}
export function getCurrentTime() {
    return timeFormatter.format(new Date());
}
export function formatDateTime(d) {
    return `${dateFormatter.format(d)} ${timeFormatter.format(d)}`;
}
export function determineStatus(currentTime, threshold) {
    return currentTime <= threshold ? 'Tepat Waktu' : 'Terlambat';
}
