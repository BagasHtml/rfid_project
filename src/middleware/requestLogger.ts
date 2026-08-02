import { Request, Response, NextFunction } from 'express';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const memoryDelta = process.memoryUsage().heapUsed - startMemory;
    const memoryUsed = (Math.max(0, memoryDelta) / 1024 / 1024).toFixed(2);

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms [${memoryUsed}MB]`
    );
  });

  next();
}
