import { api } from '@/lib/api';
import type { Plan } from '@/types';

export const plansService = {
  getAll: async (): Promise<Plan[]> => {
    const res = await api.get('/plans');
    return res.data;
  },

  getOne: async (id: string): Promise<Plan> => {
    const res = await api.get(`/plans/${id}`);
    return res.data;
  },

  create: async (data: { name: string; description?: string; price: number; durationDays: number }): Promise<Plan> => {
    const res = await api.post('/plans', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Plan>): Promise<Plan> => {
    const res = await api.put(`/plans/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/plans/${id}`);
  },
};
