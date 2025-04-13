import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../server/routes';

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  await registerRoutes(app);
});

describe('Dentists API', () => {
  it('GET /api/dentists should return array', async () => {
    const res = await request(app).get('/api/dentists');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/dentists should create dentist', async () => {
    const res = await request(app).post('/api/dentists').send({
      name: 'Dr. Teste',
      clinic: 'Clínica XYZ',
      email: 'teste@clinica.com',
      phone: '11999999999',
      address: 'Rua dos Testes, 123',
      cro: 'SP12345',
      financialModel: 'fixed'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Dr. Teste');
  });
});
