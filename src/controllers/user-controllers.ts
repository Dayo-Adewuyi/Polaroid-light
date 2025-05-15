import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { CreateUserDto, ApiResponse } from '../types';

export class UserController {
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

  async getUserByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query;
      
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

  async getUserPurchasedFilms(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
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

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await userService.updateUser(id, updateData);
      
      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
        message: 'User updated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      await userService.deleteUser(id);
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}