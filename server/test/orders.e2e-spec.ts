import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global pipes like in main.ts
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();
    
    // Get prisma service for database cleanup
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.order.deleteMany();
    await app.close();
  });

  describe('POST /orders', () => {
    it('should create a new order with valid data', async () => {
      const orderData = {
        term: 13,
        amount: 1000,
        date: '2024-08-17'
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.term).toBe(orderData.term);
      expect(response.body.amount).toBe(orderData.amount.toString()); // Decimal comes back as string
      expect(response.body.submitted_at).toBe('2024-08-17T00:00:00.000Z');
    });

    it('should validate minimum amount of $100', async () => {
      const orderData = {
        term: 13,
        amount: 50, // Below minimum
        date: '2024-08-17'
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(400);
    });

    it('should validate term is between 1 and 52 weeks', async () => {
      // Test term too low
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          term: 0,
          amount: 1000,
          date: '2024-08-17'
        })
        .expect(400);

      // Test term too high
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          term: 53,
          amount: 1000,
          date: '2024-08-17'
        })
        .expect(400);
    });

    it('should validate date format', async () => {
      const orderData = {
        term: 13,
        amount: 1000,
        date: 'invalid-date'
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(400);
    });

    it('should require all fields', async () => {
      // Missing term
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          amount: 1000,
          date: '2024-08-17'
        })
        .expect(400);

      // Missing amount
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          term: 13,
          date: '2024-08-17'
        })
        .expect(400);

      // Missing date
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          term: 13,
          amount: 1000
        })
        .expect(400);
    });

    it('should handle decimal amounts correctly', async () => {
      const orderData = {
        term: 26,
        amount: 1500.75,
        date: '2024-08-17'
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.amount).toBe('1500.75');
    });

    it('should validate amount is positive', async () => {
      const orderData = {
        term: 13,
        amount: -100,
        date: '2024-08-17'
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(400);
    });
  });

  describe('GET /orders', () => {
    it('should return empty array when no orders exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return all orders when they exist', async () => {
      // Create some test orders first
      const order1 = {
        term: 13,
        amount: 1000,
        date: '2024-08-17'
      };

      const order2 = {
        term: 26,
        amount: 2000,
        date: '2024-08-18'
      };

      // Create orders
      await request(app.getHttpServer())
        .post('/orders')
        .send(order1)
        .expect(201);

      await request(app.getHttpServer())
        .post('/orders')
        .send(order2)
        .expect(201);

      // Get all orders
      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);

      // Verify order structure
      response.body.forEach(order => {
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('term');
        expect(order).toHaveProperty('amount');
        expect(order).toHaveProperty('submitted_at');
      });

      // Verify specific data
      const terms = response.body.map(order => order.term);
      expect(terms).toContain(13);
      expect(terms).toContain(26);

      const amounts = response.body.map(order => order.amount);
      expect(amounts).toContain('1000');
      expect(amounts).toContain('2000');
    });

    it('should return orders with correct data types', async () => {
      // Create a test order
      const orderData = {
        term: 13,
        amount: 1500.50,
        date: '2024-08-17'
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(201);

      // Get orders
      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      expect(response.body).toHaveLength(1);
      
      const order = response.body[0];
      expect(typeof order.id).toBe('number');
      expect(typeof order.term).toBe('number');
      expect(typeof order.amount).toBe('string'); // Decimal fields come as strings
      expect(typeof order.submitted_at).toBe('string'); // ISO date string
      
      // Verify date format
      expect(order.submitted_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Orders Integration', () => {
    it('should create and retrieve orders in sequence', async () => {
      // Initially no orders
      let response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);
      expect(response.body).toHaveLength(0);

      // Create first order
      const order1Data = {
        term: 4,
        amount: 500,
        date: '2024-08-17'
      };

      const createdOrder1 = await request(app.getHttpServer())
        .post('/orders')
        .send(order1Data)
        .expect(201);

      // Should now have one order
      response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(createdOrder1.body.id);

      // Create second order
      const order2Data = {
        term: 52,
        amount: 10000,
        date: '2024-08-18'
      };

      const createdOrder2 = await request(app.getHttpServer())
        .post('/orders')
        .send(order2Data)
        .expect(201);

      // Should now have two orders
      response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);
      expect(response.body).toHaveLength(2);

      const orderIds = response.body.map(order => order.id);
      expect(orderIds).toContain(createdOrder1.body.id);
      expect(orderIds).toContain(createdOrder2.body.id);
    });

    it('should handle multiple orders with same term but different amounts', async () => {
      const orders = [
        { term: 13, amount: 1000, date: '2024-08-17' },
        { term: 13, amount: 2000, date: '2024-08-17' },
        { term: 13, amount: 3000, date: '2024-08-17' }
      ];

      // Create all orders
      for (const orderData of orders) {
        await request(app.getHttpServer())
          .post('/orders')
          .send(orderData)
          .expect(201);
      }

      // Retrieve all orders
      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      expect(response.body).toHaveLength(3);
      
      // All should have same term
      response.body.forEach(order => {
        expect(order.term).toBe(13);
      });

      // But different amounts
      const amounts = response.body.map(order => order.amount).sort();
      expect(amounts).toEqual(['1000', '2000', '3000']);
    });
  });
});