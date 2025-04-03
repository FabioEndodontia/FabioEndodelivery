import { pgTable, text, serial, integer, boolean, date, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Patients table
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dentistId: integer("dentist_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dentists/Clinics table
export const dentists = pgTable("dentists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clinic: text("clinic"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment methods enum
export const PAYMENT_METHODS = [
  "PIX",
  "BANK_TRANSFER",
  "CASH",
  "CHECK",
  "PENDING"
] as const;

// Payment status enum
export const PAYMENT_STATUS = [
  "PAID",
  "PENDING"
] as const;

// Procedure types enum
export const PROCEDURE_TYPES = [
  "TREATMENT",
  "RETREATMENT",
  "INSTRUMENT_REMOVAL",
  "OTHER"
] as const;

// Procedures table
export const procedures = pgTable("procedures", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  dentistId: integer("dentist_id").notNull(),
  toothNumber: integer("tooth_number").notNull(),
  procedureType: text("procedure_type").notNull(),
  value: doublePrecision("value").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull(),
  paymentDate: date("payment_date"),
  procedureDate: date("procedure_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  procedureId: integer("procedure_id").notNull(),
  invoiceNumber: text("invoice_number"),
  invoiceValue: doublePrecision("invoice_value").notNull(),
  invoiceDate: date("invoice_date"),
  isIssued: boolean("is_issued").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema validation for patient creation
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

// Schema validation for dentist creation
export const insertDentistSchema = createInsertSchema(dentists).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

// Schema validation for procedure creation
export const insertProcedureSchema = createInsertSchema(procedures)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    procedureType: z.enum(PROCEDURE_TYPES),
    paymentMethod: z.enum(PAYMENT_METHODS),
    paymentStatus: z.enum(PAYMENT_STATUS),
    procedureDate: z.coerce.date(),
    paymentDate: z.coerce.date().optional(),
  });

// Schema validation for invoice creation
export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    invoiceDate: z.coerce.date().optional(),
  });

// Types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Dentist = typeof dentists.$inferSelect;
export type InsertDentist = z.infer<typeof insertDentistSchema>;

export type Procedure = typeof procedures.$inferSelect;
export type InsertProcedure = z.infer<typeof insertProcedureSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type PaymentStatus = typeof PAYMENT_STATUS[number];
export type ProcedureType = typeof PROCEDURE_TYPES[number];
