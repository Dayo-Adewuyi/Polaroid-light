import { Request, Response, NextFunction } from 'express';
import { filmService } from '../services';
import { CreateFilmDto, ApiResponse } from '../types';

export class FilmController {
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

  async purchaseFilm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
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

  async searchFilms(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      if (!q) {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }
      
      const result = await filmService.searchFilms(q as string, page, limit);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async getFilmsByPriceRange(req: Request, res: Response, next: NextFunction) {
    try {
      const minPrice = parseInt(req.query.minPrice as string) || 0;
      const maxPrice = parseInt(req.query.maxPrice as string) || 999999;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await filmService.getFilmsByPriceRange(minPrice, maxPrice, page, limit);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

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