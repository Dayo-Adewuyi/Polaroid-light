import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  req.startTime = Date.now();

  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId:  req.headers['x-user-id'],
  });

  if (process.env.LOG_LEVEL === 'debug' && req.body && Object.keys(req.body).length > 0) {
    logger.debug('Request body', {
      requestId: req.id,
      body: req.body,
    });
  }

  const originalJson = res.json;
  res.json = function(data: any) {
    res.locals.responseBody = data;
    return originalJson.call(this, data);
  };

  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime;
    
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('content-length'),
      userId: req.headers['x-user-id'],
    };

    if (res.statusCode >= 400) {
      logger.error('Request failed', {
        ...logData,
        error: res.locals.responseBody?.error || 'Unknown error',
      });
    } else {
      logger.info('Request completed', logData);
    }

    if (process.env.LOG_LEVEL === 'debug' && res.locals.responseBody) {
      logger.debug('Response body', {
        requestId: req.id,
        body: res.locals.responseBody,
      });
    }
  });

  next();
};

export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const route = req.route?.path || req.path;
  
  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime;

    logger.info('Performance metrics', {
      requestId: req.id,
      route,
      method: req.method,
      responseTime: `${responseTime}ms`,
      statusCode: res.statusCode,
    });

    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        requestId: req.id,
        route,
        method: req.method,
        responseTime: `${responseTime}ms`,
        threshold: '1000ms',
      });
    }
  });

  next();
};