import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

const store = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (options: RateLimitOptions) => {
  const { 
    windowMs, 
    max, 
    message = 'Too many requests, please try again later.'
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      entry.count++;
    }

    store.set(key, entry);

    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

    if (entry.count > max) {
      return next(new ApiError(429, message));
    }

    next();
  };
};

