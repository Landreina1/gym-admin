import { api } from '@/lib/api';
import type { WeightRecord } from '@/types';

export const weightService = {
  create: async (data: {
    studentId: string;
    weight: number;
    notes?: string;
    recordedAt?: string;
  }): Promise<WeightRecord> => {
    const res = await api.post('/weight', data);
    return res.data;
  },

  getByStudent: async (studentId: string): Promise<{
    records: WeightRecord[];
    evolution: {
      initialWeight: number;
      currentWeight: number;
      difference: number;
      trend: 'LOSING' | 'GAINING' | 'STABLE';
    } | null;
  }> => {
    const res = await api.get(`/weight/student/${studentId}`);
    return res.data;
  },
};
