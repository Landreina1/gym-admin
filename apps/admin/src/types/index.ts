export type StudentGoal = 'LOSE_WEIGHT' | 'GAIN_WEIGHT' | 'MAINTAIN';
export type StudentStatus = 'ACTIVE' | 'INACTIVE';
export type PaymentStatus = 'PAID' | 'OVERDUE' | 'PENDING';
export type PaymentType = 'FULL' | 'PARTIAL';
export type NotificationType = 'PAYMENT_DUE' | 'PAYMENT_OVERDUE' | 'HOLIDAY' | 'ADMIN_NOTICE';
export type NotificationStatus = 'PENDING' | 'SCHEDULED' | 'SENT' | 'CANCELLED';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  isActive: boolean;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  cedula?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  joinDate: string;
  billingDay: number;
  height?: number;
  initialWeight?: number;
  goal: StudentGoal;
  monthlyGoalKg?: number;
  status: StudentStatus;
  notes?: string;
  planId: string;
  plan: Plan;
  isOverdue?: boolean;
  paymentStatus?: 'UP_TO_DATE' | 'PARTIAL' | 'OVERDUE';
  nextDueDate?: string;
  pendingBalance?: number;
  currentPeriodEnd?: string;
  weightRecords?: WeightRecord[];
  payments?: Payment[];
}

export interface WeightRecord {
  id: string;
  studentId: string;
  weight: number;
  notes?: string;
  recordedAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  totalAmount?: number;
  paymentType?: PaymentType;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  status: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
}

export interface StudentForPayments {
  id: string;
  firstName: string;
  lastName: string;
  plan: Plan;
  billingDay: number;
  paymentStatus: 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE' | 'PARTIAL';
  nextDueDate: string | null;
  pendingBalance?: number | null;
  currentPeriodEnd?: string | null;
  lastPayment: {
    id: string;
    amount: number;
    paidAt: string;
    paymentMethod: string | null;
  } | null;
}

export interface PaymentStats {
  kpis: {
    overdue: number;
    dueSoon: number;
    paidThisMonth: number;
    revenueThisMonth: number;
  };
  monthlyRevenue: { month: string; total: number }[];
  methodDistribution: { method: string; count: number; total: number }[];
  statusDistribution: { status: string; count: number; color: string }[];
}

export interface Notification {
  id: string;
  studentId?: string;
  student?: Pick<Student, 'firstName' | 'lastName'>;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  totals: {
    total: number;
    active: number;
    inactive: number;
    upToDate: number;
    overdue: number;
  };
  dueSoon: Student[];
  recentPayments: {
    id: string;
    amount: number | string;
    paidAt: string;
    paymentMethod: string | null;
    paymentType?: string | null;
    student: Pick<Student, 'firstName' | 'lastName'>;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
