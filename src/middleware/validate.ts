import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Data tidak valid';
      res.status(400).json({ success: false, message });
      return;
    }

    (req as any)[source] = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema): RequestHandler {
  return validate(schema, 'query');
}
