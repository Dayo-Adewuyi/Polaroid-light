import express from 'express';
import App from '../app';
import logger from '../utils/logger';

jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    listen: jest.fn((port, callback) => {
      callback?.();
      return { port };
    }),
  };
  
  const expressMock = jest.fn(() => mockApp) as jest.Mock & { json?: jest.Mock; urlencoded?: jest.Mock };
  expressMock.json = jest.fn(() => 'json-middleware');
  expressMock.urlencoded = jest.fn(() => 'urlencoded-middleware');
  
  return expressMock;
});

jest.mock('cors', () => jest.fn(() => 'cors-middleware'));
jest.mock('helmet', () => jest.fn(() => 'helmet-middleware'));
jest.mock('compression', () => jest.fn(() => 'compression-middleware'));
jest.mock('../middlewares', () => ({
  errorHandler: 'error-handler',
  notFoundHandler: 'not-found-handler',
  requestLogger: 'request-logger',
  performanceMonitor: 'performance-monitor',
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
}));
jest.mock('../routes/film-routes', () => 'film-routes');
jest.mock('../routes/user-routes', () => 'user-routes');

describe('App', () => {
  let app: App;
  let mockExpressApp: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    
    jest.clearAllMocks();
    
    mockExpressApp = (express as jest.MockedFunction<typeof express>)();
    
    app = new App();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize express app and configure everything', () => {
      expect(express).toHaveBeenCalled();
      expect(app.app).toBe(mockExpressApp);
    });
  });

  describe('initializeMiddleware', () => {
    it('should configure helmet for production environment', () => {
      process.env.NODE_ENV = 'production';
      const helmet = require('helmet');
      
      new App();
      
      expect(helmet).toHaveBeenCalledWith({
        contentSecurityPolicy: undefined,
      });
    });

    it('should configure helmet for non-production environment', () => {
      process.env.NODE_ENV = 'development';
      const helmet = require('helmet');
      
      new App();
      
      expect(helmet).toHaveBeenCalledWith({
        contentSecurityPolicy: false,
      });
    });

    it('should configure CORS with custom origin', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:4000';
      const cors = require('cors');
      
      new App();
      
      expect(cors).toHaveBeenCalledWith({
        origin: ['http://localhost:3000', 'http://localhost:4000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Request-Id',
          'X-User-Id',
        ],
      });
    });

    it('should configure CORS with default origin when not specified', () => {
      delete process.env.CORS_ORIGIN;
      const cors = require('cors');
      
      new App();
      
      expect(cors).toHaveBeenCalledWith({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Request-Id',
          'X-User-Id',
        ],
      });
    });

    it('should configure compression middleware', () => {
      const compression = require('compression');
      
      new App();
      
      expect(compression).toHaveBeenCalled();
      expect(mockExpressApp.use).toHaveBeenCalledWith('compression-middleware');
    });

    it('should configure JSON and URL-encoded body parsers', () => {
      new App();
      
      expect(express.json).toHaveBeenCalledWith({ limit: '10mb' });
      expect(express.urlencoded).toHaveBeenCalledWith({ extended: true, limit: '10mb' });
      expect(mockExpressApp.use).toHaveBeenCalledWith('json-middleware');
      expect(mockExpressApp.use).toHaveBeenCalledWith('urlencoded-middleware');
    });

    it('should add custom logging middlewares', () => {
      new App();
      
      expect(mockExpressApp.use).toHaveBeenCalledWith('request-logger');
      expect(mockExpressApp.use).toHaveBeenCalledWith('performance-monitor');
    });

    it('should enable trust proxy', () => {
      new App();
      
      expect(mockExpressApp.set).toHaveBeenCalledWith('trust proxy', true);
    });
  });

  describe('initializeRoutes', () => {
    it('should mount film and user routes', () => {
      new App();
      
      expect(mockExpressApp.use).toHaveBeenCalledWith('/api/v1', 'film-routes');
      expect(mockExpressApp.use).toHaveBeenCalledWith('/api/v1', 'user-routes');
    });

  });

  describe('initializeErrorHandling', () => {
    it('should add not found and error handlers in correct order', () => {
      new App();
      
      const middlewareCalls = mockExpressApp.use.mock.calls;
      const lastTwo = middlewareCalls.slice(-2);
      
      expect(lastTwo[0][0]).toBe('not-found-handler');
      expect(lastTwo[1][0]).toBe('error-handler');
    });
  });



  describe('listen', () => {

    it('should start server on custom port from environment', () => {
      process.env.PORT = '4000';
      process.env.NODE_ENV = 'production';
      
      app.listen();
      
      expect(mockExpressApp.listen).toHaveBeenCalledWith('4000', expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith('Server started', {
        port: '4000',
        environment: 'production',
        pid: process.pid,
      });
    });
  });
});