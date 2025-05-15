import { User } from '@prisma/client';
import { BaseRepository } from './base-repository';
import prisma from '../lib/prisma';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(prisma, prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findWithPurchases(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        purchases: {
          include: {
            film: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async getPurchasedFilms(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [purchases, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          film: true,
        },
      }),
      this.prisma.purchase.count({
        where: { userId },
      }),
    ]);

    const films = purchases.map((purchase) => purchase.film);

    return {
      films,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserStats(userId: string) {
    const [totalPurchases, purchases] = await this.prisma.$transaction([
      this.prisma.purchase.count({
        where: { userId },
      }),
      this.prisma.purchase.findMany({
        where: { userId },
        include: {
          film: {
            select: {
              price: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    const totalSpent = purchases.reduce(
      (sum, purchase) => sum + purchase.film.price,
      0
    );

    return {
      totalPurchases,
      totalSpent,
      firstPurchase: purchases[0]?.createdAt || null,
      lastPurchase: purchases[purchases.length - 1]?.createdAt || null,
    };
  }
}