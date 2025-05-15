import { UserService } from '../../services/user-service';
import { UserRepository, PurchaseRepository } from '../../repositories';
import { ApiError } from '../../types';
import { User } from '@prisma/client';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPurchaseRepository: jest.Mocked<PurchaseRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findWithPurchases: jest.fn(),
      getPurchasedFilms: jest.fn(),
      getUserStats: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockPurchaseRepository = {
      checkIfPurchased: jest.fn(),
      getUserPurchaseHistory: jest.fn(),
    } as any;

    userService = new UserService(mockUserRepository, mockPurchaseRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validUserData = {
      email: 'test@example.com',
      name: 'Test User'
    };

    it('should create a user successfully with lowercase email and trimmed name', async () => {
      const expectedUser: User = {
        id: 'mock-uuid-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);

      const result = await userService.createUser({
        email: 'TEST@EXAMPLE.COM',
        name: '  Test User  '
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('TEST@EXAMPLE.COM');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        id: 'mock-uuid-123',
        email: 'test@example.com',
        name: 'Test User'
      });
      expect(result).toEqual(expectedUser);
    });

    it('should use provided userId if available', async () => {
      const providedUserId = 'custom-user-id';
      const userData = { ...validUserData, userId: providedUserId };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({} as User);

      await userService.createUser(userData);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        id: providedUserId,
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('should throw error for invalid email format', async () => {
      const invalidEmailData = { ...validUserData, email: 'invalid-email' };

      await expect(userService.createUser(invalidEmailData))
        .rejects.toThrow(new ApiError(400, 'Invalid email format'));

      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const existingUser = { id: 'existing-id' } as User;
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(userService.createUser(validUserData))
        .rejects.toThrow(new ApiError(409, 'Email already exists'));

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if name is empty', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.createUser({ ...validUserData, name: '' }))
        .rejects.toThrow(new ApiError(400, 'Name is required'));

      await expect(userService.createUser({ ...validUserData, name: '   ' }))
        .rejects.toThrow(new ApiError(400, 'Name is required'));

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' } as User;
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById('user-123');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById('non-existent'))
        .rejects.toThrow(new ApiError(404, 'User not found'));
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' } as User;
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.getUserByEmail('non-existent@example.com'))
        .rejects.toThrow(new ApiError(404, 'User not found'));
    });
  });

  describe('getUserPurchasedFilms', () => {
    it('should return purchased films after verifying user exists', async () => {
      const userId = 'user-123';
      const mockUser = { id: userId } as User;
      const mockFilms = { films: [], total: 0, page: 1, totalPages: 0 };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.getPurchasedFilms.mockResolvedValue(mockFilms);

      const result = await userService.getUserPurchasedFilms(userId, 2, 10);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.getPurchasedFilms).toHaveBeenCalledWith(userId, 2, 10);
      expect(result).toEqual(mockFilms);
    });

    it('should use default pagination values', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockResolvedValue({} as User);
      mockUserRepository.getPurchasedFilms.mockResolvedValue({} as any);

      await userService.getUserPurchasedFilms(userId);

      expect(mockUserRepository.getPurchasedFilms).toHaveBeenCalledWith(userId, 1, 20);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserPurchasedFilms('non-existent'))
        .rejects.toThrow(new ApiError(404, 'User not found'));

      expect(mockUserRepository.getPurchasedFilms).not.toHaveBeenCalled();
    });
  });

  describe('getUserWithPurchases', () => {
    it('should return user with purchases when found', async () => {
      const mockUserWithPurchases = {
        id: 'user-123',
        email: 'test@example.com',
        purchases: []
      };
      mockUserRepository.findWithPurchases.mockResolvedValue(mockUserWithPurchases as any);

      const result = await userService.getUserWithPurchases('user-123');

      expect(mockUserRepository.findWithPurchases).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUserWithPurchases);
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.findWithPurchases.mockResolvedValue(null);

      await expect(userService.getUserWithPurchases('non-existent'))
        .rejects.toThrow(new ApiError(404, 'User not found'));
    });
  });

  describe('checkFilmPurchased', () => {
    it('should check if film is purchased after verifying user exists', async () => {
      const userId = 'user-123';
      const filmId = 'film-456';
      mockUserRepository.findById.mockResolvedValue({} as User);
      mockPurchaseRepository.checkIfPurchased.mockResolvedValue(true);

      const result = await userService.checkFilmPurchased(userId, filmId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockPurchaseRepository.checkIfPurchased).toHaveBeenCalledWith(userId, filmId);
      expect(result).toBe(true);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.checkFilmPurchased('non-existent', 'film-123'))
        .rejects.toThrow(new ApiError(404, 'User not found'));

      expect(mockPurchaseRepository.checkIfPurchased).not.toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should return user stats after verifying user exists', async () => {
      const userId = 'user-123';
      const mockStats = { totalPurchases: 5, totalSpent: 1000 };
      
      mockUserRepository.findById.mockResolvedValue({} as User);
      mockUserRepository.getUserStats.mockResolvedValue(mockStats as any);

      const result = await userService.getUserStats(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.getUserStats).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockStats);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserStats('non-existent'))
        .rejects.toThrow(new ApiError(404, 'User not found'));

      expect(mockUserRepository.getUserStats).not.toHaveBeenCalled();
    });
  });

  describe('getUserPurchaseHistory', () => {
    it('should return purchase history after verifying user exists', async () => {
      const userId = 'user-123';
      const mockHistory = [{ id: 'purchase-1' }, { id: 'purchase-2' }];
      
      mockUserRepository.findById.mockResolvedValue({} as User);
      mockPurchaseRepository.getUserPurchaseHistory.mockResolvedValue(mockHistory as any);

      const result = await userService.getUserPurchaseHistory(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockPurchaseRepository.getUserPurchaseHistory).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockHistory);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserPurchaseHistory('non-existent'))
        .rejects.toThrow(new ApiError(404, 'User not found'));

      expect(mockPurchaseRepository.getUserPurchaseHistory).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users list', async () => {
      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }];
      const totalCount = 50;
      
      mockUserRepository.findMany.mockResolvedValue(mockUsers as User[]);
      mockUserRepository.count.mockResolvedValue(totalCount);

      const result = await userService.getAllUsers(2, 10);

      expect(mockUserRepository.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      expect(mockUserRepository.count).toHaveBeenCalled();
      expect(result).toEqual({
        users: mockUsers,
        total: totalCount,
        page: 2,
        totalPages: 5
      });
    });

    it('should use default pagination values', async () => {
      mockUserRepository.findMany.mockResolvedValue([]);
      mockUserRepository.count.mockResolvedValue(0);

      await userService.getAllUsers();

      expect(mockUserRepository.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('updateUser', () => {
    const userId = 'user-123';
    const existingUser = { id: userId, email: 'old@example.com', name: 'Old Name' } as User;

    beforeEach(() => {
      mockUserRepository.findById.mockResolvedValue(existingUser);
    });

    it('should update user email successfully', async () => {
      const newEmail = 'NEW@EXAMPLE.COM';
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue({} as User);

      await userService.updateUser(userId, { email: newEmail });

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(newEmail);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        email: 'new@example.com'
      });
    });

    it('should update user name successfully', async () => {
      mockUserRepository.update.mockResolvedValue({} as User);

      await userService.updateUser(userId, { name: '  New Name  ' });

      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        name: 'New Name'
      });
    });

    it('should update both email and name', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue({} as User);

      await userService.updateUser(userId, { 
        email: 'new@example.com',
        name: 'New Name'
      });

      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        email: 'new@example.com',
        name: 'New Name'
      });
    });

    it('should throw error if new email is invalid', async () => {
      await expect(userService.updateUser(userId, { email: 'invalid-email' }))
        .rejects.toThrow(new ApiError(400, 'Invalid email format'));

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if new email already exists for another user', async () => {
      const anotherUser = { id: 'another-id', email: 'taken@example.com' } as User;
      mockUserRepository.findByEmail.mockResolvedValue(anotherUser);

      await expect(userService.updateUser(userId, { email: 'taken@example.com' }))
        .rejects.toThrow(new ApiError(409, 'Email already exists'));

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should allow updating to same email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue({} as User);

      await userService.updateUser(userId, { email: 'old@example.com' });

      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        email: 'old@example.com'
      });
    });

    it('should throw error if name is empty', async () => {
      await expect(userService.updateUser(userId, { name: '' }))
        .rejects.toThrow(new ApiError(400, 'Name cannot be empty'));

      await expect(userService.updateUser(userId, { name: '   ' }))
        .rejects.toThrow(new ApiError(400, 'Name cannot be empty'));

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.updateUser('non-existent', { name: 'New Name' }))
        .rejects.toThrow(new ApiError(404, 'User not found'));

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user after verifying existence', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockResolvedValue({} as User);

      await userService.deleteUser(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.deleteUser('non-existent'))
        .rejects.toThrow(new ApiError(404, 'User not found'));

      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
  });
});