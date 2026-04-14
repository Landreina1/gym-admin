import { api } from '@/lib/api';
import type { Payment, Student, StudentForPayments, PaymentStats } from '@/types';

export const paymentsService = {
  create: async (data: {
    studentId: string;
    amount: number;
    paidAt: string;
    periodStart: string;
    periodEnd: string;
    paymentMethod?: string;
    notes?: string;
  }): Promise<Payment> => {
    const res = await api.post('/payments', data);
    return res.data;
  },

  getStats: async (): Promise<PaymentStats> => {
    const res = await api.get('/payments/stats');
    return res.data;
  },

  getAllStudents: async (): Promise<StudentForPayments[]> => {
    const res = await api.get('/payments/all-students');
    return res.data;
  },

  getByStudent: async (studentId: string): Promise<Payment[]> => {
    const res = await api.get(`/payments/student/${studentId}`);
    return res.data;
  },

  getOverdue: async (): Promise<Student[]> => {
    const res = await api.get('/payments/overdue');
    return res.data;
  },

  getDueSoon: async (days = 3): Promise<Student[]> => {
    const res = await api.get(`/payments/due-soon?days=${days}`);
    return res.data;
  },

  markOverdue: async (studentId: string): Promise<Payment> => {
    const res = await api.post(`/payments/${studentId}/mark-overdue`);
    return res.data;
  },
};
