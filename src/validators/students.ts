import { z } from 'zod';

const studentFields = {
  nis: z
    .string({ error: 'NIS wajib diisi' })
    .trim()
    .min(1, 'NIS wajib diisi')
    .max(20, 'NIS maksimal 20 karakter'),
  name: z
    .string({ error: 'Nama wajib diisi' })
    .trim()
    .min(1, 'Nama wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  class: z
    .string({ error: 'Kelas wajib diisi' })
    .trim()
    .min(1, 'Kelas wajib diisi')
    .max(20, 'Kelas maksimal 20 karakter'),
};

export const RegisterStudentSchema = z.object(studentFields);
export const UpdateStudentSchema = z.object(studentFields);

export const GetStudentsQuerySchema = z.object({
  limit: z.coerce.number({ error: 'Parameter limit harus berupa angka' })
    .int('Parameter limit harus bilangan bulat')
    .min(1, 'Parameter limit minimal 1')
    .max(100, 'Parameter limit maksimal 100')
    .default(20),
  offset: z.coerce.number({ error: 'Parameter offset harus berupa angka' })
    .int('Parameter offset harus bilangan bulat')
    .min(0, 'Parameter offset tidak boleh negatif')
    .default(0),
  q: z.string().trim().max(50, 'Pencarian maksimal 50 karakter').optional(),
});

export const StudentIdParamSchema = z.object({
  id: z.coerce.number({ error: 'ID siswa harus berupa angka' })
    .int('ID siswa harus bilangan bulat')
    .positive('ID siswa tidak valid'),
});

export type RegisterStudentInput = z.infer<typeof RegisterStudentSchema>;
export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;
export type GetStudentsQueryInput = z.infer<typeof GetStudentsQuerySchema>;
export type StudentIdParamInput = z.infer<typeof StudentIdParamSchema>;
