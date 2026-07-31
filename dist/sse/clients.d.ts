import { Request, Response } from 'express';
export declare function registerClient(req: Request, res: Response): void;
export declare function broadcast(event: string, data: unknown): void;
export declare function getClientCount(): number;
