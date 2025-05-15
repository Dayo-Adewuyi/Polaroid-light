import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import App from '../../app';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
});

const app = new App().app;

describe('Film Service Integration Tests', () => {
  let createdFilmId: string;
  let createdUserId: string;
  let purchaseUserId: string;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      }
    });

    await prisma.$connect();
    
    try {
      await prisma.purchase.deleteMany({});
      await prisma.film.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.error('Error cleaning database:', error);
    }
  });

  afterAll(async () => {
    try {
      await prisma.purchase.deleteMany({});
      await prisma.film.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          email: userData.email,
          name: userData.name,
          id: expect.any(String)
        },
        message: 'User created successfully'
      });

      createdUserId = response.body.data.id;
    });

    it('should fail to create user with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Another User'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Email already exists',
          code: 409
        }
      });
    });

    it('should fail to create user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(400);
    });

    it('should create a second user for purchase testing', async () => {
      const userData = {
        email: 'purchaser@example.com',
        name: 'Purchase User'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      purchaseUserId = response.body.data.id;
    });
  });

  describe('POST /api/v1/films', () => {
    it('should create a new film successfully', async () => {
      const filmData = {
        title: 'Test Film',
        description: 'This is a test film description',
        price: 1500,
        videoUrl: 'https://example.com/video.mp4'
      };

      const response = await request(app)
        .post('/api/v1/films')
        .set('x-user-id', createdUserId)
        .send(filmData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          title: filmData.title,
          description: filmData.description,
          price: filmData.price,
          videoUrl: filmData.videoUrl,
          uploadedBy: createdUserId,
          id: expect.any(String)
        },
        message: 'Film created successfully'
      });

      createdFilmId = response.body.data.id;
    });

    it('should fail to create film with negative price', async () => {
      const filmData = {
        title: 'Invalid Film',
        description: 'Film with negative price',
        price: -100,
        videoUrl: 'https://example.com/video.mp4'
      };

      const response = await request(app)
        .post('/api/v1/films')
        .send(filmData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 400
        }
      });
    });

    it('should fail to create film without required fields', async () => {
      const filmData = {
        title: 'Incomplete Film'
      };

      const response = await request(app)
        .post('/api/v1/films')
        .send(filmData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/films', () => {
    beforeAll(async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/films')
          .send({
            title: `Film ${i}`,
            description: `Description for film ${i}`,
            price: 1000 + (i * 100),
            videoUrl: `https://example.com/video${i}.mp4`
          });
      }
    });

    it('should retrieve paginated list of films', async () => {
      const response = await request(app)
        .get('/api/v1/films')
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        films: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        totalPages: expect.any(Number)
      });

      expect(response.body.films.length).toBeLessThanOrEqual(3);
    });

    it('should retrieve film by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/films/${createdFilmId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: createdFilmId,
          title: 'Test Film'
        }
      });
    });

    it('should return 404 for non-existent film', async () => {
      const fakeId = uuidv4();
      const response = await request(app)
        .get(`/api/v1/films/${fakeId}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Film not found',
          code: 404
        }
      });
    });
  });

  

  describe('POST /api/v1/films/:id/purchase', () => {
    it('should purchase film successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/films/${createdFilmId}/purchase`)
        .send({ userId: purchaseUserId })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          userId: purchaseUserId,
          filmId: createdFilmId,
          id: expect.any(String)
        },
        message: 'Film purchased successfully'
      });
    });

    it('should fail to purchase already purchased film', async () => {
      const response = await request(app)
        .post(`/api/v1/films/${createdFilmId}/purchase`)
        .send({ userId: purchaseUserId })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Film already purchased by this user',
          code: 409
        }
      });
    });

    it('should create new user automatically if not exists', async () => {
      const newUserId = uuidv4();
      const response = await request(app)
        .post(`/api/v1/films/${createdFilmId}/purchase`)
        .send({ userId: newUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(newUserId);
    });
  });

  describe('PUT /api/v1/films/:id', () => {
    it('should update film successfully', async () => {
      const updateData = {
        title: 'Updated Film Title',
        price: 2000
      };

      const response = await request(app)
        .put(`/api/v1/films/${createdFilmId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: createdFilmId,
          title: updateData.title,
          price: updateData.price
        },
        message: 'Film updated successfully'
      });
    });

    it('should fail to update with invalid data', async () => {
      const updateData = {
        price: -500
      };

      const response = await request(app)
        .put(`/api/v1/films/${createdFilmId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/films/:id/stats', () => {
    it('should get film purchase statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/films/${createdFilmId}/stats`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          filmId: createdFilmId,
          totalPurchases: expect.any(Number)
        }
      });

      expect(response.body.data.totalPurchases).toBeGreaterThan(0);
    });
  });

  describe('User-related endpoints', () => {
    it('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${createdUserId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: createdUserId,
          email: 'test@example.com',
          name: 'Test User'
        }
      });
    });

    it('should get user purchased films', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${purchaseUserId}/films`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        films: expect.any(Array),
        total: expect.any(Number)
      });

      expect(response.body.films.length).toBeGreaterThan(0);
    });

    it('should check if user purchased specific film', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${purchaseUserId}/films/${createdFilmId}/check`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          purchased: true
        }
      });
    });

    it('should get user stats', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${purchaseUserId}/stats`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalPurchases: expect.any(Number),
          totalSpent: expect.any(Number),
          firstPurchase: expect.any(String),
          lastPurchase: expect.any(String)
        }
      });
    });

    it('should get user purchase history', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${purchaseUserId}/purchase-history`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

  });

  describe('DELETE /api/v1/films/:id', () => {
    it('should fail to delete film with purchases', async () => {
      const response = await request(app)
        .delete(`/api/v1/films/${createdFilmId}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Cannot delete film with existing purchases',
          code: 400
        }
      });
    });

    it('should delete film without purchases', async () => {
      const createResponse = await request(app)
        .post('/api/v1/films')
        .send({
          title: 'Film to Delete',
          description: 'This film will be deleted',
          price: 1000,
          videoUrl: 'https://example.com/delete.mp4'
        })
        .expect(201);

      const filmToDeleteId = createResponse.body.data.id;

      const deleteResponse = await request(app)
        .delete(`/api/v1/films/${filmToDeleteId}`)
        .expect(200);

      expect(deleteResponse.body).toMatchObject({
        success: true,
        message: 'Film deleted successfully'
      });

      await request(app)
        .get(`/api/v1/films/${filmToDeleteId}`)
        .expect(404);
    });
  });


  describe('Error Handling', () => {
    it('should handle invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/films/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(400);
    });

    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Route not found',
          code: 404
        }
      });
    });

  });
});

describe('Performance Tests', () => {
  it('should handle concurrent requests efficiently', async () => {
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app)
          .get('/api/v1/films')
          .query({ page: 1, limit: 10 })
      );
    }

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    expect(endTime - startTime).toBeLessThan(5000);
  });
});