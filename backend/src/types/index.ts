import { Request } from 'express';

export interface SellerPayload {
  id: string;
  email: string;
  plan: string;
}

export interface AuthRequest extends Request {
  seller?: SellerPayload;
}

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}
