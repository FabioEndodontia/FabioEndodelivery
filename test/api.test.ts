import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes'; // ajuste se seu arquivo estiver em outro caminho

let app: express.Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  await registerRoutes(app); // carrega as rotas antes dos testes
});

describe('API Test - Patients', () => {
  it('GET /api/patients should return an array', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
