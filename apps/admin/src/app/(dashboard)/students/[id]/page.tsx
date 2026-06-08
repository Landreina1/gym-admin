'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CreditCard, User, Pencil, Plus,
  Calendar, AlertTriangle, CheckCircle, Clock, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { studentsService } from '@/services/students.service';
import { Toast } from '@/components/ui/Toast';
import { PaymentFlowModal } from '@/components/payments/PaymentFlowModal';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

/* ─── Commented out: evolución de medidas / peso / gráficos corporales ────────
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Scale, Target, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { weightService } from '@/services/weight.service';
import { bodyRecordService } from '@/services/body-record.service';
import { GOAL_LABELS } from '@/lib/utils';

const BODY_TABS = [
  { key: 'weight',  label: 'Peso',    unit: 'kg', color: '#0ea5e9' },
  { key: 'waist',   label: 'Cintura', unit: 'cm', color: '#8b5cf6' },
  { key: 'abdomen', label: 'Abdomen', unit: 'cm', color: '#f59e0b' },
  { key: 'arms',    label: 'Brazos',  unit: 'cm', color: '#10b981' },
  { key: 'legs',    label: 'Piernas', unit: 'cm', color: '#ef4444' },
  { key: 'glutes',  label: 'Glúteos', unit: 'cm', color: '#ec4899' },
  { key: 'height',  label: 'Estatura',unit: 'cm', color: '#6366f1' },
] as const;

function ProgressBar({ value, goal, initial }: { value: number; goal: string; initial: number }) { ... }
function ChartTooltip({ active, payload, label, unit }: any) { ... }
─────────────────────────────────────────────────────────────────────────────── */

