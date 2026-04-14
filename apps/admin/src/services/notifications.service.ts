import { api } from '@/lib/api';
import type { Notification, NotificationStatus, NotificationType } from '@/types';

export const notificationsService = {
  getAll: async (status?: NotificationStatus): Promise<Notification[]> => {
    const params = status ? `?status=${status}` : '';
    const res = await api.get(`/notifications${params}`);
    return res.data;
  },

  create: async (data: {
    studentId?: string;
    type: NotificationType;
    title: string;
    message: string;
    scheduledAt?: string;
  }): Promise<Notification> => {
    const res = await api.post('/notifications', data);
    return res.data;
  },

  updateStatus: async (id: string, status: NotificationStatus): Promise<Notification> => {
    const res = await api.put(`/notifications/${id}/status`, { status });
    return res.data;
  },

  generatePaymentDue: async (): Promise<{ generated: number }> => {
    const res = await api.post('/notifications/generate-payment-due');
    return res.data;
  },
};
