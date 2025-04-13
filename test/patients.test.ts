import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../server/routes';

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  await registerRoutes(app);
});

describe('Patients API', () => {
  it('GET /api/patients should return array', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
