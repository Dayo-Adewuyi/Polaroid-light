import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../../middlewares/error-middlewares';
import { ApiError } from '../../types';
import { Prisma } from '@prisma/client';

jest.mock('../../utils/logger');

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      id: 'request123',
      method: 'GET',
      url: '/test',
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle ApiError', () => {
      const error = new ApiError(400, 'Bad Request');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Bad Request',
          code: 400,
        },
        requestId: 'request123',
      });
    });

    it('should handle Prisma duplicate error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['email'] },
        }
      );

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('Duplicate value'),
            code: 409,
          }),
        })
      );
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Internal server error',
            code: 500,
          }),
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 response', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Route not found',
          code: 404,
        },
        requestId: 'request123',
      });
    });
  });
});
