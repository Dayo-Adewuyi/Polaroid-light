import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../types';
import logger from '../utils/logger';

interface ErrorDetails {
  requestId: string;
  method: string;
  url: string;
  userId?: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    statusCode: number;
    isOperational: boolean;
    details?: any;
  };
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;
  let errorDetails: any = {};

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  }
  
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    isOperational = true;
    
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        const field = error.meta?.target;
        message = `Duplicate value for ${field}`;
        errorDetails = { field, code: error.code };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        errorDetails = { code: error.code };
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference: related record does not exist';
        errorDetails = { field: error.meta?.field_name, code: error.code };
        break;
      case 'P2016':
        statusCode = 400;
        message = 'Query interpretation error';
        errorDetails = { code: error.code };
        break;
      default:
        statusCode = 400;
        message = `Database error: ${error.code}`;
        errorDetails = { code: error.code, meta: error.meta };
    }
  }
  
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    isOperational = true;
    const match = error.message.match(/Argument `(\w+)`/);
    if (match) {
      errorDetails = { field: match[1] };
    }
  }
  
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    message = 'Database connection error';
    isOperational = false;
    errorDetails = { errorCode: error.errorCode };
  }
  
  else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = 'Unknown database error occurred';
    isOperational = false;
  }

  const errorLog: ErrorDetails = {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userId: req.headers['x-user-id'] as string,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
      isOperational,
      details: errorDetails
    }
  };

  if (isOperational) {
    logger.warn('Operational error', errorLog);
  } else {
    logger.error('System error', errorLog);
  }

  const response: any = {
    success: false,
    error: {
      message,
      code: statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        details: errorDetails,
        stack: error.stack,
      })
    },
    requestId: req.id
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.warn('Route not found', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 404
    },
    requestId: req.id
  });
};

export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return ((req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  }) as T;
}