import { api } from '@/lib/api';

export interface Meal {
  name: string;
  time?: string;
  foods: string;
  calories?: string;
  notes?: string;
}

export interface DietTemplate {
  id: string;
  name: string;
  description?: string;
  meals: Meal[];
  isActive: boolean;
  createdAt: string;
}

export interface StudentDiet {
  id: string;
  studentId: string;
  templateId?: string;
  template?: { id: string; name: string };
  name: string;
  meals: Meal[];
  notes?: string;
  assignedAt: string;
}

export const dietService = {
  // Templates
  getTemplates: () => api.get<DietTemplate[]>('/diets/templates').then((r) => r.data),
  getTemplate: (id: string) => api.get<DietTemplate>(`/diets/templates/${id}`).then((r) => r.data),
  createTemplate: (data: Omit<DietTemplate, 'id' | 'isActive' | 'createdAt'>) =>
    api.post<DietTemplate>('/diets/templates', data).then((r) => r.data),
  updateTemplate: (id: string, data: Partial<DietTemplate>) =>
    api.patch<DietTemplate>(`/diets/templates/${id}`, data).then((r) => r.data),
  deleteTemplate: (id: string) => api.delete(`/diets/templates/${id}`).then((r) => r.data),

  // Student diets
  getStudentDiet: (studentId: string) =>
    api.get<StudentDiet | null>(`/diets/student/${studentId}`).then((r) => r.data).catch(() => null),
  assignDiet: (data: { studentId: string; templateId?: string; name: string; meals: Meal[]; notes?: string }) =>
    api.post<StudentDiet>('/diets/student', data).then((r) => r.data),
  updateStudentDiet: (studentId: string, data: Partial<StudentDiet>) =>
    api.patch<StudentDiet>(`/diets/student/${studentId}`, data).then((r) => r.data),
  removeStudentDiet: (studentId: string) => api.delete(`/diets/student/${studentId}`).then((r) => r.data),
};
