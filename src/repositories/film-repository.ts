import { Film, Prisma } from '@prisma/client';
import { BaseRepository } from './base-repository';
import prisma from '../lib/prisma';

export class FilmRepository extends BaseRepository<Film> {
  constructor() {
    super(prisma, prisma.film);
  }

  async findWithPurchases(id: string) {
    return this.prisma.film.findUnique({
      where: { id },
      include: {
        purchases: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findManyPaginated(
    page: number = 1,
    limit: number = 20,
    orderBy: Prisma.FilmOrderByWithRelationInput = { createdAt: 'desc' }
  ) {
    const skip = (page - 1) * limit;

    const [films, total] = await this.prisma.$transaction([
      this.prisma.film.findMany({
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.film.count(),
    ]);

    return {
      films,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

}