function StatusBadge({ status, isOverdue }: { status?: string; isOverdue?: boolean }) {
  if (status === 'PARTIAL')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />Pago parcial</span>;
  if (status === 'OVERDUE' || isOverdue)
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600"><AlertTriangle className="w-3 h-3" />En mora</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3" />Al día</span>;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [paymentModal, setPaymentModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [histTab, setHistTab] = useState<'payments' | 'periods'>('periods');
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  const togglePeriod = (key: string) =>
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  /* Commented out: registrar peso modal state + mutation
  const today = new Date().toISOString().slice(0, 10);
  const [weightModal, setWeightModal] = useState(false);
  const [weightForm, setWeightForm] = useState({ weight: '', recordedAt: today, notes: '' });
  const { data: weightData } = useQuery({ queryKey: ['weight', id], queryFn: () => weightService.getByStudent(id), enabled: !!id });
  const { data: bodyData } = useQuery({ queryKey: ['body-records', id], queryFn: () => bodyRecordService.getByStudent(id), enabled: !!id });
  const weightMutation = useMutation({ ... });
  */

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsService.getOne(id),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
        <div className="h-14 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
        <div className="h-72 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!student) return null;

  const planPrice = Number(student.plan?.price ?? 0);
  const pendingBalance = student.pendingBalance ?? 0;

  // Flat payments sorted newest first (for "Pagos" tab)
  const allPayments = [...(student.payments ?? [])].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
  );

  // Payments grouped by period (for "Períodos" tab)
  const groups = new Map<string, NonNullable<typeof student.payments>>();
  (student.payments ?? []).forEach((p) => {
    const key = p.periodEnd?.slice(0, 10) ?? 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  });
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PaymentFlowModal
        student={paymentModal && student ? {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          plan: student.plan,
          paymentStatus: student.paymentStatus,
          pendingBalance: student.pendingBalance,
          currentPeriodEnd: student.currentPeriodEnd,
        } : null}
        onClose={() => setPaymentModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['student', id] });
          setToast({ message: 'Pago registrado correctamente', type: 'success' });
        }}
      />

      {/* Commented out: registrar peso modal
      <Modal isOpen={weightModal} onClose={() => setWeightModal(false)} title="Registrar peso">
        ...
      </Modal>
      */}

      <div className="space-y-4 max-w-4xl mx-auto">

        {/* ── 1. Header ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
          <div className="flex items-start gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors flex-shrink-0 mt-0.5">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
                <StatusBadge status={student.paymentStatus} isOverdue={student.isOverdue} />
              </div>
              <p className="text-sm text-gray-400">
                {student.plan?.name} · Cobro día {student.billingDay}
                {(student as any).cedula && <> · {(student as any).cedula}</>}
              </p>
            </div>
            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Link href={`/students/${id}/edit`}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </Link>
              <button onClick={() => setPaymentModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Registrar pago</span>
                <span className="sm:hidden">Pago</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Tarjetas resumen ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Plan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Plan actual</p>
            <p className="text-sm font-bold text-gray-900 truncate">{student.plan?.name ?? '—'}</p>
          </div>
          {/* Mensualidad */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Mensualidad</p>
            <p className="text-lg font-bold text-gray-900">${planPrice} <span className="text-xs font-normal text-gray-400">USD</span></p>
          </div>
          {/* Próximo cobro */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Próximo cobro</p>
            <p className="text-sm font-bold text-gray-900">
              {student.nextDueDate ? formatDate(student.nextDueDate) : '—'}
            </p>
          </div>
        </div>

        {/* ── 3. Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

          {/* LEFT */}
          <div className="space-y-4">

            {/* ── Historial (tabbed) ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Tab header */}
              <div className="px-4 md:px-5 pt-4 border-b border-gray-100 flex items-center gap-4">
                <div className="flex items-center gap-2 mr-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">Historial</span>
                </div>
                {(['periods', 'payments'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setHistTab(tab)}
                    className={cn(
                      'pb-3 text-sm font-medium border-b-2 transition-colors',
                      histTab === tab
                        ? 'border-brand-600 text-brand-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600',
                    )}
                  >
                    {tab === 'periods' ? 'Períodos' : 'Pagos'}
                  </button>
                ))}
              </div>

              {/* ── Tab: Períodos ── */}
              {histTab === 'periods' && (
                <>
                  {sortedGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CreditCard className="w-8 h-8 text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">Sin pagos registrados aún</p>
                      <button onClick={() => setPaymentModal(true)} className="mt-3 text-xs text-brand-600 font-semibold">+ Registrar pago</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {sortedGroups.map(([periodEnd, pmts]) => {
                        const totalPaid = pmts.reduce((s, p) => s + Number(p.amount), 0);
                        const totalAmount = Number(pmts[0].totalAmount ?? pmts[0].amount);
                        const isComplete = totalAmount <= 0 || totalPaid >= totalAmount - 0.01;
                        const isExpandable = pmts.length > 1 || !isComplete;
                        const isExpanded = expandedPeriods.has(periodEnd);
                        return (
                          <div key={periodEnd}>
                            {/* Period row */}
                            <div
                              className={cn('px-4 md:px-5 py-3.5 flex items-center gap-3', isExpandable && 'cursor-pointer hover:bg-gray-50 transition-colors')}
                              onClick={() => isExpandable && togglePeriod(periodEnd)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-700">Hasta {formatDate(periodEnd)}</span>
                                  {pmts.length > 1 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                      {pmts.length} abonos
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-bold text-gray-800">{formatCurrency(totalPaid)}</span>
                                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                                  isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                                )}>
                                  {isComplete ? 'Completo' : `Pendiente $${(totalAmount - totalPaid).toFixed(2)}`}
                                </span>
                                {isExpandable && (
                                  <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                                )}
                              </div>
                            </div>
                            {/* Collapsible abonos */}
                            {isExpandable && isExpanded && (
                              <div className="px-4 md:px-5 pb-3 space-y-1.5">
                                {pmts.map((p) => (
                                  <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                                    <div>
                                      <p className="text-xs font-medium text-gray-700">{formatDate(p.paidAt)}</p>
                                      <p className="text-xs text-gray-400">{p.paymentMethod ?? '—'}</p>
                                      {p.notes && <p className="text-xs text-gray-400 truncate max-w-[220px]">{p.notes}</p>}
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600">+{formatCurrency(p.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── Tab: Pagos ── */}
              {histTab === 'payments' && (
                <>
                  {allPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CreditCard className="w-8 h-8 text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">Sin pagos registrados aún</p>
                      <button onClick={() => setPaymentModal(true)} className="mt-3 text-xs text-brand-600 font-semibold">+ Registrar pago</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {allPayments.map((p) => (
                        <div key={p.id} className="px-4 md:px-5 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">{formatDate(p.paidAt)}</p>
                            <p className="text-xs text-gray-400">
                              {p.paymentMethod ?? '—'}
                              {p.periodEnd && <> · período hasta {formatDate(p.periodEnd)}</>}
                            </p>
                            {p.notes && <p className="text-xs text-gray-400 truncate max-w-[260px]">{p.notes}</p>}
                          </div>
                          <span className="text-sm font-bold text-emerald-600 flex-shrink-0">+{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">

            {/* ── Información personal ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Información personal</h2>
              </div>
              <dl className="space-y-3">
                {([
                  ['Cédula',   (student as any).cedula || '—'],
                  ['Teléfono', student.phone || '—'],
                  ['Email',    student.email || '—'],
                  ['Ingreso',  formatDate(student.joinDate)],
                  ['Plan',     student.plan?.name ?? '—'],
                  ['Día cobro', `Día ${student.billingDay}`],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center text-sm gap-2">
                    <dt className="text-gray-400 flex-shrink-0">{label}</dt>
                    <dd className="text-gray-800 font-medium text-right truncate">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ── Notas ── */}
            {student.notes && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Notas</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{student.notes}</p>
              </div>
            )}

            {/* Commented out: Medidas corporales, Salud, Registros de peso
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
              Medidas corporales: cintura, abdomen, brazos, piernas, glúteos
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
              Salud: alergias, celiaquía
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              Registros de peso: listado con evolución
            </div>
            */}

          </div>
        </div>

        {/* Commented out: Evolución de medidas (gráfico + tabs métricas + filtros fecha)
        See git history to restore the body charts section.
        Body tabs: Peso, Cintura, Abdomen, Brazos, Piernas, Glúteos, Estatura
        Includes date filter: all / this_month / last_month / custom
        Weight evolution metrics: Inicial / Actual / Cambio + progress bar
        */}

      </div>
    </>
  );
}
