import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { 
  insertPatientSchema, 
  insertDentistSchema, 
  insertProcedureSchema, 
  insertInvoiceSchema 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { DatabaseStorage } from "./database-storage";

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

  const httpServer = createServer(app);
  return httpServer;
}
