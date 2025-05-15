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

  async search(
    query: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.FilmWhereInput = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [films, total] = await this.prisma.$transaction([
      this.prisma.film.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.film.count({ where }),
    ]);

    return { films, total };
  }

  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.FilmWhereInput = {
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
    };

    const [films, total] = await this.prisma.$transaction([
      this.prisma.film.findMany({
        where,
        skip,
        take: limit,
        orderBy: { price: 'asc' },
      }),
      this.prisma.film.count({ where }),
    ]);

    return { films, total };
  }
}