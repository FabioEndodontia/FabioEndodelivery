import {
  patients, dentists, procedures, invoices, appointments, financialGoals, achievements, userAchievements,
  type Patient, type InsertPatient,
  type Dentist, type InsertDentist,
  type Procedure, type InsertProcedure,
  type Invoice, type InsertInvoice,
  type Appointment, type InsertAppointment,
  type FinancialGoal, type InsertFinancialGoal,
  type Achievement, type InsertAchievement,
  type UserAchievement
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

  // Appointment operations (Calendly integration)
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDentist(dentistId: number): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  convertAppointmentToProcedure(id: number): Promise<Procedure | undefined>;
  syncCalendlyEvents(accessToken: string): Promise<{ created: number; updated: number; errors: number }>;
  
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
  getUpcomingAppointments(limit: number): Promise<Appointment[]>;
  
  // Gamification - Financial Goals
  getFinancialGoals(): Promise<FinancialGoal[]>;
  getFinancialGoal(id: number): Promise<FinancialGoal | undefined>;
  createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: number, goal: Partial<InsertFinancialGoal>): Promise<FinancialGoal | undefined>;
  updateGoalProgress(id: number, newValue: number): Promise<FinancialGoal | undefined>;
  deleteFinancialGoal(id: number): Promise<boolean>;
  getActiveGoals(): Promise<FinancialGoal[]>;
  checkGoalsProgress(): Promise<{ updatedGoals: number, completedGoals: number }>;
  
  // Gamification - Achievements
  getAchievements(): Promise<Achievement[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, achievement: Partial<InsertAchievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: number): Promise<boolean>;
  getUserAchievements(): Promise<(Achievement & { earnedDate: Date })[]>;
  awardAchievement(achievementId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private patients: Map<number, Patient>;
  private dentists: Map<number, Dentist>;
  private procedures: Map<number, Procedure>;
  private invoices: Map<number, Invoice>;
  private appointments: Map<number, Appointment>;
  private financialGoals: Map<number, FinancialGoal>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  
  private patientId: number;
  private dentistId: number;
  private procedureId: number;
  private invoiceId: number;
  private appointmentId: number;
  private financialGoalId: number;
  private achievementId: number;
  private userAchievementId: number;

  constructor() {
    this.patients = new Map();
    this.dentists = new Map();
    this.procedures = new Map();
    this.invoices = new Map();
    this.appointments = new Map();
    this.financialGoals = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    
    this.patientId = 1;
    this.dentistId = 1;
    this.procedureId = 1;
    this.invoiceId = 1;
    this.appointmentId = 1;
    this.financialGoalId = 1;
    this.achievementId = 1;
    this.userAchievementId = 1;

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

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.patientId === patientId);
  }

  async getAppointmentsByDentist(dentistId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.dentistId === dentistId);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentId++;
    const now = new Date();
    
    const appointment: Appointment = {
      ...appointmentData,
      id,
      createdAt: now,
      convertedToProcedure: false,
      procedureId: null
    };
    
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment: Appointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  async convertAppointmentToProcedure(id: number): Promise<Procedure | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment || appointment.convertedToProcedure) return undefined;
    
    // Create a new procedure from the appointment data
    const procedureData: InsertProcedure = {
      patientId: appointment.patientId || 0,
      dentistId: appointment.dentistId || 0,
      toothNumber: appointment.toothNumber || 0,
      procedureType: appointment.procedureType || "TREATMENT",
      procedureDate: new Date(appointment.appointmentDate),
      value: 0, // Default value, needs to be updated later
      paymentMethod: "PENDING",
      paymentStatus: "PENDING"
    };
    
    const procedure = await this.createProcedure(procedureData);
    
    // Update the appointment as converted
    const updatedAppointment: Appointment = {
      ...appointment,
      convertedToProcedure: true,
      procedureId: procedure.id
    };
    
    this.appointments.set(id, updatedAppointment);
    
    return procedure;
  }

  async syncCalendlyEvents(accessToken: string): Promise<{ created: number; updated: number; errors: number }> {
    // In a real implementation, this would make API calls to Calendly
    // For now, we'll return a mock response
    return {
      created: 0,
      updated: 0,
      errors: 0
    };
  }

  async getUpcomingAppointments(limit: number): Promise<Appointment[]> {
    const now = new Date();
    return Array.from(this.appointments.values())
      .filter(appointment => new Date(appointment.appointmentDate) >= now && !appointment.convertedToProcedure)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
      .slice(0, limit);
  }

  // Gamification - Financial Goals operations
  async getFinancialGoals(): Promise<FinancialGoal[]> {
    return Array.from(this.financialGoals.values());
  }

  async getFinancialGoal(id: number): Promise<FinancialGoal | undefined> {
    return this.financialGoals.get(id);
  }

  async createFinancialGoal(goalData: InsertFinancialGoal): Promise<FinancialGoal> {
    const id = this.financialGoalId++;
    const now = new Date();
    const goal: FinancialGoal = {
      ...goalData,
      id,
      createdAt: now,
      currentValue: 0,
      isCompleted: false,
      isActive: true
    };
    this.financialGoals.set(id, goal);
    return goal;
  }

  async updateFinancialGoal(id: number, goalData: Partial<InsertFinancialGoal>): Promise<FinancialGoal | undefined> {
    const goal = this.financialGoals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal: FinancialGoal = { ...goal, ...goalData };
    this.financialGoals.set(id, updatedGoal);
    return updatedGoal;
  }

  async updateGoalProgress(id: number, newValue: number): Promise<FinancialGoal | undefined> {
    const goal = this.financialGoals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal: FinancialGoal = { 
      ...goal, 
      currentValue: goal.currentValue + newValue,
      isCompleted: (goal.currentValue + newValue) >= goal.targetValue
    };
    this.financialGoals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteFinancialGoal(id: number): Promise<boolean> {
    return this.financialGoals.delete(id);
  }

  async getActiveGoals(): Promise<FinancialGoal[]> {
    const now = new Date();
    return Array.from(this.financialGoals.values())
      .filter(goal => 
        goal.isActive && 
        !goal.isCompleted && 
        new Date(goal.startDate) <= now && 
        new Date(goal.endDate) >= now
      );
  }

  async checkGoalsProgress(): Promise<{ updatedGoals: number, completedGoals: number }> {
    const activeGoals = await this.getActiveGoals();
    let updatedCount = 0;
    let completedCount = 0;

    // For revenue goals, calculate total revenue in the period
    for (const goal of activeGoals) {
      if (goal.goalType === 'REVENUE') {
        const procedures = Array.from(this.procedures.values())
          .filter(p => 
            new Date(p.procedureDate) >= new Date(goal.startDate) && 
            new Date(p.procedureDate) <= new Date(goal.endDate) &&
            p.paymentStatus === 'PAID' &&
            (goal.dentistId ? p.dentistId === goal.dentistId : true) &&
            (goal.procedureType ? p.procedureType === goal.procedureType : true)
          );
        
        const totalRevenue = procedures.reduce((sum, p) => sum + p.value, 0);
        if (totalRevenue > goal.currentValue) {
          goal.currentValue = totalRevenue;
          if (totalRevenue >= goal.targetValue && !goal.isCompleted) {
            goal.isCompleted = true;
            completedCount++;
          }
          this.financialGoals.set(goal.id, goal);
          updatedCount++;
        }
      } else if (goal.goalType === 'PROCEDURE_COUNT') {
        const procedures = Array.from(this.procedures.values())
          .filter(p => 
            new Date(p.procedureDate) >= new Date(goal.startDate) && 
            new Date(p.procedureDate) <= new Date(goal.endDate) &&
            (goal.dentistId ? p.dentistId === goal.dentistId : true) &&
            (goal.procedureType ? p.procedureType === goal.procedureType : true)
          );
        
        if (procedures.length > goal.currentValue) {
          goal.currentValue = procedures.length;
          if (procedures.length >= goal.targetValue && !goal.isCompleted) {
            goal.isCompleted = true;
            completedCount++;
          }
          this.financialGoals.set(goal.id, goal);
          updatedCount++;
        }
      } else if (goal.goalType === 'NEW_PATIENTS') {
        const patients = Array.from(this.patients.values())
          .filter(p => 
            new Date(p.createdAt) >= new Date(goal.startDate) && 
            new Date(p.createdAt) <= new Date(goal.endDate)
          );
        
        if (patients.length > goal.currentValue) {
          goal.currentValue = patients.length;
          if (patients.length >= goal.targetValue && !goal.isCompleted) {
            goal.isCompleted = true;
            completedCount++;
          }
          this.financialGoals.set(goal.id, goal);
          updatedCount++;
        }
      }
    }

    return { updatedGoals: updatedCount, completedGoals: completedCount };
  }

  // Gamification - Achievements operations
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    return this.achievements.get(id);
  }

  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const id = this.achievementId++;
    const now = new Date();
    const achievement: Achievement = { ...achievementData, id, createdAt: now };
    this.achievements.set(id, achievement);
    return achievement;
  }

  async updateAchievement(id: number, achievementData: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const achievement = this.achievements.get(id);
    if (!achievement) return undefined;
    
    const updatedAchievement: Achievement = { ...achievement, ...achievementData };
    this.achievements.set(id, updatedAchievement);
    return updatedAchievement;
  }

  async deleteAchievement(id: number): Promise<boolean> {
    return this.achievements.delete(id);
  }

  async getUserAchievements(): Promise<(Achievement & { earnedDate: Date })[]> {
    const userAchievements = Array.from(this.userAchievements.values());
    return userAchievements.map(ua => {
      const achievement = this.achievements.get(ua.achievementId);
      if (!achievement) {
        throw new Error(`Achievement ${ua.achievementId} not found`);
      }
      return {
        ...achievement,
        earnedDate: ua.earnedDate
      };
    });
  }

  async awardAchievement(achievementId: number): Promise<boolean> {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return false;
    
    // Check if the user already has this achievement
    const hasAchievement = Array.from(this.userAchievements.values())
      .some(ua => ua.achievementId === achievementId);
    
    if (hasAchievement) return false;
    
    const id = this.userAchievementId++;
    const now = new Date();
    const userAchievement: UserAchievement = {
      id,
      achievementId,
      earnedDate: now,
      createdAt: now
    };
    
    this.userAchievements.set(id, userAchievement);
    return true;
  }
}

// Using the database storage implementation
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
