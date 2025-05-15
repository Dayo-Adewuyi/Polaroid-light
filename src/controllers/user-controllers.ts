import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { CreateUserDto, ApiResponse } from '../types';

/**
 * UserController handles all HTTP requests related to user management.
 * Implements RESTful API endpoints for user CRUD operations, authentication,
 * and user-specific business logic including purchase history and statistics.
 * 
 * @class UserController
 * @implements Controller pattern for user resources
 * @module Controllers
 */
export class UserController {
  /**
   * Creates a new user account in the system.
   * 
   * @param {Request} req - Express request object containing user data in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function for error handling
   * 
   * @returns {Promise<void>} - Returns 201 status with created user data
   * 
   * @throws {ApiError} - 409 if email already exists
   * @throws {ApiError} - 400 if validation fails
   * 
   * @example
   * POST /api/v1/users
   * Body: { email: "user@example.com", name: "John Doe" }
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userData: CreateUserDto = req.body;
      const user = await userService.createUser(userData);
      
      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
        message: 'User created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a user by their unique identifier.
   * 
   * @param {Request} req - Express request object with user ID in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns user data if found
   * 
   * @throws {ApiError} - 404 if user not found
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      const response: ApiResponse<typeof user> = {
        success: true,
        data: user
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Searches for a user by email address.
   * 
   * @param {Request} req - Express request object with email in query params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns user data if found
   * 
   * @throws {ApiError} - 404 if user not found
   */
  async getUserByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query;
      
      // FIXME: This manual validation should be handled by validation middleware
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }
      
      const user = await userService.getUserByEmail(email as string);
      
      const response: ApiResponse<typeof user> = {
        success: true,
        data: user
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves paginated list of films purchased by a specific user.
   * 
   * @param {Request} req - Express request object with userId in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @query {number} page - Page number (defaults to 1)
   * @query {number} limit - Items per page (defaults to 20)
   * 
   * @returns {Promise<void>} - Returns paginated list of purchased films
   */
  async getUserPurchasedFilms(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
      // TODO: Extract pagination logic to shared utility or middleware
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await userService.getUserPurchasedFilms(userId, page, limit);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Checks if a specific user has purchased a specific film.
   * 
   * @param {Request} req - Express request object with userId and filmId in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns boolean indicating purchase status
   */
  async checkFilmPurchased(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, filmId } = req.params;
      const isPurchased = await userService.checkFilmPurchased(userId, filmId);
      
      res.json({
        success: true,
        data: { purchased: isPurchased }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves comprehensive statistics for a user's activity.
   * 
   * @param {Request} req - Express request object with userId in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns user statistics (total purchases, spending, etc.)
   */
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const stats = await userService.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves complete purchase history for a user.
   * 
   * @param {Request} req - Express request object with userId in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns array of purchase transactions
   */
  async getUserPurchaseHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const history = await userService.getUserPurchaseHistory(userId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves paginated list of all users in the system.
   * 
   * @param {Request} req - Express request object with query parameters
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @query {number} page - Page number (defaults to 1)
   * @query {number} limit - Items per page (defaults to 20)
   * 
   * @returns {Promise<void>} - Returns paginated user list with metadata
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await userService.getAllUsers(page, limit);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

}