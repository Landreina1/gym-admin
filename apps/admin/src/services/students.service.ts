import { api } from '@/lib/api';
import type { Student, PaginatedResponse } from '@/types';

export interface StudentFilters {
  search?: string;
  status?: string;
  planId?: string;
  page?: number;
  limit?: number;
}

export const studentsService = {
  getAll: async (filters: StudentFilters = {}): Promise<PaginatedResponse<Student>> => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.planId) params.set('planId', filters.planId);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const res = await api.get(`/students?${params}`);
    return res.data;
  },

  getOne: async (id: string): Promise<Student> => {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },

  create: async (data: Partial<Student>): Promise<Student> => {
    const res = await api.post('/students', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Student>): Promise<Student> => {
    const res = await api.put(`/students/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },
};
