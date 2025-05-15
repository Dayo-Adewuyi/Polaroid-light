import { Purchase } from '@prisma/client';
import { BaseRepository } from './base-repository';
import prisma from '../lib/prisma';

export class PurchaseRepository extends BaseRepository<Purchase> {
  constructor() {
    super(prisma, prisma.purchase);
  }

  async createPurchase(userId: string, filmId: string) {
    return this.prisma.purchase.create({
      data: {
        userId,
        filmId,
      },
      include: {
        film: true,
      },
    });
  }

  async findByUserAndFilm(userId: string, filmId: string): Promise<Purchase | null> {
    return this.prisma.purchase.findUnique({
      where: {
        userId_filmId: {
          userId,
          filmId,
        },
      },
    });
  }

  async checkIfPurchased(userId: string, filmId: string): Promise<boolean> {
    const purchase = await this.findByUserAndFilm(userId, filmId);
    return !!purchase;
  }

  async getUserPurchaseHistory(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      include: {
        film: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getFilmPurchaseCount(filmId: string): Promise<number> {
    return this.prisma.purchase.count({
      where: { filmId },
    });
  }
}