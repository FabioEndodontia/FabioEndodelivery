import {
  patients, dentists, procedures, invoices,
  type Patient, type InsertPatient,
  type Dentist, type InsertDentist,
  type Procedure, type InsertProcedure,
  type Invoice, type InsertInvoice
} from "@shared/schema";

// Storage interface for all CRUD operations
export interface IStorage {
  // Patient operations
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;

  // Dentist operations
  getDentists(): Promise<Dentist[]>;
  getDentist(id: number): Promise<Dentist | undefined>;
  createDentist(dentist: InsertDentist): Promise<Dentist>;
  updateDentist(id: number, dentist: Partial<InsertDentist>): Promise<Dentist | undefined>;
  deleteDentist(id: number): Promise<boolean>;

  // Procedure operations
  getProcedures(): Promise<Procedure[]>;
  getProceduresByPatient(patientId: number): Promise<Procedure[]>;
  getProceduresByDentist(dentistId: number): Promise<Procedure[]>;
  getProcedure(id: number): Promise<Procedure | undefined>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  updateProcedure(id: number, procedure: Partial<InsertProcedure>): Promise<Procedure | undefined>;
  deleteProcedure(id: number): Promise<boolean>;

  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByProcedure(procedureId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;

  // Dashboard data operations
  getProcedureStats(): Promise<{
    totalProcedures: number;
    monthlyProcedures: number;
    totalRevenue: number;
    monthlyRevenue: number;
    activeDentists: number;
    pendingPayments: number;
  }>;
  getRecentProcedures(limit: number): Promise<Procedure[]>;
  getPendingPayments(): Promise<Procedure[]>;
  getPendingInvoices(): Promise<Procedure[]>;
}

export class MemStorage implements IStorage {
  private patients: Map<number, Patient>;
  private dentists: Map<number, Dentist>;
  private procedures: Map<number, Procedure>;
  private invoices: Map<number, Invoice>;
  
  private patientId: number;
  private dentistId: number;
  private procedureId: number;
  private invoiceId: number;

  constructor() {
    this.patients = new Map();
    this.dentists = new Map();
    this.procedures = new Map();
    this.invoices = new Map();
    
    this.patientId = 1;
    this.dentistId = 1;
    this.procedureId = 1;
    this.invoiceId = 1;

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add 3 sample dentists
    const dentists = [
      { name: "Dra. Amanda Oliveira", clinic: "Clínica Oral", phone: "11987654321", email: "amanda@clinicaoral.com.br" },
      { name: "Dr. Carlos Mendes", clinic: "Odonto Smile", phone: "11976543210", email: "carlos@odontosmile.com.br" },
      { name: "Clínica Sorridentes", clinic: "Sorridentes", phone: "11965432109", email: "contato@sorridentes.com.br" },
    ];
    
    dentists.forEach(dentist => this.createDentist(dentist));
    
    // Add 3 sample patients
    const patients = [
      { name: "João Silva", phone: "11998765432", email: "joao.silva@email.com" },
      { name: "Maria Souza", phone: "11987654321", email: "maria.souza@email.com" },
      { name: "Antônio Pereira", phone: "11976543210", email: "antonio.pereira@email.com" },
    ];
    
    patients.forEach(patient => this.createPatient(patient));
  }

  // Patient operations
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(patientData: InsertPatient): Promise<Patient> {
    const id = this.patientId++;
    const now = new Date();
    const patient: Patient = { ...patientData, id, createdAt: now };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, patientData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient: Patient = { ...patient, ...patientData };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }

  // Dentist operations
  async getDentists(): Promise<Dentist[]> {
    return Array.from(this.dentists.values());
  }

  async getDentist(id: number): Promise<Dentist | undefined> {
    return this.dentists.get(id);
  }

  async createDentist(dentistData: InsertDentist): Promise<Dentist> {
    const id = this.dentistId++;
    const now = new Date();
    const dentist: Dentist = { ...dentistData, id, isActive: true, createdAt: now };
    this.dentists.set(id, dentist);
    return dentist;
  }

