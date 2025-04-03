import {
  integer,
  sqliteTable,
  text,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
} from "drizzle-zod";
import { type z } from "zod";

/**
 * PACIENTES
 */
export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  birthdate: text("birthdate"), // SQLite não tem tipo date nativo
  address: text("address"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

/**
 * DENTISTAS / CLÍNICAS
 */
export const dentists = sqliteTable("dentists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  clinic: text("clinic"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  paymentDetails: text("payment_details"),
  commissionRate: real("commission_rate").default(0), // Percentual de comissão
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertDentistSchema = createInsertSchema(dentists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDentist = z.infer<typeof insertDentistSchema>;
export type Dentist = typeof dentists.$inferSelect;

/**
 * PROCEDIMENTOS
 */
export const procedures = sqliteTable("procedures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  dentistId: integer("dentist_id").notNull().references(() => dentists.id),
  procedureDate: text("procedure_date").notNull().default(new Date().toISOString()),
  toothNumber: text("tooth_number"),
  procedureType: text("procedure_type").notNull(), // "treatment", "retreatment", "other"
  procedureDetails: text("procedure_details"),
  diagnosis: text("diagnosis"),
  prognosis: text("prognosis"),
  canalMeasurements: text("canal_measurements"),
  imageUrls: text("image_urls"),
  observations: text("observations"),
  complexity: text("complexity"), // "low", "medium", "high", "very-high"
  value: real("value").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending", "partial", "paid"
  paymentSource: text("payment_source").notNull().default("direct"), // "direct", "dentist"
  invoiceStatus: text("invoice_status").notNull().default("pending"), // "pending", "issued", "paid"
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertProcedureSchema = createInsertSchema(procedures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type Procedure = typeof procedures.$inferSelect;

/**
 * FATURAS
 */
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  procedureId: integer("procedure_id").notNull().references(() => procedures.id),
  invoiceNumber: text("invoice_number"),
  invoiceDate: text("invoice_date").notNull().default(new Date().toISOString()),
  amount: real("amount").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // "pending", "paid"
  paymentMethod: text("payment_method"),
  paidAt: text("paid_at"),
  paidAmount: real("paid_amount"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

/**
 * AGENDAMENTOS
 */
export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  dentistId: integer("dentist_id").notNull().references(() => dentists.id),
  appointmentDate: text("appointment_date").notNull(),
  duration: integer("duration").notNull().default(60), // Duração em minutos
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed", "cancelled", "no-show"
  convertedToProcedure: integer("converted_to_procedure").notNull().default(0), // 0 = false, 1 = true
  notes: text("notes"),
  toothNumber: text("tooth_number"),
  procedureType: text("procedure_type"),
  complexity: text("complexity"),
  healthIssues: text("health_issues"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
  // Campos para integração com Calendly
  calendlyEventId: text("calendly_event_id"),
  calendlyInviteeId: text("calendly_invitee_id"),
  calendlyEventUrl: text("calendly_event_url"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

/**
 * METAS FINANCEIRAS
 */
export const financialGoals = sqliteTable("financial_goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  startDate: text("start_date").notNull().default(new Date().toISOString()),
  endDate: text("end_date").notNull(),
  isCompleted: integer("is_completed").notNull().default(0), // 0 = false, 1 = true
  category: text("category").default("income"), // "income", "savings", "expense"
  icon: text("icon").default("target"),
  color: text("color").default("#4CAF50"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertFinancialGoalSchema = createInsertSchema(financialGoals).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
});

export type InsertFinancialGoal = z.infer<typeof insertFinancialGoalSchema>;
export type FinancialGoal = typeof financialGoals.$inferSelect;

/**
 * CONQUISTAS
 */
export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("award"),
  category: text("category").default("financial"), // "financial", "clinical", "educational"
  condition: text("condition"), // Condição para desbloquear (JSON ou descrição)
  points: integer("points").default(10),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

/**
 * CONQUISTAS DO USUÁRIO
 */
export const userAchievements = sqliteTable("user_achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  earnedAt: text("earned_at").notNull().default(new Date().toISOString()),
});

/**
 * MATERIAIS
 */
export const materials = sqliteTable("materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").default("consumable"), // "consumable", "instrument", "equipment"
  unit: text("unit").default("unit"), // "unit", "box", "pack", etc.
  price: real("price").notNull().default(0),
  quantity: real("quantity").notNull().default(0),
  reorderLevel: real("reorder_level").default(5),
  supplier: text("supplier"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

/**
 * MATERIAIS POR TIPO DE PROCEDIMENTO
 */
export const procedureMaterials = sqliteTable("procedure_materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  procedureType: text("procedure_type").notNull(), // "treatment", "retreatment", específico como "molar-treatment"
  materialId: integer("material_id").notNull().references(() => materials.id),
  quantity: real("quantity").notNull().default(1),
  isOptional: integer("is_optional").notNull().default(0), // 0 = false, 1 = true
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertProcedureMaterialSchema = createInsertSchema(procedureMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProcedureMaterial = z.infer<typeof insertProcedureMaterialSchema>;
export type ProcedureMaterial = typeof procedureMaterials.$inferSelect;

// Exporta o schema completo para uso com o drizzle
export const schema = {
  patients,
  dentists,
  procedures,
  invoices,
  appointments,
  financialGoals,
  achievements,
  userAchievements,
  materials,
  procedureMaterials,
};