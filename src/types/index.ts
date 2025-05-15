import { Film, User, Purchase } from '@prisma/client';

export interface CreateFilmDto {
  title: string;
  description: string;
  price: number; 
  videoUrl: string;
  uploadedBy: string; 
}

export interface CreateUserDto {
  userId?: string;
  email: string;
  name: string;
}

export interface FilmWithPurchases extends Film {
  purchases: (Purchase & {
    user: {
      id: string;
      name: string;
      email: string;
    };
  })[];
}

export interface UserWithPurchases extends User {
  purchases: (Purchase & {
    film: Film;
  })[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FilmSearchQuery extends PaginationQuery {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  orderBy?: 'price' | 'createdAt' | 'title';
  order?: 'asc' | 'desc';
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface PurchaseWithFilm extends Purchase {
  film: Film;
}

export interface PurchaseRequest {
  userId: string;
  filmId: string;
}

export interface UserStats {
  totalPurchases: number;
  totalSpent: number;
  firstPurchase: Date | null;
  lastPurchase: Date | null;
}