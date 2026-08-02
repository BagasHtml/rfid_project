import { z } from 'zod';
export declare const RegisterStudentSchema: z.ZodObject<{
    nis: z.ZodString;
    name: z.ZodString;
    class: z.ZodString;
}, z.core.$strip>;
export declare const GetStudentsQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type RegisterStudentInput = z.infer<typeof RegisterStudentSchema>;
export type GetStudentsQueryInput = z.infer<typeof GetStudentsQuerySchema>;
