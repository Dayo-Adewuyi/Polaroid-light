import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL
});

beforeAll(async () => {
  try {
    execSync('npx prisma migrate reset --force --skip-seed', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL
      }
    });
  } catch (error) {
    console.log('Database reset failed, trying to apply migrations...');
    
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL
      }
    });
  }

  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    return {
      pass,
      message: () => pass 
        ? `expected ${received} not to be a valid UUID`
        : `expected ${received} to be a valid UUID`
    };
  }
});

jest.setTimeout(30000);

