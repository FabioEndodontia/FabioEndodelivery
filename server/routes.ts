import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-adapter"; // Atualizando para o adaptador SQLite/PostgreSQL
import { setupAntiHibernate } from "./anti-hibernate";
import { setupBackupRoutes } from "./db-backup";
import { ZodError } from "zod";
import { 
  insertPatientSchema, 
  insertDentistSchema, 
  insertProcedureSchema, 
  insertInvoiceSchema,
  insertAppointmentSchema,
  insertFinancialGoalSchema,
  insertAchievementSchema,
  insertMaterialSchema,
  insertProcedureMaterialSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { DatabaseStorage } from "./database-storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { log } from "./vite";

// Configuração do Multer para armazenar os arquivos de imagem
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads/images");
    // Certifique-se de que o diretório existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Cria um nome de arquivo único com timestamp
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para permitir apenas imagens
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado. Por favor, envie apenas imagens (JPEG, PNG, GIF, WebP)."));
  }
};

const upload = multer({ 
  storage: storage_config,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the database with sample data if empty
  if (storage instanceof DatabaseStorage) {
    try {
      await (storage as DatabaseStorage).seedInitialData();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  // Error handler for validation errors
  const handleValidationError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: 'An unexpected error occurred' });
  };

  // Dashboard data
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getProcedureStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get dashboard stats' });
    }
  });
  
  // Rota para métricas de procedimentos por tipo (tratamento/retratamento/etc)
  app.get('/api/dashboard/stats/procedures-by-type', async (req, res) => {
    try {
      const stats = await storage.getProcedureStats();
      res.json(stats.proceduresByType);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get procedure type stats' });
    }
  });
  
  // Rota para métricas de procedimentos por complexidade
  app.get('/api/dashboard/stats/procedures-by-complexity', async (req, res) => {
    try {
      const stats = await storage.getProcedureStats();
      res.json(stats.proceduresByComplexity);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get procedure complexity stats' });
    }
  });
  
  // Rota para métricas de desempenho de dentistas
  app.get('/api/dashboard/stats/dentist-performance', async (req, res) => {
    try {
      const stats = await storage.getProcedureStats();
      res.json(stats.dentistPerformance);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get dentist performance stats' });
    }
  });
  
  // Rota para métricas de receita mensal
  app.get('/api/dashboard/stats/revenue-by-month', async (req, res) => {
    try {
      const stats = await storage.getProcedureStats();
      res.json(stats.revenueByMonth);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get monthly revenue stats' });
    }
  });
  
  // Rota para comparação mensal
  app.get('/api/dashboard/stats/monthly-comparison', async (req, res) => {
    try {
      const stats = await storage.getProcedureStats();
      res.json(stats.monthlyComparison);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get monthly comparison stats' });
    }
  });

  app.get('/api/dashboard/recent-procedures', async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 5;
      const procedures = await storage.getRecentProcedures(limit);
      
      // Enhance procedures with patient and dentist names
      const enhanced = await Promise.all(procedures.map(async proc => {
        const patient = await storage.getPatient(proc.patientId);
        const dentist = await storage.getDentist(proc.dentistId);
        return {
          ...proc,
          patientName: patient?.name || 'Unknown Patient',
          dentistName: dentist?.name || 'Unknown Dentist',
        };
      }));
      
      res.json(enhanced);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get recent procedures' });
    }
  });

  app.get('/api/dashboard/pending-payments', async (req, res) => {
    try {
      const procedures = await storage.getPendingPayments();
      
      // Group by dentist
      const byDentist = new Map<number, { dentist: string; count: number; total: number }>();
      
      for (const proc of procedures) {
        const dentist = await storage.getDentist(proc.dentistId);
        if (!dentist) continue;
        
        if (!byDentist.has(proc.dentistId)) {
          byDentist.set(proc.dentistId, { 
            dentist: dentist.name, 
            count: 0, 
            total: 0 
          });
        }
        
        const entry = byDentist.get(proc.dentistId)!;
        entry.count += 1;
        entry.total += proc.value;
        byDentist.set(proc.dentistId, entry);
      }
      
      res.json(Array.from(byDentist.values()));
    } catch (err) {
      res.status(500).json({ message: 'Failed to get pending payments' });
    }
  });

  app.get('/api/dashboard/pending-invoices', async (req, res) => {
    try {
      const procedures = await storage.getPendingInvoices();
      
      // Group by dentist
      const byDentist = new Map<number, { dentist: string; count: number; total: number }>();
      
      for (const proc of procedures) {
        const dentist = await storage.getDentist(proc.dentistId);
        if (!dentist) continue;
        
        if (!byDentist.has(proc.dentistId)) {
          byDentist.set(proc.dentistId, { 
            dentist: dentist.name, 
            count: 0, 
            total: 0 
          });
        }
        
        const entry = byDentist.get(proc.dentistId)!;
        entry.count += 1;
        entry.total += proc.value;
        byDentist.set(proc.dentistId, entry);
      }
      
      res.json(Array.from(byDentist.values()));
    } catch (err) {
      res.status(500).json({ message: 'Failed to get pending invoices' });
    }
  });

  // Patients API
  app.get('/api/patients', async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get patients' });
    }
  });

  app.get('/api/patients/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      res.json(patient);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get patient' });
    }
  });

  app.post('/api/patients', async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.put('/api/patients/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.updatePatient(id, patientData);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      res.json(patient);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.delete('/api/patients/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deletePatient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete patient' });
    }
  });

  // Dentists API
  app.get('/api/dentists', async (req, res) => {
    try {
      const dentists = await storage.getDentists();
      res.json(dentists);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get dentists' });
    }
  });

  app.get('/api/dentists/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const dentist = await storage.getDentist(id);
      
      if (!dentist) {
        return res.status(404).json({ message: 'Dentist not found' });
      }
      
      res.json(dentist);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get dentist' });
    }
  });

  app.post('/api/dentists', async (req, res) => {
    try {
      const dentistData = insertDentistSchema.parse(req.body);
      const dentist = await storage.createDentist(dentistData);
      res.status(201).json(dentist);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.put('/api/dentists/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const dentistData = insertDentistSchema.parse(req.body);
      const dentist = await storage.updateDentist(id, dentistData);
      
      if (!dentist) {
        return res.status(404).json({ message: 'Dentist not found' });
      }
      
      res.json(dentist);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.delete('/api/dentists/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteDentist(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Dentist not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete dentist' });
    }
  });

  // Procedures API
  app.get('/api/procedures', async (req, res) => {
    try {
      const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
      const dentistId = req.query.dentistId ? Number(req.query.dentistId) : undefined;
      
      let procedures;
      if (patientId) {
        procedures = await storage.getProceduresByPatient(patientId);
      } else if (dentistId) {
        procedures = await storage.getProceduresByDentist(dentistId);
      } else {
        procedures = await storage.getProcedures();
      }
      
      // Enhance procedures with patient and dentist names
      const enhanced = await Promise.all(procedures.map(async proc => {
        const patient = await storage.getPatient(proc.patientId);
        const dentist = await storage.getDentist(proc.dentistId);
        return {
          ...proc,
          patientName: patient?.name || 'Unknown Patient',
          dentistName: dentist?.name || 'Unknown Dentist',
        };
      }));
      
      res.json(enhanced);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get procedures' });
    }
  });

  app.get('/api/procedures/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const procedure = await storage.getProcedure(id);
      
      if (!procedure) {
        return res.status(404).json({ message: 'Procedure not found' });
      }
      
      // Enhance procedure with patient and dentist names
      const patient = await storage.getPatient(procedure.patientId);
      const dentist = await storage.getDentist(procedure.dentistId);
      
      const enhanced = {
        ...procedure,
        patientName: patient?.name || 'Unknown Patient',
        dentistName: dentist?.name || 'Unknown Dentist',
      };
      
      res.json(enhanced);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get procedure' });
    }
  });

  app.post('/api/procedures', async (req, res) => {
    try {
      const procedureData = insertProcedureSchema.parse(req.body);
      const procedure = await storage.createProcedure(procedureData);
      res.status(201).json(procedure);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.put('/api/procedures/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const procedureData = insertProcedureSchema.partial().parse(req.body);
      const procedure = await storage.updateProcedure(id, procedureData);
      
      if (!procedure) {
        return res.status(404).json({ message: 'Procedure not found' });
      }
      
      res.json(procedure);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.delete('/api/procedures/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteProcedure(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Procedure not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete procedure' });
    }
  });

  // Rotas de relatórios
  app.get('/api/reports/dentist-procedures', async (req, res) => {
    try {
      const { startDate, endDate, dentistId, period } = req.query;
      
      // Converter parâmetros de consulta
      let start: Date | undefined;
      let end: Date | undefined;
      let dentist: number | undefined;
      
      // Configurar período com base no parâmetro 'period'
      const now = new Date();
      if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
      } else if (period === 'quarter') {
        const currentMonth = now.getMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
        start = new Date(now.getFullYear(), quarterStartMonth, 1);
        end = new Date();
      } else if (period === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date();
      } else if (startDate && typeof startDate === 'string') {
        start = new Date(startDate);
        
        if (endDate && typeof endDate === 'string') {
          end = new Date(endDate);
        }
      }
      
      if (dentistId && typeof dentistId === 'string') {
        dentist = parseInt(dentistId);
      }
      
      // Obter procedimentos
      const procedures = await storage.getProcedures();
      
      // Filtrar por período e dentista
      let filteredProcedures = procedures;
      
      if (start) {
        filteredProcedures = filteredProcedures.filter(proc => 
          new Date(proc.procedureDate) >= start!
        );
      }
      
      if (end) {
        filteredProcedures = filteredProcedures.filter(proc => 
          new Date(proc.procedureDate) <= end!
        );
      }
      
      if (dentist) {
        filteredProcedures = filteredProcedures.filter(proc => 
          proc.dentistId === dentist
        );
      }
      
      // Agrupar por dentista
      const dentistMap = new Map<number, {
        dentistId: number,
        name: string,
        totalProcedures: number,
        treatmentCount: number,
        retreatmentCount: number,
        totalValue: number,
        averageValue: number,
        procedures: any[]
      }>();
      
      // Processar procedimentos por dentista
      for (const proc of filteredProcedures) {
        const dentist = await storage.getDentist(proc.dentistId);
        if (!dentist) continue;
        
        if (!dentistMap.has(proc.dentistId)) {
          dentistMap.set(proc.dentistId, {
            dentistId: proc.dentistId,
            name: dentist.name,
            totalProcedures: 0,
            treatmentCount: 0,
            retreatmentCount: 0,
            totalValue: 0,
            averageValue: 0,
            procedures: []
          });
        }
        
        const entry = dentistMap.get(proc.dentistId)!;
        entry.totalProcedures += 1;
        
        if (proc.procedureType === 'treatment') {
          entry.treatmentCount += 1;
        } else if (proc.procedureType === 'retreatment') {
          entry.retreatmentCount += 1;
        }
        
        entry.totalValue += proc.value;
        entry.procedures.push({
          ...proc,
          procedureDate: new Date(proc.procedureDate).toISOString().split('T')[0]
        });
        
        dentistMap.set(proc.dentistId, entry);
      }
      
      // Calcular ticket médio
      dentistMap.forEach(entry => {
        if (entry.totalProcedures > 0) {
          entry.averageValue = Math.round((entry.totalValue / entry.totalProcedures) * 100) / 100;
        }
      });
      
      // Converter para array e ordenar por número de procedimentos
      const result = Array.from(dentistMap.values())
        .sort((a, b) => b.totalProcedures - a.totalProcedures);
      
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Falha ao gerar relatório de procedimentos por dentista' });
    }
  });

  // Invoices API
  app.get('/api/invoices', async (req, res) => {
    try {
      const procedureId = req.query.procedureId ? Number(req.query.procedureId) : undefined;
      
      let invoices;
      if (procedureId) {
        invoices = await storage.getInvoicesByProcedure(procedureId);
      } else {
        invoices = await storage.getInvoices();
      }
      
      // Enhance invoices with procedure, patient, and dentist details
      const enhanced = await Promise.all(invoices.map(async invoice => {
        const procedure = await storage.getProcedure(invoice.procedureId);
        if (!procedure) {
          return { ...invoice, procedureDetails: null };
        }
        
        const patient = await storage.getPatient(procedure.patientId);
        const dentist = await storage.getDentist(procedure.dentistId);
        
        return {
          ...invoice,
          procedureDetails: {
            ...procedure,
            patientName: patient?.name || 'Unknown Patient',
            dentistName: dentist?.name || 'Unknown Dentist',
          },
        };
      }));
      
      res.json(enhanced);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get invoices' });
    }
  });

  app.get('/api/invoices/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Enhance invoice with procedure, patient, and dentist details
      const procedure = await storage.getProcedure(invoice.procedureId);
      if (!procedure) {
        return res.json({ ...invoice, procedureDetails: null });
      }
      
      const patient = await storage.getPatient(procedure.patientId);
      const dentist = await storage.getDentist(procedure.dentistId);
      
      const enhanced = {
        ...invoice,
        procedureDetails: {
          ...procedure,
          patientName: patient?.name || 'Unknown Patient',
          dentistName: dentist?.name || 'Unknown Dentist',
        },
      };
      
      res.json(enhanced);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get invoice' });
    }
  });

  app.post('/api/invoices', async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.put('/api/invoices/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(id, invoiceData);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.delete('/api/invoices/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteInvoice(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete invoice' });
    }
  });

  // Appointments API (Calendly integration)
  app.get('/api/appointments', async (req, res) => {
    try {
      const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
      const dentistId = req.query.dentistId ? Number(req.query.dentistId) : undefined;
      
      let appointments;
      if (patientId) {
        appointments = await storage.getAppointmentsByPatient(patientId);
      } else if (dentistId) {
        appointments = await storage.getAppointmentsByDentist(dentistId);
      } else {
        appointments = await storage.getAppointments();
      }
      
      // Enhance appointments with patient and dentist names
      const enhanced = await Promise.all(appointments.map(async appointment => {
        const patient = await storage.getPatient(appointment.patientId);
        const dentist = await storage.getDentist(appointment.dentistId);
        return {
          ...appointment,
          patientName: patient?.name || 'Unknown Patient',
          dentistName: dentist?.name || 'Unknown Dentist',
        };
      }));
      
      res.json(enhanced);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get appointments' });
    }
  });

  app.get('/api/appointments/upcoming', async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 5;
      const appointments = await storage.getUpcomingAppointments(limit);
      
      // Enhance appointments with patient and dentist names
      const enhanced = await Promise.all(appointments.map(async appointment => {
        const patient = await storage.getPatient(appointment.patientId);
        const dentist = await storage.getDentist(appointment.dentistId);
        return {
          ...appointment,
          patientName: patient?.name || 'Unknown Patient',
          dentistName: dentist?.name || 'Unknown Dentist',
        };
      }));
      
      res.json(enhanced);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get upcoming appointments' });
    }
  });

  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Enhance appointment with patient and dentist names
      const patient = await storage.getPatient(appointment.patientId);
      const dentist = await storage.getDentist(appointment.dentistId);
      
      const enhanced = {
        ...appointment,
        patientName: patient?.name || 'Unknown Patient',
        dentistName: dentist?.name || 'Unknown Dentist',
      };
      
      res.json(enhanced);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get appointment' });
    }
  });

  app.post('/api/appointments', async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.put('/api/appointments/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(id, appointmentData);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.json(appointment);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteAppointment(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete appointment' });
    }
  });

  app.post('/api/appointments/:id/convert', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const procedure = await storage.convertAppointmentToProcedure(id);
      
      if (!procedure) {
        return res.status(404).json({ 
          message: 'Appointment not found or already converted to procedure' 
        });
      }
      
      res.status(201).json(procedure);
    } catch (err) {
      res.status(500).json({ 
        message: 'Failed to convert appointment to procedure' 
      });
    }
  });

  app.post('/api/calendly/sync', async (req, res) => {
    try {
      const { accessToken } = req.body;
      
      if (!accessToken) {
        return res.status(400).json({ 
          message: 'Calendly access token is required' 
        });
      }
      
      const result = await storage.syncCalendlyEvents(accessToken);
      res.json(result);
    } catch (err) {
      res.status(500).json({ 
        message: 'Failed to sync with Calendly' 
      });
    }
  });

  // Rota para servir imagens estáticas
  app.use('/uploads/images', (req, res, next) => {
    // Adiciona cabeçalhos para cache das imagens
    res.header('Cache-Control', 'max-age=31536000, public');
    next();
  }, express.static(path.join(process.cwd(), 'uploads/images')));
  
  // Rota para upload de imagens
  app.post('/api/upload/image', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem foi enviada' });
      }
      
      // Retorna o caminho da imagem para usar no frontend
      const imagePath = `/uploads/images/${req.file.filename}`;
      res.json({ 
        url: imagePath,
        message: 'Imagem enviada com sucesso' 
      });
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      res.status(500).json({ message: 'Falha ao enviar imagem' });
    }
  });

  // Financial Goals API Routes
  app.get('/api/financial-goals', async (req, res) => {
    try {
      const goals = await storage.getFinancialGoals();
      res.json(goals);
    } catch (error) {
      log(`Erro ao buscar metas financeiras: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao buscar metas financeiras' });
    }
  });

  app.get('/api/financial-goals/active', async (req, res) => {
    try {
      const activeGoals = await storage.getActiveGoals();
      res.json(activeGoals);
    } catch (error) {
      log(`Erro ao buscar metas financeiras ativas: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao buscar metas financeiras ativas' });
    }
  });

  app.get('/api/financial-goals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de meta inválido' });
      }

      const goal = await storage.getFinancialGoal(id);
      if (!goal) {
        return res.status(404).json({ error: 'Meta financeira não encontrada' });
      }

      res.json(goal);
    } catch (error) {
      log(`Erro ao buscar meta financeira: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao buscar meta financeira' });
    }
  });

  app.post('/api/financial-goals', async (req, res) => {
    try {
      const goalData = insertFinancialGoalSchema.parse(req.body);
      const newGoal = await storage.createFinancialGoal(goalData);
      res.status(201).json(newGoal);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.put('/api/financial-goals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de meta inválido' });
      }

      const goalData = req.body;
      const updatedGoal = await storage.updateFinancialGoal(id, goalData);
      
      if (!updatedGoal) {
        return res.status(404).json({ error: 'Meta financeira não encontrada' });
      }
      
      res.json(updatedGoal);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete('/api/financial-goals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de meta inválido' });
      }

      const success = await storage.deleteFinancialGoal(id);
      if (!success) {
        return res.status(404).json({ error: 'Meta financeira não encontrada' });
      }
      
      res.status(204).send();
    } catch (error) {
      log(`Erro ao excluir meta financeira: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao excluir meta financeira' });
    }
  });

  app.post('/api/financial-goals/:id/progress', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de meta inválido' });
      }

      const { value } = req.body;
      if (typeof value !== 'number') {
        return res.status(400).json({ error: 'Valor de progresso inválido' });
      }

      const updatedGoal = await storage.updateGoalProgress(id, value);
      if (!updatedGoal) {
        return res.status(404).json({ error: 'Meta financeira não encontrada' });
      }
      
      res.json(updatedGoal);
    } catch (error) {
      log(`Erro ao atualizar progresso da meta: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao atualizar progresso da meta' });
    }
  });

  app.post('/api/financial-goals/check-progress', async (req, res) => {
    try {
      const result = await storage.checkGoalsProgress();
      res.json(result);
    } catch (error) {
      log(`Erro ao verificar progresso das metas: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao verificar progresso das metas' });
    }
  });

  // Achievement API Routes
  app.get('/api/achievements', async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      log(`Erro ao buscar conquistas: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao buscar conquistas' });
    }
  });

  app.get('/api/achievements/user', async (req, res) => {
    try {
      const userAchievements = await storage.getUserAchievements();
      res.json(userAchievements);
    } catch (error) {
      log(`Erro ao buscar conquistas do usuário: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao buscar conquistas do usuário' });
    }
  });

  app.get('/api/achievements/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de conquista inválido' });
      }

      const achievement = await storage.getAchievement(id);
      if (!achievement) {
        return res.status(404).json({ error: 'Conquista não encontrada' });
      }

      res.json(achievement);
    } catch (error) {
      log(`Erro ao buscar conquista: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao buscar conquista' });
    }
  });

  app.post('/api/achievements', async (req, res) => {
    try {
      const achievementData = insertAchievementSchema.parse(req.body);
      const newAchievement = await storage.createAchievement(achievementData);
      res.status(201).json(newAchievement);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.put('/api/achievements/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de conquista inválido' });
      }

      const achievementData = req.body;
      const updatedAchievement = await storage.updateAchievement(id, achievementData);
      
      if (!updatedAchievement) {
        return res.status(404).json({ error: 'Conquista não encontrada' });
      }
      
      res.json(updatedAchievement);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete('/api/achievements/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de conquista inválido' });
      }

      const success = await storage.deleteAchievement(id);
      if (!success) {
        return res.status(404).json({ error: 'Conquista não encontrada' });
      }
      
      res.status(204).send();
    } catch (error) {
      log(`Erro ao excluir conquista: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao excluir conquista' });
    }
  });

  app.post('/api/achievements/:id/award', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de conquista inválido' });
      }

      const success = await storage.awardAchievement(id);
      if (!success) {
        return res.status(400).json({ error: 'Não foi possível conceder a conquista' });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      log(`Erro ao conceder conquista: ${error.message}`, 'routes');
      res.status(500).json({ error: 'Erro ao conceder conquista' });
    }
  });

  // API: Materiais
  app.get('/api/materials', async (req, res) => {
    try {
      const materials = await storage.getMaterials();
      res.json(materials);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      res.status(500).json({ message: 'Erro ao buscar materiais' });
    }
  });

  app.get('/api/materials/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: 'Material não encontrado' });
      }
      
      res.json(material);
    } catch (error) {
      console.error('Erro ao buscar material:', error);
      res.status(500).json({ message: 'Erro ao buscar material' });
    }
  });

  app.post('/api/materials', async (req, res) => {
    try {
      const materialData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(materialData);
      res.status(201).json(material);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch('/api/materials/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      // Validar parcialmente os dados
      const materialData = insertMaterialSchema.partial().parse(req.body);
      
      const updatedMaterial = await storage.updateMaterial(id, materialData);
      if (!updatedMaterial) {
        return res.status(404).json({ message: 'Material não encontrado' });
      }
      
      res.json(updatedMaterial);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete('/api/materials/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const result = await storage.deleteMaterial(id);
      if (!result) {
        return res.status(404).json({ message: 'Material não encontrado' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      res.status(500).json({ message: 'Erro ao excluir material' });
    }
  });

  app.patch('/api/materials/:id/stock', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const { quantity } = req.body;
      if (quantity === undefined || isNaN(quantity)) {
        return res.status(400).json({ message: 'Quantidade inválida' });
      }
      
      const updatedMaterial = await storage.updateMaterialStock(id, quantity);
      if (!updatedMaterial) {
        return res.status(404).json({ message: 'Material não encontrado' });
      }
      
      res.json(updatedMaterial);
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      res.status(500).json({ message: 'Erro ao atualizar estoque' });
    }
  });

  app.get('/api/materials/low-stock', async (req, res) => {
    try {
      const materials = await storage.getLowStockMaterials();
      res.json(materials);
    } catch (error) {
      console.error('Erro ao buscar materiais com baixo estoque:', error);
      res.status(500).json({ message: 'Erro ao buscar materiais com baixo estoque' });
    }
  });

  // API: Materiais por tipo de procedimento
  app.get('/api/procedure-materials/:procedureType', async (req, res) => {
    try {
      const { procedureType } = req.params;
      const procedureMaterials = await storage.getProcedureMaterials(procedureType);
      res.json(procedureMaterials);
    } catch (error) {
      console.error('Erro ao buscar materiais do procedimento:', error);
      res.status(500).json({ message: 'Erro ao buscar materiais do procedimento' });
    }
  });

  app.post('/api/procedure-materials', async (req, res) => {
    try {
      const procedureMaterialData = insertProcedureMaterialSchema.parse(req.body);
      const procedureMaterial = await storage.addMaterialToProcedureType(procedureMaterialData);
      res.status(201).json(procedureMaterial);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch('/api/procedure-materials/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const procedureMaterialData = insertProcedureMaterialSchema.partial().parse(req.body);
      const updatedProcedureMaterial = await storage.updateProcedureMaterial(id, procedureMaterialData);
      
      if (!updatedProcedureMaterial) {
        return res.status(404).json({ message: 'Relação material-procedimento não encontrada' });
      }
      
      res.json(updatedProcedureMaterial);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete('/api/procedure-materials/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const result = await storage.removeMaterialFromProcedureType(id);
      if (!result) {
        return res.status(404).json({ message: 'Relação material-procedimento não encontrada' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover material do procedimento:', error);
      res.status(500).json({ message: 'Erro ao remover material do procedimento' });
    }
  });

  app.get('/api/procedure-cost/:procedureType', async (req, res) => {
    try {
      const { procedureType } = req.params;
      const costInfo = await storage.calculateProcedureCost(procedureType);
      res.json(costInfo);
    } catch (error) {
      console.error('Erro ao calcular custo do procedimento:', error);
      res.status(500).json({ message: 'Erro ao calcular custo do procedimento' });
    }
  });

  // Configurar rota anti-hibernação
  setupAntiHibernate(app);
  
  // Configurar rotas de backup do banco de dados
  setupBackupRoutes(app);

  // Criar e retornar o servidor HTTP
  const httpServer = createServer(app);
  return httpServer;
};
