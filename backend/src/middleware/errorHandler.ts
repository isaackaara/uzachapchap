import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  res.status(statusCode).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}