  async updateDentist(id: number, dentistData: Partial<InsertDentist>): Promise<Dentist | undefined> {
    const dentist = this.dentists.get(id);
    if (!dentist) return undefined;
    
    const updatedDentist: Dentist = { ...dentist, ...dentistData };
    this.dentists.set(id, updatedDentist);
    return updatedDentist;
  }

  async deleteDentist(id: number): Promise<boolean> {
    return this.dentists.delete(id);
  }

  // Procedure operations
  async getProcedures(): Promise<Procedure[]> {
    return Array.from(this.procedures.values());
  }

  async getProceduresByPatient(patientId: number): Promise<Procedure[]> {
    return Array.from(this.procedures.values()).filter(procedure => procedure.patientId === patientId);
  }

  async getProceduresByDentist(dentistId: number): Promise<Procedure[]> {
    return Array.from(this.procedures.values()).filter(procedure => procedure.dentistId === dentistId);
  }

  async getProcedure(id: number): Promise<Procedure | undefined> {
    return this.procedures.get(id);
  }

  async createProcedure(procedureData: InsertProcedure): Promise<Procedure> {
    const id = this.procedureId++;
    const now = new Date();
    const procedure: Procedure = { ...procedureData, id, createdAt: now };
    this.procedures.set(id, procedure);
    return procedure;
  }

  async updateProcedure(id: number, procedureData: Partial<InsertProcedure>): Promise<Procedure | undefined> {
    const procedure = this.procedures.get(id);
    if (!procedure) return undefined;
    
    const updatedProcedure: Procedure = { ...procedure, ...procedureData };
    this.procedures.set(id, updatedProcedure);
    return updatedProcedure;
  }

  async deleteProcedure(id: number): Promise<boolean> {
    return this.procedures.delete(id);
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoicesByProcedure(procedureId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.procedureId === procedureId);
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceId++;
    const now = new Date();
    const invoice: Invoice = { ...invoiceData, id, createdAt: now };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice: Invoice = { ...invoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Dashboard data operations
  async getProcedureStats(): Promise<{
    totalProcedures: number;
    monthlyProcedures: number;
    totalRevenue: number;
    monthlyRevenue: number;
    activeDentists: number;
    pendingPayments: number;
  }> {
    const procedures = Array.from(this.procedures.values());
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyProcedures = procedures.filter(
      p => new Date(p.procedureDate) >= firstDayOfMonth
    ).length;
    
    const totalRevenue = procedures.reduce((sum, p) => sum + p.value, 0);
    
    const monthlyRevenue = procedures
      .filter(p => new Date(p.procedureDate) >= firstDayOfMonth)
      .reduce((sum, p) => sum + p.value, 0);
    
    const activeDentists = Array.from(this.dentists.values()).filter(d => d.isActive).length;
    
    const pendingPayments = procedures
      .filter(p => p.paymentStatus === 'PENDING')
      .reduce((sum, p) => sum + p.value, 0);
    
    return {
      totalProcedures: procedures.length,
      monthlyProcedures,
      totalRevenue,
      monthlyRevenue,
      activeDentists,
      pendingPayments
    };
  }

  async getRecentProcedures(limit: number): Promise<Procedure[]> {
    return Array.from(this.procedures.values())
      .sort((a, b) => new Date(b.procedureDate).getTime() - new Date(a.procedureDate).getTime())
      .slice(0, limit);
  }

  async getPendingPayments(): Promise<Procedure[]> {
    return Array.from(this.procedures.values())
      .filter(p => p.paymentStatus === 'PENDING')
      .sort((a, b) => new Date(b.procedureDate).getTime() - new Date(a.procedureDate).getTime());
  }

  async getPendingInvoices(): Promise<Procedure[]> {
    const proceduresWithInvoices = new Set(
      Array.from(this.invoices.values()).map(invoice => invoice.procedureId)
    );
    
    return Array.from(this.procedures.values())
      .filter(p => p.paymentStatus === 'PAID' && !proceduresWithInvoices.has(p.id))
      .sort((a, b) => new Date(b.procedureDate).getTime() - new Date(a.procedureDate).getTime());
  }
}

// Using the database storage implementation
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
