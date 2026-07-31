import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
type Source = 'body' | 'query' | 'params';
export declare function validate(schema: ZodSchema, source?: Source): RequestHandler;
export declare function validateQuery(schema: ZodSchema): RequestHandler;
export {};
