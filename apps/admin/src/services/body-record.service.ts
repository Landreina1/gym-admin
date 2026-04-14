import { api } from '@/lib/api';

export interface BodyRecord {
  id: string;
  studentId: string;
  recordedAt: string;
  weight?: number;
  height?: number;
  waist?: number;
  abdomen?: number;
  arms?: number;
  legs?: number;
  glutes?: number;
  notes?: string;
}

export const bodyRecordService = {
  getByStudent: (studentId: string) =>
    api.get<{ records: BodyRecord[]; trackHeight: boolean }>(`/body-records/student/${studentId}`).then((r) => r.data),

  create: (data: Omit<BodyRecord, 'id'>) =>
    api.post<BodyRecord>('/body-records', data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/body-records/${id}`).then((r) => r.data),
};
