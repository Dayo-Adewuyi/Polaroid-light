import { FilmService } from '../../services/film-service';
import { FilmRepository, PurchaseRepository, UserRepository } from '../../repositories';
import { ApiError } from '../../types';

jest.mock('../../repositories');

describe('FilmService', () => {
  let filmService: FilmService;
  let mockFilmRepository: jest.Mocked<FilmRepository>;
  let mockPurchaseRepository: jest.Mocked<PurchaseRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockFilmRepository = new FilmRepository() as jest.Mocked<FilmRepository>;
    mockPurchaseRepository = new PurchaseRepository() as jest.Mocked<PurchaseRepository>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    
    filmService = new FilmService(
      mockFilmRepository,
      mockPurchaseRepository,
      mockUserRepository
    );
  });

  describe('createFilm', () => {
    it('should create a film with valid data', async () => {
      const filmData = {
        title: 'Test Film',
        description: 'Test Description',
        price: 1000,
        videoUrl: 'https://example.com/video.mp4',
        uploadedBy: 'user123',
      };

      const createdFilm = {
        id: 'film123',
        ...filmData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFilmRepository.create.mockResolvedValue(createdFilm);

      const result = await filmService.createFilm(filmData);

      expect(mockFilmRepository.create).toHaveBeenCalledWith({
        title: filmData.title.trim(),
        description: filmData.description.trim(),
        price: filmData.price,
        videoUrl: filmData.videoUrl,
        uploadedBy: filmData.uploadedBy,
      });
      expect(result).toEqual(createdFilm);
    });

    it('should throw error for negative price', async () => {
      const filmData = {
        title: 'Test Film',
        description: 'Test Description',
        price: -100,
        videoUrl: 'https://example.com/video.mp4',
        uploadedBy: 'user123',
      };

      await expect(filmService.createFilm(filmData)).rejects.toThrow(
        new ApiError(400, 'Price cannot be negative')
      );
    });

    it('should throw error for empty title', async () => {
      const filmData = {
        title: '   ',
        description: 'Test Description',
        price: 1000,
        videoUrl: 'https://example.com/video.mp4',
        uploadedBy: 'user123',
      };

      await expect(filmService.createFilm(filmData)).rejects.toThrow(
        new ApiError(400, 'Title is required')
      );
    });
  });

  describe('getFilmById', () => {
    it('should return a film when it exists', async () => {
      const film = { id: 'film123', title: 'Test Film' };
      mockFilmRepository.findById.mockResolvedValue(film as any);

      const result = await filmService.getFilmById('film123');

      expect(mockFilmRepository.findById).toHaveBeenCalledWith('film123');
      expect(result).toEqual(film);
    });

    it('should throw error when film not found', async () => {
      mockFilmRepository.findById.mockResolvedValue(null);

      await expect(filmService.getFilmById('nonexistent')).rejects.toThrow(
        new ApiError(404, 'Film not found')
      );
    });
  });

  describe('purchaseFilm', () => {
    it('should create a purchase for existing user', async () => {
      const film = { id: 'film123', title: 'Test Film' };
      const user = { id: 'user123', email: 'test@example.com', name: 'Test User' };
      const purchase = {
        id: 'purchase123',
        userId: 'user123',
        filmId: 'film123',
        createdAt: new Date(),
      };

      mockFilmRepository.findById.mockResolvedValue(film as any);
      mockUserRepository.findById.mockResolvedValue(user as any);
      mockPurchaseRepository.checkIfPurchased.mockResolvedValue(false);
      mockPurchaseRepository.createPurchase.mockResolvedValue(purchase as any);

      const result = await filmService.purchaseFilm('user123', 'film123');

      expect(mockPurchaseRepository.createPurchase).toHaveBeenCalledWith('user123', 'film123');
      expect(result).toEqual(purchase);
    });


    it('should throw error if film already purchased', async () => {
      const film = { id: 'film123', title: 'Test Film' };
      const user = { id: 'user123', email: 'test@example.com', name: 'Test User' };

      mockFilmRepository.findById.mockResolvedValue(film as any);
      mockUserRepository.findById.mockResolvedValue(user as any);
      mockPurchaseRepository.checkIfPurchased.mockResolvedValue(true);

      await expect(filmService.purchaseFilm('user123', 'film123')).rejects.toThrow(
        new ApiError(409, 'Film already purchased by this user')
      );
    });
  });

  describe('deleteFilm', () => {
    it('should delete film without purchases', async () => {
      const film = { id: 'film123', title: 'Test Film' };

      mockFilmRepository.findById.mockResolvedValue(film as any);
      mockPurchaseRepository.getFilmPurchaseCount.mockResolvedValue(0);
      mockFilmRepository.delete.mockResolvedValue(film as any);

      await filmService.deleteFilm('film123');

      expect(mockFilmRepository.delete).toHaveBeenCalledWith('film123');
    });

    it('should throw error if film has purchases', async () => {
      const film = { id: 'film123', title: 'Test Film' };

      mockFilmRepository.findById.mockResolvedValue(film as any);
      mockPurchaseRepository.getFilmPurchaseCount.mockResolvedValue(5);

      await expect(filmService.deleteFilm('film123')).rejects.toThrow(
        new ApiError(400, 'Cannot delete film with existing purchases')
      );
    });
  });
});
