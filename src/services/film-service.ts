import { Film, Prisma, Purchase } from '@prisma/client';
import { FilmRepository, PurchaseRepository, UserRepository } from '../repositories';
import { CreateFilmDto, FilmWithPurchases, ApiError } from '../types';
import logger from '../utils/logger';

export class FilmService {
  constructor(
    private filmRepository: FilmRepository,
    private purchaseRepository: PurchaseRepository,
    private userRepository: UserRepository
  ) {}

  async createFilm(data: CreateFilmDto): Promise<Film> {
    if (data.price < 0) {
      throw new ApiError(400, 'Price cannot be negative');
    }

    if (!data.title || data.title.trim().length === 0) {
      throw new ApiError(400, 'Title is required');
    }

    return this.filmRepository.create({
      title: data.title.trim(),
      description: data.description.trim(),
      price: data.price,
      videoUrl: data.videoUrl,
      uploadedBy: data.uploadedBy,
    });
  }

  async getAllFilms(page: number = 1, limit: number = 20) {
    return this.filmRepository.findManyPaginated(page, limit);
  }

  async getFilmById(id: string): Promise<Film> {
    const film = await this.filmRepository.findById(id);
    
    if (!film) {
      throw new ApiError(404, 'Film not found');
    }

    return film;
  }

  async getFilmWithPurchases(id: string): Promise<FilmWithPurchases> {
    const film = await this.filmRepository.findWithPurchases(id);
    
    if (!film) {
      throw new ApiError(404, 'Film not found');
    }

    return film as FilmWithPurchases;
  }

  async purchaseFilm(userId: string, filmId: string): Promise<Purchase> {
    const film = await this.getFilmById(filmId);
    if (!film) {
      throw new ApiError(404, 'Film not found');
    }
  
    let user = await this.userRepository.findById(userId);
    
    if (!user) {
      logger.info('User not found, creating new user', { userId });
      
      user = await this.userRepository.create({
        id: userId, 
        email: `user-${userId}@polaroid.com`,
        name: `User ${userId}`
      });
      
    }
  
    const alreadyPurchased = await this.purchaseRepository.checkIfPurchased(
      user.id, 
      filmId
    );
    
    if (alreadyPurchased) {
      throw new ApiError(409, 'Film already purchased by this user');
    }
  
    return await this.purchaseRepository.createPurchase(user.id, filmId);
  }



  async updateFilm(id: string, data: Partial<CreateFilmDto>): Promise<Film> {
    await this.getFilmById(id);

    if (data.price !== undefined && data.price < 0) {
      throw new ApiError(400, 'Price cannot be negative');
    }

    const updateData: Prisma.FilmUpdateInput = {};
    
    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }
    
    if (data.price !== undefined) {
      updateData.price = data.price;
    }
    
    if (data.videoUrl !== undefined) {
      updateData.videoUrl = data.videoUrl;
    }

    return this.filmRepository.update(id, updateData);
  }

  async deleteFilm(id: string): Promise<void> {
    await this.getFilmById(id);

    const purchaseCount = await this.purchaseRepository.getFilmPurchaseCount(id);
    
    if (purchaseCount > 0) {
      throw new ApiError(400, 'Cannot delete film with existing purchases');
    }

    await this.filmRepository.delete(id);
  }

  async getFilmPurchaseStats(id: string) {
    await this.getFilmById(id);
    
    const purchaseCount = await this.purchaseRepository.getFilmPurchaseCount(id);
    
    return {
      filmId: id,
      totalPurchases: purchaseCount,
    };
  }
}