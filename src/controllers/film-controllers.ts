import { Request, Response, NextFunction } from 'express';
import { filmService } from '../services';
import { CreateFilmDto, ApiResponse } from '../types';

/**
 * FilmController handles all HTTP requests related to film operations.
 * Implements RESTful API endpoints for film CRUD operations and related business logic.
 * 
 * @class FilmController
 * @implements Controller pattern for film resources
 */
export class FilmController {
  /**
   * Creates a new film in the system.
   * 
   * @param {Request} req - Express request object containing film data in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function for error handling
   * 
   * @returns {Promise<void>} - Returns 201 status with created film data
   * 
   * @throws {ApiError} - Forwards any service layer errors to error middleware
   * 
   * @example
   * POST /api/v1/films
   * Body: { title: "Film Title", description: "Description", price: 1500, videoUrl: "https://..." }
   * Headers: { "x-user-id": "user-123" }
   */
  async createFilm(req: Request, res: Response, next: NextFunction) {
    try {
      const filmData: CreateFilmDto = req.body;
  
      filmData.uploadedBy = req.headers['x-user-id'] as string || 'user123';
      
      const film = await filmService.createFilm(filmData);
      
      const response: ApiResponse<typeof film> = {
        success: true,
        data: film,
        message: 'Film created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a paginated list of all films.
   * 
   * @param {Request} req - Express request object with optional query params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @query {number} page - Page number (defaults to 1)
   * @query {number} limit - Number of items per page (defaults to 20)
   * 
   * @returns {Promise<void>} - Returns paginated film list with metadata

   */
  async getAllFilms(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await filmService.getAllFilms(page, limit);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a single film by its unique identifier.
   * 
   * @param {Request} req - Express request object containing film ID in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns film data if found
   * 
   * @throws {ApiError} - 404 if film not found
   */
  async getFilmById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const film = await filmService.getFilmById(id);
      
      const response: ApiResponse<typeof film> = {
        success: true,
        data: film
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Processes a film purchase transaction.
   * 
   * @param {Request} req - Express request object with film ID and optional user ID
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns purchase confirmation with transaction details
   */
  async purchaseFilm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      // Priority: body.userId > header > fallback
      const userId = req.body.userId || req.headers['x-user-id'] as string || 'user123';
      
      const purchase = await filmService.purchaseFilm(userId, id);
      
      const response: ApiResponse<typeof purchase> = {
        success: true,
        data: purchase,
        message: 'Film purchased successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing film's information.
   * 
   * @param {Request} req - Express request object with film ID and update data
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns updated film data
   */
  async updateFilm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const film = await filmService.updateFilm(id, updateData);
      
      const response: ApiResponse<typeof film> = {
        success: true,
        data: film,
        message: 'Film updated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft deletes a film from the system.
   * 
   * @param {Request} req - Express request object with film ID
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns success confirmation
   */
  async deleteFilm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      await filmService.deleteFilm(id);
      
      res.json({
        success: true,
        message: 'Film deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves statistical information about a film's performance.
   * 
   * @param {Request} req - Express request object with film ID
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * 
   * @returns {Promise<void>} - Returns film statistics (purchases, revenue, etc.)
   */
  async getFilmStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const stats = await filmService.getFilmPurchaseStats(id);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}