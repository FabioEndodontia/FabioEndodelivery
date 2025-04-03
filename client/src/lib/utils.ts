import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PAYMENT_METHODS, PAYMENT_STATUS, PROCEDURE_TYPES } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (d.toDateString() === now.toDateString()) {
    return 'Hoje';
  }
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  }
  
  return d.toLocaleDateString('pt-BR');
}

export function getTranslatedProcedureType(type: string): string {
  const translations: Record<string, string> = {
    'TREATMENT': 'Tratamento',
    'RETREATMENT': 'Retratamento',
    'INSTRUMENT_REMOVAL': 'Remoção de Instrumento',
    'OTHER': 'Outro'
  };
  
  return translations[type] || type;
}

export function getTranslatedPaymentMethod(method: string): string {
  const translations: Record<string, string> = {
    'PIX': 'PIX',
    'BANK_TRANSFER': 'Transferência Bancária',
    'CASH': 'Dinheiro',
    'CHECK': 'Cheque',
    'PENDING': 'A receber'
  };
  
  return translations[method] || method;
}

export function getTranslatedPaymentStatus(status: string): string {
  const translations: Record<string, string> = {
    'PAID': 'Pago',
    'PENDING': 'Pendente'
  };
  
  return translations[status] || status;
}

export const paymentMethodOptions = PAYMENT_METHODS.map(method => ({
  value: method,
  label: getTranslatedPaymentMethod(method)
}));

export const paymentStatusOptions = PAYMENT_STATUS.map(status => ({
  value: status,
  label: getTranslatedPaymentStatus(status)
}));

export const procedureTypeOptions = PROCEDURE_TYPES.map(type => ({
  value: type,
  label: getTranslatedProcedureType(type)
}));

export function getDaysUntilDate(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Reset time to compare dates only
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const differenceInTime = target.getTime() - today.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  
  return differenceInDays;
}
