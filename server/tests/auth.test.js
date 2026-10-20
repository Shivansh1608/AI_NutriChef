import request from 'supertest';
import mongoose from 'mongoose';

// Override env variables for test mode
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/ai-nutrichef-test';
process.env.JWT_SECRET = 'test_secret_key_12345';

import { app } from '../server.js';
import User from '../models/User.js';

describe('Authentication API Endpoints', () => {
  const testUser = {
    name: 'Test Runner',
    email: `tester-${Math.random().toString(36).substring(2, 7)}@test.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    // Clear test user collections
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
  });

  afterAll(async () => {
    // Disconnect mongoose connections
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.name).toEqual(testUser.name);
      expect(res.body.data.user.email).toEqual(testUser.email.toLowerCase());
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should fail registration if email is already taken', async () => {
      // Register duplicate
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(409); // Conflict
      expect(res.body.success).toBe(false);
    });

    it('should fail registration if name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noname@test.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(400); // Bad Request validation
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toEqual(testUser.email.toLowerCase());
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401); // Unauthorized
      expect(res.body.success).toBe(false);
    });
  });
});
