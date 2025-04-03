import {
  patients, dentists, procedures, invoices,
  type Patient, type InsertPatient,
  type Dentist, type InsertDentist,
  type Procedure, type InsertProcedure,
  type Invoice, type InsertInvoice
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, gte, desc, and, notInArray, inArray, sql } from "drizzle-orm";

// PostgreSQL storage implementation
export class DatabaseStorage implements IStorage {
  // Patient operations
  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async createPatient(patientData: InsertPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(patientData).returning();
    return patient;
  }

  async updatePatient(id: number, patientData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [updatedPatient] = await db
      .update(patients)
      .set(patientData)
      .where(eq(patients.id, id))
      .returning();
    
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    const [deletedPatient] = await db
      .delete(patients)
      .where(eq(patients.id, id))
      .returning();
    
    return !!deletedPatient;
  }

  // Dentist operations
  async getDentists(): Promise<Dentist[]> {
    return await db.select().from(dentists);
  }

  async getDentist(id: number): Promise<Dentist | undefined> {
    const [dentist] = await db.select().from(dentists).where(eq(dentists.id, id));
    return dentist;
  }

  async createDentist(dentistData: InsertDentist): Promise<Dentist> {
    const [dentist] = await db
      .insert(dentists)
      .values({ ...dentistData, isActive: true })
      .returning();
    
    return dentist;
  }

  async updateDentist(id: number, dentistData: Partial<InsertDentist>): Promise<Dentist | undefined> {
    const [updatedDentist] = await db
      .update(dentists)
      .set(dentistData)
      .where(eq(dentists.id, id))
      .returning();
    
    return updatedDentist;
  }

  async deleteDentist(id: number): Promise<boolean> {
    const [deletedDentist] = await db
      .delete(dentists)
      .where(eq(dentists.id, id))
      .returning();
    
    return !!deletedDentist;
  }

  // Procedure operations
  async getProcedures(): Promise<Procedure[]> {
    return await db.select().from(procedures);
  }

  async getProceduresByPatient(patientId: number): Promise<Procedure[]> {
    return await db
      .select()
      .from(procedures)
      .where(eq(procedures.patientId, patientId));
  }

  async getProceduresByDentist(dentistId: number): Promise<Procedure[]> {
    return await db
      .select()
      .from(procedures)
      .where(eq(procedures.dentistId, dentistId));
  }

  async getProcedure(id: number): Promise<Procedure | undefined> {
    const [procedure] = await db
      .select()
      .from(procedures)
      .where(eq(procedures.id, id));
    
    return procedure;
  }

  async createProcedure(procedureData: InsertProcedure): Promise<Procedure> {
    // Passamos os dados diretamente, pois o zod já fez a conversão para o tipo Date
    const [procedure] = await db
      .insert(procedures)
      .values(procedureData)
      .returning();
    
    return procedure;
  }

  async updateProcedure(id: number, procedureData: Partial<InsertProcedure>): Promise<Procedure | undefined> {
    const [updatedProcedure] = await db
      .update(procedures)
      .set(procedureData)
      .where(eq(procedures.id, id))
      .returning();
    
    return updatedProcedure;
  }

  async deleteProcedure(id: number): Promise<boolean> {
    const [deletedProcedure] = await db
      .delete(procedures)
      .where(eq(procedures.id, id))
      .returning();
    
    return !!deletedProcedure;
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoicesByProcedure(procedureId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.procedureId, procedureId));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    
    return invoice;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    // Passamos os dados diretamente, pois o zod já fez a conversão para o tipo Date
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoiceData)
      .where(eq(invoices.id, id))
      .returning();
    
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const [deletedInvoice] = await db
      .delete(invoices)
      .where(eq(invoices.id, id))
      .returning();
    
    return !!deletedInvoice;
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
    // Get all procedures for total counts and revenue
    const allProcedures = await db.select().from(procedures);
    
    // Get first day of current month for monthly calculations
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filter for monthly procedures
    const monthlyProcedures = allProcedures.filter(
      p => new Date(p.procedureDate) >= firstDayOfMonth
    );
    
    // Calculate total and monthly revenue
    const totalRevenue = allProcedures.reduce((sum, p) => sum + Number(p.value), 0);
    const monthlyRevenue = monthlyProcedures.reduce((sum, p) => sum + Number(p.value), 0);
    
    // Count active dentists
    const allDentists = await db.select().from(dentists).where(eq(dentists.isActive, true));
    const activeDentists = allDentists.length;
    
    // Count pending payments
    const pendingPayments = allProcedures.filter(p => p.paymentStatus === "PENDING").length;
    
    return {
      totalProcedures: allProcedures.length,
      monthlyProcedures: monthlyProcedures.length,
      totalRevenue,
      monthlyRevenue,
      activeDentists,
      pendingPayments
    };
  }

  async getRecentProcedures(limit: number): Promise<Procedure[]> {
    return await db
      .select()
      .from(procedures)
      .orderBy(desc(procedures.procedureDate))
      .limit(limit);
  }

  async getPendingPayments(): Promise<Procedure[]> {
    return await db
      .select()
      .from(procedures)
      .where(eq(procedures.paymentStatus, "PENDING"))
      .orderBy(desc(procedures.procedureDate));
  }

  async getPendingInvoices(): Promise<Procedure[]> {
    // Get all procedure IDs that have invoices
    const invoiceRecords = await db.select().from(invoices);
    const procedureIdsWithInvoices = invoiceRecords.map(inv => inv.procedureId);
    
    // Return all paid procedures that don't have invoices yet
    if (procedureIdsWithInvoices.length === 0) {
      return await db
        .select()
        .from(procedures)
        .where(eq(procedures.paymentStatus, "PAID"))
        .orderBy(desc(procedures.procedureDate));
    } else {
      return await db
        .select()
        .from(procedures)
        .where(
          and(
            eq(procedures.paymentStatus, "PAID"),
            notInArray(procedures.id, procedureIdsWithInvoices)
          )
        )
        .orderBy(desc(procedures.procedureDate));
    }
  }

  // Seed initial data (for demo purposes)
  async seedInitialData() {
    // Check if we already have data
    const existingDentists = await db.select().from(dentists);
    if (existingDentists.length > 0) {
      return; // Already seeded
    }

    // Sample dentists
    const dentistData = [
      {
        name: "Dra. Amanda Oliveira",
        clinic: "Clínica Oral",
        phone: "11987654321",
        email: "amanda@clinicaoral.com.br",
        isActive: true,
      },
      {
        name: "Dr. Carlos Mendes",
        clinic: "Odonto Smile",
        phone: "11976543210",
        email: "carlos@odontosmile.com.br",
        isActive: true,
      },
      {
        name: "Clínica Sorridentes",
        clinic: "Sorridentes",
        phone: "11965432109",
        email: "contato@sorridentes.com.br",
        isActive: true,
      },
    ];

    const insertedDentists = await db.insert(dentists).values(dentistData).returning();

    // Sample patients
    const patientData = [
      {
        name: "João Silva",
        dentistId: insertedDentists[0].id,
      },
      {
        name: "Maria Souza",
        dentistId: insertedDentists[1].id,
      },
      {
        name: "Antônio Pereira",
        dentistId: insertedDentists[2].id,
      },
    ];

    await db.insert(patients).values(patientData).returning();
  }
}