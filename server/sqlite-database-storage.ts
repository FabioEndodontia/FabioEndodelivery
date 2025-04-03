import {
  patients, dentists, procedures, invoices, appointments, financialGoals, achievements, userAchievements,
  materials, procedureMaterials, procedureTypeValues,
  type Patient, type InsertPatient,
  type Dentist, type InsertDentist,
  type Procedure, type InsertProcedure,
  type Invoice, type InsertInvoice,
  type Appointment, type InsertAppointment,
  type FinancialGoal, type InsertFinancialGoal,
  type Achievement, type InsertAchievement,
  type UserAchievement,
  type Material, type InsertMaterial,
  type ProcedureMaterial, type InsertProcedureMaterial
} from "@shared/schema-sqlite";
import { IStorage } from "./storage";
import { db } from "./db-sqlite";
import { eq, gte, desc, and, sql, not, inArray } from "drizzle-orm";

// SQLite storage implementation
export class SQLiteDatabaseStorage implements IStorage {
  // Patient operations
  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createPatient(patientData: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients).values(patientData).returning();
    return result[0];
  }

  async updatePatient(id: number, patientData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const result = await db
      .update(patients)
      .set(patientData)
      .where(eq(patients.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deletePatient(id: number): Promise<boolean> {
    const result = await db
      .delete(patients)
      .where(eq(patients.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Dentist operations
  async getDentists(): Promise<Dentist[]> {
    return await db.select().from(dentists);
  }

  async getDentist(id: number): Promise<Dentist | undefined> {
    const result = await db.select().from(dentists).where(eq(dentists.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createDentist(dentistData: InsertDentist): Promise<Dentist> {
    const result = await db
      .insert(dentists)
      .values(dentistData)
      .returning();
    
    return result[0];
  }

  async updateDentist(id: number, dentistData: Partial<InsertDentist>): Promise<Dentist | undefined> {
    const result = await db
      .update(dentists)
      .set(dentistData)
      .where(eq(dentists.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteDentist(id: number): Promise<boolean> {
    const result = await db
      .delete(dentists)
      .where(eq(dentists.id, id))
      .returning();
    
    return result.length > 0;
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
    const result = await db
      .select()
      .from(procedures)
      .where(eq(procedures.id, id));
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createProcedure(procedureData: InsertProcedure): Promise<Procedure> {
    const result = await db
      .insert(procedures)
      .values(procedureData)
      .returning();
    
    return result[0];
  }

  async updateProcedure(id: number, procedureData: Partial<InsertProcedure>): Promise<Procedure | undefined> {
    const result = await db
      .update(procedures)
      .set(procedureData)
      .where(eq(procedures.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteProcedure(id: number): Promise<boolean> {
    const result = await db
      .delete(procedures)
      .where(eq(procedures.id, id))
      .returning();
    
    return result.length > 0;
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
    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const result = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    
    return result[0];
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db
      .update(invoices)
      .set(invoiceData)
      .where(eq(invoices.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db
      .delete(invoices)
      .where(eq(invoices.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Dashboard data operations
  async getProcedureStats(): Promise<{
    totalProcedures: number;
    monthlyProcedures: number;
    totalRevenue: number;
    monthlyRevenue: number;
    activeDentists: number;
    pendingPayments: number;
    pendingPaymentsValue: number;
    proceduresByType: { type: string; count: number; percentage: number }[];
    proceduresByComplexity: { complexity: string; count: number; percentage: number }[];
    dentistPerformance: { dentistId: number; dentistName: string; procedureCount: number; revenue: number }[];
    revenueByMonth: { month: string; revenue: number }[];
    totalTreatments: number;
    totalRetreatments: number;
    averageValue: number;
    monthlyComparison: { currentMonth: number; previousMonth: number; percentageChange: number }[];
  }> {
    // Get all procedures for total counts and revenue
    const allProcedures = await db.select().from(procedures);
    
    // Get first day of current month for monthly calculations
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get first day of previous month
    const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Filter for monthly procedures
    const monthlyProcedures = allProcedures.filter(
      p => new Date(p.procedureDate) >= firstDayOfMonth
    );
    
    // Filter for previous month procedures
    const previousMonthProcedures = allProcedures.filter(
      p => {
        const date = new Date(p.procedureDate);
        return date >= firstDayOfPreviousMonth && date <= lastDayOfPreviousMonth;
      }
    );
    
    // Calculate total and monthly revenue
    const totalRevenue = allProcedures.reduce((sum, p) => sum + Number(p.value), 0);
    const monthlyRevenue = monthlyProcedures.reduce((sum, p) => sum + Number(p.value), 0);
    const previousMonthRevenue = previousMonthProcedures.reduce((sum, p) => sum + Number(p.value), 0);
    
    // Count active dentists (no isActive field in SQLite schema, so we count all)
    const allDentists = await db.select().from(dentists);
    
    // Count pending payments and their value
    const pendingPaymentsProcedures = allProcedures.filter(p => p.paymentStatus === "pending");
    const pendingPayments = pendingPaymentsProcedures.length;
    const pendingPaymentsValue = pendingPaymentsProcedures.reduce((sum, p) => sum + Number(p.value), 0);
    
    // Calculate procedures by type
    const typeCount: Record<string, number> = {};
    allProcedures.forEach(p => {
      const type = p.procedureType || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    const proceduresByType = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: (count / allProcedures.length) * 100
    }));
    
    // Calculate procedures by complexity
    const complexityCount: Record<string, number> = {};
    allProcedures.forEach(p => {
      const complexity = p.complexity || 'unknown';
      complexityCount[complexity] = (complexityCount[complexity] || 0) + 1;
    });
    
    const proceduresByComplexity = Object.entries(complexityCount).map(([complexity, count]) => ({
      complexity,
      count,
      percentage: (count / allProcedures.length) * 100
    }));
    
    // Calculate dentist performance
    const dentistProcedures: Record<number, { count: number; revenue: number }> = {};
    allProcedures.forEach(p => {
      if (!dentistProcedures[p.dentistId]) {
        dentistProcedures[p.dentistId] = { count: 0, revenue: 0 };
      }
      dentistProcedures[p.dentistId].count += 1;
      dentistProcedures[p.dentistId].revenue += Number(p.value);
    });
    
    const dentistPerformance = await Promise.all(
      Object.entries(dentistProcedures).map(async ([dentistId, data]) => {
        const dentist = await this.getDentist(Number(dentistId));
        return {
          dentistId: Number(dentistId),
          dentistName: dentist?.name || 'Unknown',
          procedureCount: data.count,
          revenue: data.revenue
        };
      })
    );
    
    // Sort by revenue descending
    dentistPerformance.sort((a, b) => b.revenue - a.revenue);
    
    // Calculate revenue by month for the last 6 months
    const revenueByMonth: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('pt-BR', { month: 'short' });
      const monthYear = monthDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthProcs = allProcedures.filter(p => {
        const date = new Date(p.procedureDate);
        return date >= firstDay && date <= lastDay;
      });
      
      const monthRevenue = monthProcs.reduce((sum, p) => sum + Number(p.value), 0);
      revenueByMonth.push({ 
        month: monthName,
        revenue: monthRevenue 
      });
    }
    
    // Calculate treatment vs retreatment counts
    const totalTreatments = allProcedures.filter(p => p.procedureType === 'treatment').length;
    const totalRetreatments = allProcedures.filter(p => p.procedureType === 'retreatment').length;
    
    // Calculate average procedure value
    const averageValue = totalRevenue / allProcedures.length || 0;
    
    // Calculate monthly comparison data for key metrics
    const monthlyComparison = [
      {
        currentMonth: monthlyProcedures.length,
        previousMonth: previousMonthProcedures.length,
        percentageChange: previousMonthProcedures.length 
          ? ((monthlyProcedures.length - previousMonthProcedures.length) / previousMonthProcedures.length) * 100 
          : 0
      },
      {
        currentMonth: monthlyRevenue,
        previousMonth: previousMonthRevenue,
        percentageChange: previousMonthRevenue 
          ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
          : 0
      }
    ];
    
    return {
      totalProcedures: allProcedures.length,
      monthlyProcedures: monthlyProcedures.length,
      totalRevenue,
      monthlyRevenue,
      activeDentists: allDentists.length,
      pendingPayments,
      pendingPaymentsValue,
      proceduresByType,
      proceduresByComplexity,
      dentistPerformance,
      revenueByMonth,
      totalTreatments,
      totalRetreatments,
      averageValue,
      monthlyComparison
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
      .where(eq(procedures.isPaid, 0))
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
        .where(eq(procedures.isPaid, 1))
        .orderBy(desc(procedures.procedureDate));
    } else {
      return await db
        .select()
        .from(procedures)
        .where(
          and(
            eq(procedures.isPaid, 1),
            not(inArray(procedures.id, procedureIdsWithInvoices))
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
      },
      {
        name: "Dr. Carlos Mendes",
        clinic: "Odonto Smile",
        phone: "11976543210",
        email: "carlos@odontosmile.com.br",
      },
      {
        name: "Clínica Sorridentes",
        clinic: "Sorridentes",
        phone: "11965432109",
        email: "contato@sorridentes.com.br",
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

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId));
  }

  async getAppointmentsByDentist(dentistId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.dentistId, dentistId));
  }

  async getUpcomingAppointments(limit: number): Promise<Appointment[]> {
    const now = Date.now();
    return await db
      .select()
      .from(appointments)
      .where(gte(appointments.startTime, now))
      .orderBy(appointments.startTime)
      .limit(limit);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const result = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const result = await db
      .insert(appointments)
      .values(appointmentData)
      .returning();
    
    return result[0];
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const result = await db
      .update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning();
    
    return result.length > 0;
  }

  async convertAppointmentToProcedure(id: number): Promise<Procedure | undefined> {
    // Obter o agendamento
    const appointment = await this.getAppointment(id);
    if (!appointment) {
      return undefined;
    }

    // Verificar se temos os dados necessários para criar um procedimento
    if (!appointment.patientId || !appointment.dentistId || !appointment.toothNumber || !appointment.procedureType) {
      throw new Error("Appointment doesn't have all required data to create a procedure");
    }

    // Criar procedimento
    const procedureData: InsertProcedure = {
      patientId: appointment.patientId,
      dentistId: appointment.dentistId,
      toothNumber: appointment.toothNumber,
      procedureType: appointment.procedureType,
      amount: 0, // Valor padrão, deverá ser atualizado posteriormente
      isPaid: false,
      hasInvoice: false,
      diagnosis: null,
      prognosis: null,
      canalLengths: null,
      image1Path: null,
      image2Path: null,
      image3Path: null,
      observations: appointment.notes,
      procedureDate: Date.now(),
    };

    // Inserir o procedimento
    const procedure = await this.createProcedure(procedureData);

    // Atualizar o agendamento
    await this.updateAppointment(id, {
      procedureType: appointment.procedureType,
    } as any);

    return procedure;
  }

  async syncCalendlyEvents(accessToken: string): Promise<{ created: number; updated: number; errors: number }> {
    // Implementação simplificada de sincronização com Calendly
    // Na versão real, aqui deveria ser uma integração com a API do Calendly
    
    try {
      // Aqui deveria existir um código para buscar os eventos do Calendly
      // Como estamos apenas simulando, retornaremos um resultado de sucesso
      return {
        created: 0,
        updated: 0,
        errors: 0
      };
    } catch (error) {
      console.error("Error syncing with Calendly:", error);
      throw new Error("Failed to sync with Calendly");
    }
  }

  // Metas Financeiras
  async getFinancialGoals(): Promise<FinancialGoal[]> {
    return await db.select().from(financialGoals);
  }

  async getActiveGoals(): Promise<FinancialGoal[]> {
    return await db
      .select()
      .from(financialGoals)
      .where(eq(financialGoals.isActive, 1));
  }

  async getFinancialGoal(id: number): Promise<FinancialGoal | undefined> {
    const result = await db
      .select()
      .from(financialGoals)
      .where(eq(financialGoals.id, id));
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createFinancialGoal(goalData: InsertFinancialGoal): Promise<FinancialGoal> {
    const result = await db
      .insert(financialGoals)
      .values({
        ...goalData,
        currentAmount: 0,
        isActive: true,
        isCompleted: false
      })
      .returning();
    
    return result[0];
  }

  async updateFinancialGoal(id: number, goalData: Partial<InsertFinancialGoal>): Promise<FinancialGoal | undefined> {
    const result = await db
      .update(financialGoals)
      .set(goalData)
      .where(eq(financialGoals.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async updateGoalProgress(id: number, newValue: number): Promise<FinancialGoal | undefined> {
    // Buscar a meta primeiro para verificar se já está concluída
    const goal = await this.getFinancialGoal(id);
    if (!goal) return undefined;

    // Se a meta já estiver concluída, não permitir atualizações
    if (goal.isCompleted) return goal;

    // Atualizar o valor atual
    let isCompleted = false;
    if (newValue >= goal.targetAmount) {
      isCompleted = true;
    }

    const result = await db
      .update(financialGoals)
      .set({
        currentAmount: newValue,
        isCompleted: isCompleted
      })
      .where(eq(financialGoals.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteFinancialGoal(id: number): Promise<boolean> {
    const result = await db
      .delete(financialGoals)
      .where(eq(financialGoals.id, id))
      .returning();
    
    return result.length > 0;
  }

  async checkGoalsProgress(): Promise<{ updatedGoals: number; completedGoals: number }> {
    // Obter todas as metas ativas não concluídas
    const activeGoals = await db
      .select()
      .from(financialGoals)
      .where(
        and(
          eq(financialGoals.isActive, 1),
          eq(financialGoals.isCompleted, 0)
        )
      );
    
    // Aqui deveríamos verificar cada meta e atualizar seu progresso
    // Como estamos apenas simulando, retornaremos um resultado sem alterações
    return {
      updatedGoals: 0,
      completedGoals: 0
    };
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const result = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id));
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const result = await db
      .insert(achievements)
      .values(achievementData)
      .returning();
    
    return result[0];
  }

  async updateAchievement(id: number, achievementData: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const result = await db
      .update(achievements)
      .set(achievementData)
      .where(eq(achievements.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteAchievement(id: number): Promise<boolean> {
    const result = await db
      .delete(achievements)
      .where(eq(achievements.id, id))
      .returning();
    
    return result.length > 0;
  }

  async getUserAchievements(): Promise<(Achievement & { earnedDate: Date })[]> {
    // Buscar todas as conquistas do usuário
    const userAchievementsData = await db.select().from(userAchievements);
    
    // Se não houver conquistas, retornar array vazio
    if (userAchievementsData.length === 0) {
      return [];
    }
    
    // Mapear IDs das conquistas obtidas
    const achievementIds = userAchievementsData.map(ua => ua.achievementId);
    
    // Buscar detalhes das conquistas
    const achievementsData = await db
      .select()
      .from(achievements)
      .where(inArray(achievements.id, achievementIds));
    
    // Combinar dados
    return achievementsData.map(achievement => {
      const userAchievement = userAchievementsData.find(
        ua => ua.achievementId === achievement.id
      );
      
      return {
        ...achievement,
        earnedDate: new Date(userAchievement!.earnedDate)
      };
    });
  }

  async awardAchievement(achievementId: number): Promise<boolean> {
    // Verificar se a conquista existe
    const achievement = await this.getAchievement(achievementId);
    if (!achievement) {
      return false;
    }
    
    // Verificar se o usuário já tem esta conquista
    const userAchievementsData = await db.select().from(userAchievements);
    const alreadyAwarded = userAchievementsData.some(ua => ua.achievementId === achievementId);
    
    if (alreadyAwarded) {
      return false; // Já possui esta conquista
    }
    
    // Atribuir a conquista ao usuário
    await db
      .insert(userAchievements)
      .values({
        achievementId: achievementId,
        earnedDate: Date.now()
      });
    
    return true;
  }

  // Materials Management
  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const result = await db
      .select()
      .from(materials)
      .where(eq(materials.id, id));
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createMaterial(materialData: InsertMaterial): Promise<Material> {
    const result = await db
      .insert(materials)
      .values(materialData)
      .returning();
    
    return result[0];
  }

  async updateMaterial(id: number, materialData: Partial<InsertMaterial>): Promise<Material | undefined> {
    const result = await db
      .update(materials)
      .set(materialData)
      .where(eq(materials.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const result = await db
      .delete(materials)
      .where(eq(materials.id, id))
      .returning();
    
    return result.length > 0;
  }

  async updateMaterialStock(id: number, newQuantity: number): Promise<Material | undefined> {
    const result = await db
      .update(materials)
      .set({ quantity: newQuantity })
      .where(eq(materials.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async getLowStockMaterials(): Promise<Material[]> {
    // Buscar materiais com estoque abaixo do mínimo
    return await db
      .select()
      .from(materials)
      .where(
        sql`${materials.minimumStock} IS NOT NULL AND ${materials.quantity} < ${materials.minimumStock}`
      );
  }

  // Procedure Materials
  async getProcedureMaterials(procedureType: string): Promise<(ProcedureMaterial & { material: Material })[]> {
    // Buscar todos os materiais para o tipo de procedimento
    const procedureMaterialsData = await db
      .select()
      .from(procedureMaterials)
      .where(eq(procedureMaterials.procedureType, procedureType));
    
    // Se não houver materiais, retornar array vazio
    if (procedureMaterialsData.length === 0) {
      return [];
    }
    
    // Para cada material de procedimento, buscar informações do material
    const result: (ProcedureMaterial & { material: Material })[] = [];
    
    for (const pm of procedureMaterialsData) {
      const material = await this.getMaterial(pm.materialId);
      if (material) {
        result.push({
          ...pm,
          material
        });
      }
    }
    
    return result;
  }

  async getProcedureMaterial(id: number): Promise<ProcedureMaterial | undefined> {
    const result = await db
      .select()
      .from(procedureMaterials)
      .where(eq(procedureMaterials.id, id));
    
    return result.length > 0 ? result[0] : undefined;
  }

  async addMaterialToProcedureType(procedureMaterialData: InsertProcedureMaterial): Promise<ProcedureMaterial> {
    const result = await db
      .insert(procedureMaterials)
      .values(procedureMaterialData)
      .returning();
    
    return result[0];
  }

  async updateProcedureMaterial(id: number, procedureMaterialData: Partial<InsertProcedureMaterial>): Promise<ProcedureMaterial | undefined> {
    const result = await db
      .update(procedureMaterials)
      .set(procedureMaterialData)
      .where(eq(procedureMaterials.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async removeMaterialFromProcedureType(id: number): Promise<boolean> {
    const result = await db
      .delete(procedureMaterials)
      .where(eq(procedureMaterials.id, id))
      .returning();
    
    return result.length > 0;
  }

  async calculateProcedureCost(procedureType: string): Promise<{ totalCost: number; materials: (ProcedureMaterial & { material: Material })[] }> {
    // Buscar todos os materiais para o tipo de procedimento
    const procedureMaterialsList = await this.getProcedureMaterials(procedureType);
    
    // Calcular custo total
    let totalCost = 0;
    
    for (const pm of procedureMaterialsList) {
      const materialCost = pm.quantityUsed * pm.material.unitCost;
      totalCost += materialCost;
    }
    
    return {
      totalCost,
      materials: procedureMaterialsList
    };
  }
}