import { z } from 'zod';

export const UID_PATTERN = /^[0-9A-Fa-f]{8,24}$/;

export const MANUAL_STATUSES = ['Alpha', 'Izin', 'Sakit', 'Dispen'] as const;

export const PostAttendanceSchema = z.object({
  uid: z
    .string({ error: 'UID wajib diisi' })
    .trim()
    .toUpperCase()
    .regex(UID_PATTERN, 'Format UID tidak valid (8-24 karakter hex)'),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(MANUAL_STATUSES, { error: 'Status tidak valid' }),
  keterangan: z.string().trim().max(255, 'Keterangan maksimal 255 karakter').optional(),
});

export const ManualAttendanceSchema = z.object({
  student_id: z.coerce.number({ error: 'ID siswa wajib diisi' })
    .int('ID siswa harus bilangan bulat')
    .positive('ID siswa tidak valid'),
  status: z.enum(MANUAL_STATUSES, { error: 'Status tidak valid' }),
  keterangan: z.string().trim().max(255, 'Keterangan maksimal 255 karakter').optional(),
});

export const GetTodayQuerySchema = z.object({
  limit: z.coerce.number({ error: 'Parameter limit harus berupa angka' })
    .int('Parameter limit harus bilangan bulat')
    .min(1, 'Parameter limit minimal 1')
    .max(200, 'Parameter limit maksimal 200')
    .default(100),
  offset: z.coerce.number({ error: 'Parameter offset harus berupa angka' })
    .int('Parameter offset harus bilangan bulat')
    .min(0, 'Parameter offset tidak boleh negatif')
    .default(0),
  class: z.string().trim().max(20, 'Kelas maksimal 20 karakter').optional(),
});

export const GetStatusQuerySchema = z.object({
  limit: z.coerce.number({ error: 'Parameter limit harus berupa angka' })
    .int('Parameter limit harus bilangan bulat')
    .min(1, 'Parameter limit minimal 1')
    .max(200, 'Parameter limit maksimal 200')
    .default(20),
  offset: z.coerce.number({ error: 'Parameter offset harus berupa angka' })
    .int('Parameter offset harus bilangan bulat')
    .min(0, 'Parameter offset tidak boleh negatif')
    .default(0),
  class: z.string().trim().max(20, 'Kelas maksimal 20 karakter').optional(),
  q: z.string().trim().max(50, 'Pencarian maksimal 50 karakter').optional(),
});

export type GetTodayQueryInput = z.infer<typeof GetTodayQuerySchema>;
export type GetStatusQueryInput = z.infer<typeof GetStatusQuerySchema>;