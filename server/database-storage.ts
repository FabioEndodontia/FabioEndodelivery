import {
  patients, dentists, procedures, invoices, appointments, financialGoals, achievements, userAchievements,
  materials, procedureMaterials,
  type Patient, type InsertPatient,
  type Dentist, type InsertDentist,
  type Procedure, type InsertProcedure,
  type Invoice, type InsertInvoice,
  type Appointment, type InsertAppointment,
  type FinancialGoal, type InsertFinancialGoal,
  type Achievement, type InsertAchievement,
  type UserAchievement,
  type Material, type InsertMaterial,
  type ProcedureMaterial, type InsertProcedureMaterial,
  PROCEDURE_TYPES
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
    
    // Count active dentists
    const allDentists = await db.select().from(dentists).where(eq(dentists.isActive, true));
    const activeDentists = allDentists.length;
    
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
      activeDentists,
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
    const now = new Date();
    return await db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, now),
          eq(appointments.status, "SCHEDULED")
        )
      )
      .orderBy(appointments.appointmentDate)
      .limit(limit);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    
    return appointment;
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(appointmentData)
      .returning();
    
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, id))
      .returning();
    
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const [deletedAppointment] = await db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning();
    
    return !!deletedAppointment;
  }

  async convertAppointmentToProcedure(id: number): Promise<Procedure | undefined> {
    // Obter o agendamento
    const appointment = await this.getAppointment(id);
    if (!appointment || appointment.convertedToProcedure) {
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
      procedureType: appointment.procedureType as typeof PROCEDURE_TYPES[number],
      value: 0, // Valor padrão, deverá ser atualizado posteriormente
      procedureDate: new Date().toISOString(),
      paymentMethod: "PENDING",
      paymentStatus: "PENDING",
      notes: appointment.notes,
      diagnosis: null,
      prognosis: null,
      canalMeasurements: null,
      initialXrayUrl: null,
      finalXrayUrl: null
    };

    // Inserir o procedimento
    const procedure = await this.createProcedure(procedureData);

    // Atualizar o agendamento para marcar como convertido
    await this.updateAppointment(id, {
      convertedToProcedure: true,
      procedureId: procedure.id,
      status: "COMPLETED"
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
      .where(eq(financialGoals.isActive, true));
  }

  async getFinancialGoal(id: number): Promise<FinancialGoal | undefined> {
    const [goal] = await db
      .select()
      .from(financialGoals)
      .where(eq(financialGoals.id, id));
    
    return goal;
  }

  async createFinancialGoal(goalData: InsertFinancialGoal): Promise<FinancialGoal> {
    const [goal] = await db
      .insert(financialGoals)
      .values({
        ...goalData,
        currentValue: 0,
        isActive: true,
        isCompleted: false
      })
      .returning();
    
    return goal;
  }

  async updateFinancialGoal(id: number, goalData: Partial<InsertFinancialGoal>): Promise<FinancialGoal | undefined> {
    const [updatedGoal] = await db
      .update(financialGoals)
      .set(goalData)
      .where(eq(financialGoals.id, id))
      .returning();
    
    return updatedGoal;
  }

  async updateGoalProgress(id: number, newValue: number): Promise<FinancialGoal | undefined> {
    // Buscar a meta primeiro para verificar se já está concluída
    const goal = await this.getFinancialGoal(id);
    if (!goal) return undefined;

    // Se a meta já estiver concluída, não permitir atualizações
    if (goal.isCompleted) return goal;

    // Atualizar o valor atual
    let isCompleted = false;
    if (newValue >= goal.targetValue) {
      isCompleted = true;
    }

    const [updatedGoal] = await db
      .update(financialGoals)
      .set({
        currentValue: newValue,
        isCompleted: isCompleted,
        completedAt: isCompleted ? new Date() : null
      })
      .where(eq(financialGoals.id, id))
      .returning();
    
    return updatedGoal;
  }

  async deleteFinancialGoal(id: number): Promise<boolean> {
    const [deletedGoal] = await db
      .delete(financialGoals)
      .where(eq(financialGoals.id, id))
      .returning();
    
    return !!deletedGoal;
  }

  async checkGoalsProgress(): Promise<{ updatedGoals: number; completedGoals: number }> {
    // Obter todas as metas ativas não concluídas
    const activeGoals = await db
      .select()
      .from(financialGoals)
      .where(
        and(
          eq(financialGoals.isActive, true),
          eq(financialGoals.isCompleted, false)
        )
      );
    
    let updatedGoals = 0;
    let completedGoals = 0;

    // Verificar cada meta
    for (const goal of activeGoals) {
      let currentValue = 0;

      // Calcular o valor atual baseado no tipo de meta
      switch (goal.goalType) {
        case 'REVENUE':
          // Calcular receita total/mensal
          const startDate = new Date(goal.startDate);
          const endDate = new Date(goal.endDate);
          const now = new Date();

          // Se a data de término já passou e a meta não foi concluída
          if (now > endDate) {
            continue; // Pular esta meta
          }

          // Buscar procedimentos no período
          const procs = await db
            .select()
            .from(procedures)
            .where(
              and(
                gte(procedures.procedureDate, startDate),
                gte(endDate, procedures.procedureDate)
              )
            );
          
          if (procs.length > 0) {
            // Somar os valores
            currentValue = procs.reduce((sum, p) => sum + Number(p.value), 0);
          }
          break;

        case 'PROCEDURE_COUNT':
          // Contar número de procedimentos
          const procStartDate = new Date(goal.startDate);
          const procEndDate = new Date(goal.endDate);

          // Buscar procedimentos no período
          const procedureCount = await db
            .select()
            .from(procedures)
            .where(
              and(
                gte(procedures.procedureDate, procStartDate),
                gte(procEndDate, procedures.procedureDate)
              )
            );
          
          currentValue = procedureCount.length;
          break;

        case 'NEW_PATIENTS':
          // Contar novos pacientes
          const patientStartDate = new Date(goal.startDate);
          const patientEndDate = new Date(goal.endDate);

          // Buscar pacientes criados no período
          const newPatients = await db
            .select()
            .from(patients)
            .where(
              and(
                gte(patients.createdAt, patientStartDate),
                gte(patientEndDate, patients.createdAt)
              )
            );
          
          currentValue = newPatients.length;
          break;

        case 'SPECIFIC_DENTIST':
          // Receita de um dentista específico
          if (!goal.dentistId) continue;

          const dentistStartDate = new Date(goal.startDate);
          const dentistEndDate = new Date(goal.endDate);

          // Buscar procedimentos do dentista no período
          const dentistProcs = await db
            .select()
            .from(procedures)
            .where(
              and(
                eq(procedures.dentistId, goal.dentistId),
                gte(procedures.procedureDate, dentistStartDate),
                gte(dentistEndDate, procedures.procedureDate)
              )
            );
          
          if (dentistProcs.length > 0) {
            // Somar os valores
            currentValue = dentistProcs.reduce((sum, p) => sum + Number(p.value), 0);
          }
          break;

        case 'SPECIFIC_PROCEDURE':
          // Contar procedimentos de um tipo específico
          if (!goal.procedureType) continue;

          const procTypeStartDate = new Date(goal.startDate);
          const procTypeEndDate = new Date(goal.endDate);

          // Buscar procedimentos do tipo específico no período
          const typeProcs = await db
            .select()
            .from(procedures)
            .where(
              and(
                eq(procedures.procedureType, goal.procedureType),
                gte(procedures.procedureDate, procTypeStartDate),
                gte(procTypeEndDate, procedures.procedureDate)
              )
            );
          
          currentValue = typeProcs.length;
          break;
      }

      // Se o valor atual mudou, atualizar a meta
      if (currentValue !== goal.currentValue) {
        updatedGoals++;
        let isCompleted = false;
        
        if (currentValue >= goal.targetValue) {
          isCompleted = true;
          completedGoals++;
        }

        // Atualizar no banco de dados
        await db
          .update(financialGoals)
          .set({
            currentValue: currentValue,
            isCompleted: isCompleted,
            completedAt: isCompleted ? new Date() : null
          })
          .where(eq(financialGoals.id, goal.id));
      }
    }

    return { updatedGoals, completedGoals };
  }

  // Conquistas
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id));
    
    return achievement;
  }

  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(achievementData)
      .returning();
    
    return achievement;
  }

  async updateAchievement(id: number, achievementData: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const [updatedAchievement] = await db
      .update(achievements)
      .set(achievementData)
      .where(eq(achievements.id, id))
      .returning();
    
    return updatedAchievement;
  }

  async deleteAchievement(id: number): Promise<boolean> {
    const [deletedAchievement] = await db
      .delete(achievements)
      .where(eq(achievements.id, id))
      .returning();
    
    return !!deletedAchievement;
  }

  async getUserAchievements(): Promise<(Achievement & { earnedDate: Date })[]> {
    // Buscar os IDs de conquistas que o usuário já ganhou
    const userAchievementRecords = await db.select().from(userAchievements);
    
    // Se não houver conquistas, retornar um array vazio
    if (userAchievementRecords.length === 0) {
      return [];
    }
    
    // Criar um mapa de datas de conquista
    const earnedDatesMap = new Map<number, Date>();
    userAchievementRecords.forEach(record => {
      earnedDatesMap.set(record.achievementId, record.earnedDate);
    });
    
    // Buscar todas as conquistas do usuário
    const achievementIds = userAchievementRecords.map(record => record.achievementId);
    const userAchievs = await db
      .select()
      .from(achievements)
      .where(inArray(achievements.id, achievementIds));
    
    // Adicionar a data em que cada conquista foi ganha
    return userAchievs.map(achievement => ({
      ...achievement,
      earnedDate: earnedDatesMap.get(achievement.id)!
    }));
  }

  async awardAchievement(achievementId: number): Promise<boolean> {
    // Verificar se a conquista existe
    const achievement = await this.getAchievement(achievementId);
    if (!achievement) {
      return false;
    }
    
    // Verificar se o usuário já tem esta conquista
    const existingRecords = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.achievementId, achievementId));
    
    if (existingRecords.length > 0) {
      return false; // Usuário já tem esta conquista
    }
    
    // Conceder a conquista
    await db
      .insert(userAchievements)
      .values({
        achievementId: achievementId,
        earnedDate: new Date()
      });
    
    return true;
  }
  
  // Materials Management
  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, id));
    
    return material;
  }

  async createMaterial(materialData: InsertMaterial): Promise<Material> {
    const [material] = await db
      .insert(materials)
      .values({
        ...materialData,
        isActive: true
      })
      .returning();
    
    return material;
  }

  async updateMaterial(id: number, materialData: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [updatedMaterial] = await db
      .update(materials)
      .set(materialData)
      .where(eq(materials.id, id))
      .returning();
    
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    // Verificar se o material é usado em algum procedimento
    const usedInProcedures = await db
      .select()
      .from(procedureMaterials)
      .where(eq(procedureMaterials.materialId, id));
    
    if (usedInProcedures.length > 0) {
      // Marcar como inativo em vez de excluir
      const [updatedMaterial] = await db
        .update(materials)
        .set({ isActive: false })
        .where(eq(materials.id, id))
        .returning();
      
      return !!updatedMaterial;
    }
    
    // Se não estiver sendo usado, excluir
    const [deletedMaterial] = await db
      .delete(materials)
      .where(eq(materials.id, id))
      .returning();
    
    return !!deletedMaterial;
  }

  async updateMaterialStock(id: number, newQuantity: number): Promise<Material | undefined> {
    const [updatedMaterial] = await db
      .update(materials)
      .set({ stockQuantity: newQuantity })
      .where(eq(materials.id, id))
      .returning();
    
    return updatedMaterial;
  }

  async getLowStockMaterials(): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(
        sql`${materials.isActive} = true AND ${materials.stockQuantity} <= ${materials.minimumStock}`
      );
  }

  // Procedure Materials
  async getProcedureMaterials(procedureType: string): Promise<(ProcedureMaterial & { material: Material })[]> {
    const procedureMaterialsList = await db
      .select()
      .from(procedureMaterials)
      .where(eq(procedureMaterials.procedureType, procedureType));
    
    // Para cada material no procedimento, buscar os detalhes do material
    const result = [];
    for (const pm of procedureMaterialsList) {
      const [material] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, pm.materialId));
      
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
    const [procedureMaterial] = await db
      .select()
      .from(procedureMaterials)
      .where(eq(procedureMaterials.id, id));
    
    return procedureMaterial;
  }

  async addMaterialToProcedureType(procedureMaterialData: InsertProcedureMaterial): Promise<ProcedureMaterial> {
    const [procedureMaterial] = await db
      .insert(procedureMaterials)
      .values(procedureMaterialData)
      .returning();
    
    return procedureMaterial;
  }

  async updateProcedureMaterial(id: number, procedureMaterialData: Partial<InsertProcedureMaterial>): Promise<ProcedureMaterial | undefined> {
    const [updatedProcedureMaterial] = await db
      .update(procedureMaterials)
      .set(procedureMaterialData)
      .where(eq(procedureMaterials.id, id))
      .returning();
    
    return updatedProcedureMaterial;
  }

  async removeMaterialFromProcedureType(id: number): Promise<boolean> {
    const [deletedProcedureMaterial] = await db
      .delete(procedureMaterials)
      .where(eq(procedureMaterials.id, id))
      .returning();
    
    return !!deletedProcedureMaterial;
  }

  async calculateProcedureCost(procedureType: string): Promise<{ totalCost: number; materials: (ProcedureMaterial & { material: Material })[] }> {
    const procedureMaterials = await this.getProcedureMaterials(procedureType);
    
    const totalCost = procedureMaterials.reduce((sum, pm) => {
      return sum + (pm.quantity * pm.material.unitPrice);
    }, 0);
    
    return {
      totalCost,
      materials: procedureMaterials
    };
  }
}