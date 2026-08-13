import type { Response } from 'express';

export function sendResult<T extends { statusCode: number }>(res: Response, result: T): void {
  res.status(result.statusCode).json(result);
}

export function ok<T extends object = {}>(
  message: string,
  extra: T = {} as T,
): { success: true; message: string; statusCode: 200 } & T {
  return { success: true, message, statusCode: 200, ...extra };
}

export function fail(
  message: string,
  statusCode: number,
): { success: false; message: string; statusCode: number } {
  return { success: false, message, statusCode };
}
