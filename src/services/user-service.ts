import { User } from '@prisma/client';
import { UserRepository,PurchaseRepository  } from '../repositories';
import { CreateUserDto, UserWithPurchases, ApiError } from '../types';
import {v4 as uuidv4} from 'uuid';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private purchaseRepository: PurchaseRepository
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ApiError(400, 'Invalid email format');
    }

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ApiError(409, 'Email already exists');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new ApiError(400, 'Name is required');
    }

    return this.userRepository.create({
      id: data.userId || uuidv4(),
      email: data.email.toLowerCase(),
      name: data.name.trim(),
    });
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }

  async getUserPurchasedFilms(userId: string, page: number = 1, limit: number = 20) {
    await this.getUserById(userId);

    return this.userRepository.getPurchasedFilms(userId, page, limit);
  }

  async getUserWithPurchases(id: string): Promise<UserWithPurchases> {
    const user = await this.userRepository.findWithPurchases(id);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user as UserWithPurchases;
  }

  async checkFilmPurchased(userId: string, filmId: string): Promise<boolean> {
    await this.getUserById(userId);

    return this.purchaseRepository.checkIfPurchased(userId, filmId);
  }

  async getUserStats(userId: string) {
    await this.getUserById(userId);

    return this.userRepository.getUserStats(userId);
  }

  async getUserPurchaseHistory(userId: string) {
    await this.getUserById(userId);

    return this.purchaseRepository.getUserPurchaseHistory(userId);
  }

  async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userRepository.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.userRepository.count(),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUser(id: string, data: Partial<CreateUserDto>): Promise<User> {
    await this.getUserById(id);

    const updateData: any = {};

    if (data.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new ApiError(400, 'Invalid email format');
      }

      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ApiError(409, 'Email already exists');
      }

      updateData.email = data.email.toLowerCase();
    }

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new ApiError(400, 'Name cannot be empty');
      }
      updateData.name = data.name.trim();
    }

    return this.userRepository.update(id, updateData);
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUserById(id);

    await this.userRepository.delete(id);
  }
}