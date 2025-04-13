import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes'; // ajuste o caminho se necessário

let app: express.Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  await registerRoutes(app);
});

describe('Procedures API', () => {
  it('GET /api/procedures should return array', async () => {
    const res = await request(app).get('/api/procedures');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/procedures should create procedure', async () => {
  const res = await request(app).post('/api/procedures').send({
    patientId: 1,
    dentistId: 1,
    toothNumber: 11,
    procedureType: 'TREATMENT',
    diagnosis: 'Pulpite',
    prognosis: 'Bom',
    value: 500,
    paymentMethod: 'PIX',
    paymentStatus: 'PAID',
    paymentDate: '2024-04-11',
    procedureDate: '2024-04-10',
    notes: 'Paciente tranquilo',
    canalMeasurements: 'MB=21mm, DB=20mm',
    initialXrayUrl: 'http://example.com/init.png',
    finalXrayUrl: 'http://example.com/final.png',
    thirdXrayUrl: 'http://example.com/3rd.png',
  });

  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('id');
  expect(res.body.toothNumber).toBe(11);
  expect(res.body.diagnosis).toBe('Pulpite');
  expect(res.body.paymentMethod).toBe('PIX');
 });
});
