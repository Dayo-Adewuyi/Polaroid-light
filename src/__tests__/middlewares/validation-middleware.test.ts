import { Request, Response, NextFunction } from 'express';
import { validate, validateQuery } from '../../middlewares/validation.middlewares';
import { filmSchemas } from '../../middlewares/validation.middlewares';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('validate', () => {
    it('should pass validation with valid data', () => {
      const middleware = validate(filmSchemas.create);
      mockRequest.body = {
        title: 'Test Film',
        description: 'Test Description',
        price: 1000,
        videoUrl: 'https://example.com/video.mp4',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should fail validation with invalid data', () => {
      const middleware = validate(filmSchemas.create);
      mockRequest.body = {
        title: '',
        price: -100,
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('title'),
        })
      );
    });
  });

  describe('validateQuery', () => {
    it('should validate query parameters', () => {
      const middleware = validateQuery(filmSchemas.search);
      mockRequest.query = {
        q: 'search term',
        page: '2',
        limit: '50',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        q: 'search term',
        page: 2,
        limit: 50,
      });
    });
  });

});