import { z } from 'zod';

export const UID_PATTERN = /^[0-9A-Fa-f]{8,24}$/;

export const PostAttendanceSchema = z.object({
  uid: z
    .string({ error: 'UID wajib diisi' })
    .trim()
    .toUpperCase()
    .regex(UID_PATTERN, 'Format UID tidak valid (8-24 karakter hex)'),
});

export const GetTodayQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GetTodayQueryInput = z.infer<typeof GetTodayQuerySchema>;
