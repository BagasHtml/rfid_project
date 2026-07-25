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
    const memoryUsed = ((process.memoryUsage().heapUsed - startMemory) / 1024 / 1024).toFixed(2);

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms [${memoryUsed}MB]`
    );
  });

  next();
}
