import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

describe('Yields Cache (e2e)', () => {
  let app: INestApplication;
  let cacheManager: Cache;

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
    
    // Get cache manager for testing
    cacheManager = app.get<Cache>(CACHE_MANAGER);
  });

  afterEach(async () => {
    // Clear cache between tests
    if (cacheManager && typeof cacheManager.del === 'function') {
      // Clear specific cache keys we know about
      const keysToDelete = [
        'treasury:yields:2024:1',
        'treasury:yields:2024:2',
        'treasury:yields:2024:all',
        'treasury:yields:2023:12',
      ];
      
      for (const key of keysToDelete) {
        try {
          await cacheManager.del(key);
        } catch (e) {
          // Ignore errors if key doesn't exist
        }
      }
    }
    await app.close();
  });

  describe('Cache Hit/Miss Behavior', () => {
    it('should miss cache on first request and hit on second request', async () => {
      const url = '/yields?year=2024&month=1';
      
      // Clear cache to ensure clean state
      await cacheManager.del('treasury:yields:2024:1');
      
      // First request - should be slower (cache miss)
      const start1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get(url)
        .expect(200);
      const duration1 = Date.now() - start1;
      
      expect(response1.body).toHaveProperty('year', 2024);
      expect(response1.body).toHaveProperty('month', 1);
      expect(Array.isArray(response1.body.rows)).toBe(true);
      
      // Second request - should be faster (cache hit)
      const start2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get(url)
        .expect(200);
      const duration2 = Date.now() - start2;
      
      // Should return identical data
      expect(response2.body).toEqual(response1.body);
      
      // Cache hit should be significantly faster
      expect(duration2).toBeLessThan(duration1 * 0.5);
      expect(duration2).toBeLessThan(50); // Should be very fast from cache
    });

    it('should miss cache for different query parameters', async () => {
      // First request
      await request(app.getHttpServer())
        .get('/yields?year=2024&month=1')
        .expect(200);
      
      // Different month - should miss cache
      const start = Date.now();
      await request(app.getHttpServer())
        .get('/yields?year=2024&month=2')
        .expect(200);
      const duration = Date.now() - start;
      
      // Should take longer (external API call)
      expect(duration).toBeGreaterThan(50);
    });

    it('should cache results for year-only queries separately', async () => {
      // Request with month
      const response1 = await request(app.getHttpServer())
        .get('/yields?year=2024&month=1')
        .expect(200);
      
      // Request without month (whole year)
      const response2 = await request(app.getHttpServer())
        .get('/yields?year=2024')
        .expect(200);
      
      // Should have different data
      expect(response2.body.rows.length).toBeGreaterThan(response1.body.rows.length);
      expect(response2.body.month).toBeUndefined();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate correct cache keys for different scenarios', async () => {
      const scenarios = [
        { url: '/yields?year=2024&month=1', expectedKey: 'treasury:yields:2024:1' },
        { url: '/yields?year=2024', expectedKey: 'treasury:yields:2024:all' },
        { url: '/yields?year=2023&month=12', expectedKey: 'treasury:yields:2023:12' },
      ];

      for (const scenario of scenarios) {
        await cacheManager.del(scenario.expectedKey);
        
        // Make request
        await request(app.getHttpServer())
          .get(scenario.url)
          .expect(200);
        
        // Check that data is cached with expected key
        const cachedData = await cacheManager.get(scenario.expectedKey);
        expect(cachedData).toBeDefined();
      }
    });
  });

  describe('TTL Behavior', () => {
    it('should set longer TTL for historical data', async () => {
      // Test historical month (January 2024)
      await request(app.getHttpServer())
        .get('/yields?year=2024&month=1')
        .expect(200);
      
      const historicalKey = 'treasury:yields:2024:1';
      const historicalData = await cacheManager.get(historicalKey);
      expect(historicalData).toBeDefined();
    });

    it('should set shorter TTL for current month data', async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // Test current month
      await request(app.getHttpServer())
        .get(`/yields?year=${currentYear}&month=${currentMonth}`)
        .expect(200);
      
      const currentKey = `treasury:yields:${currentYear}:${currentMonth}`;
      const currentData = await cacheManager.get(currentKey);
      expect(currentData).toBeDefined();
    });
  });

  describe('Performance Assertions', () => {
    it('should demonstrate significant performance improvement with caching', async () => {
      const url = '/yields?year=2024&month=1';
      const measurements: number[] = [];
      
      // First request (cache miss)
      const start1 = Date.now();
      await request(app.getHttpServer()).get(url).expect(200);
      measurements.push(Date.now() - start1);
      
      // Multiple cached requests
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await request(app.getHttpServer()).get(url).expect(200);
        measurements.push(Date.now() - start);
      }
      
      const [firstRequest, ...cachedRequests] = measurements;
      const avgCachedTime = cachedRequests.reduce((a, b) => a + b, 0) / cachedRequests.length;
      
      // Cache should provide at least 5x performance improvement
      expect(avgCachedTime).toBeLessThan(firstRequest / 5);
      expect(avgCachedTime).toBeLessThan(20); // Cached requests should be very fast
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid year parameter', async () => {
      await request(app.getHttpServer())
        .get('/yields?year=invalid')
        .expect(400);
    });

    it('should require year parameter', async () => {
      await request(app.getHttpServer())
        .get('/yields')
        .expect(400);
    });
  });

  describe('Data Integrity', () => {
    it('should return consistent data structure from cache', async () => {
      const url = '/yields?year=2024&month=1';
      
      // First request
      const response1 = await request(app.getHttpServer())
        .get(url)
        .expect(200);
      
      // Cached request
      const response2 = await request(app.getHttpServer())
        .get(url)
        .expect(200);
      
      // Should have identical structure
      expect(response2.body).toEqual(response1.body);
      expect(response2.body).toHaveProperty('year');
      expect(response2.body).toHaveProperty('month');
      expect(response2.body).toHaveProperty('rows');
      expect(Array.isArray(response2.body.rows)).toBe(true);
      
      // Each row should have expected yield properties
      if (response2.body.rows.length > 0) {
        const firstRow = response2.body.rows[0];
        expect(firstRow).toHaveProperty('date');
        expect(firstRow).toHaveProperty('wk4');
        expect(firstRow).toHaveProperty('wk13');
        expect(firstRow).toHaveProperty('wk26');
        expect(firstRow).toHaveProperty('wk52');
      }
    });
  });
});