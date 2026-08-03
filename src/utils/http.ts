import type { Response } from 'express';

export function sendResult<T extends { statusCode: number }>(res: Response, result: T): void {
  res.status(result.statusCode).json(result);
}
