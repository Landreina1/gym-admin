'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Scale, CreditCard, User, Plus, Pencil,
  TrendingDown, TrendingUp, Minus, Target, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { studentsService } from '@/services/students.service';
import { weightService } from '@/services/weight.service';
import { bodyRecordService } from '@/services/body-record.service';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { PaymentFlowModal } from '@/components/payments/PaymentFlowModal';
import { formatDate, formatCurrency, GOAL_LABELS, cn } from '@/lib/utils';

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-400 text-xs mb-0.5">{label}</p>
      <p className="font-bold text-gray-900">{payload[0].value} {unit}</p>
    </div>
  );
}

const BODY_TABS = [
  { key: 'weight',  label: 'Peso',    unit: 'kg', color: '#0ea5e9' },
  { key: 'waist',   label: 'Cintura', unit: 'cm', color: '#8b5cf6' },
  { key: 'abdomen', label: 'Abdomen', unit: 'cm', color: '#f59e0b' },
  { key: 'arms',    label: 'Brazos',  unit: 'cm', color: '#10b981' },
  { key: 'legs',    label: 'Piernas', unit: 'cm', color: '#ef4444' },
  { key: 'glutes',  label: 'Glúteos', unit: 'cm', color: '#ec4899' },
  { key: 'height',  label: 'Estatura',unit: 'cm', color: '#6366f1' },
] as const;

function ProgressBar({ value, goal, initial }: { value: number; goal: string; initial: number }) {
  const isLose = goal === 'LOSE_WEIGHT';
  const diff = isLose ? initial - value : value - initial;
  const pct = Math.min(100, Math.max(0, diff > 0 ? (diff / Math.abs(initial - value || 1)) * 100 : 0));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={cn('h-2 rounded-full transition-all duration-500', diff > 0 ? 'bg-emerald-500' : 'bg-red-400')} style={{ width: `${Math.min(100, Math.abs(pct))}%` }} />
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [weightModal, setWeightModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('weight');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [weightForm, setWeightForm] = useState({ weight: '', recordedAt: today, notes: '' });

  const { data: student, isLoading } = useQuery({ queryKey: ['student', id], queryFn: () => studentsService.getOne(id) });
  const { data: weightData } = useQuery({ queryKey: ['weight', id], queryFn: () => weightService.getByStudent(id), enabled: !!id });
  const { data: bodyData } = useQuery({ queryKey: ['body-records', id], queryFn: () => bodyRecordService.getByStudent(id), enabled: !!id });

  const weightMutation = useMutation({
    mutationFn: () => weightService.create({ studentId: id, weight: Number(weightForm.weight), recordedAt: weightForm.recordedAt, notes: weightForm.notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight', id] });
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      setWeightModal(false);
      setWeightForm({ weight: '', recordedAt: today, notes: '' });
      setToast({ message: 'Peso registrado correctamente', type: 'success' });
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });


  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-14 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!student) return null;

  const chartRecords = [...(weightData?.records ?? [])].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const chartData = chartRecords.map((r) => ({ fecha: formatDate(r.recordedAt), peso: r.weight }));
  const evo = weightData?.evolution;
  const initialW = evo?.initialWeight ?? student.initialWeight ?? 0;
  const currentW = evo?.currentWeight ?? 0;
  const diff = evo?.difference ?? 0;
  const isLose = student.goal === 'LOSE_WEIGHT';
  const isGain = student.goal === 'GAIN_WEIGHT';
  const isGoodProgress = (isLose && diff < 0) || (isGain && diff > 0);
  const isBadProgress  = (isLose && diff > 0) || (isGain && diff < 0);
  const weights = chartData.map((d) => d.peso);
  const yMin = weights.length ? Math.floor(Math.min(...weights) - 2) : 0;
  const yMax = weights.length ? Math.ceil(Math.max(...weights) + 2) : 100;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Weight modal */}
      <Modal isOpen={weightModal} onClose={() => setWeightModal(false)} title="Registrar peso">
        <form onSubmit={(e) => { e.preventDefault(); weightMutation.mutate(); }} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Peso (kg) *</label>
            <input type="number" step="0.1" required autoFocus value={weightForm.weight} onChange={(e) => setWeightForm((f) => ({ ...f, weight: e.target.value }))} className={inputClass} placeholder="Ej: 72.5" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha *</label>
            <input type="date" lang="es" required value={weightForm.recordedAt} onChange={(e) => setWeightForm((f) => ({ ...f, recordedAt: e.target.value }))} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <input type="text" value={weightForm.notes} onChange={(e) => setWeightForm((f) => ({ ...f, notes: e.target.value }))} className={inputClass} placeholder="Opcional" /></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setWeightModal(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">Cancelar</button>
            <button type="submit" disabled={weightMutation.isPending} className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">{weightMutation.isPending ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

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

      <div className="space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{student.firstName} {student.lastName}</h1>
            <p className="text-xs text-gray-400 truncate">{student.plan?.name} · Día de cobro: {student.billingDay}</p>
          </div>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0',
            student.isOverdue ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700',
          )}>
            {student.isOverdue ? 'En mora' : 'Al día'}
          </span>
        </div>

        {/* ── Mobile action buttons (full width) ── */}
        <div className="flex gap-2 md:hidden">
          <Link href={`/students/${id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Pencil className="w-4 h-4" /> Editar
          </Link>
          <button onClick={() => router.push(`/students/${id}/medidas`)} className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Scale className="w-4 h-4" /> Medidas
          </button>
          <button onClick={() => setPaymentModal(true)} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700">
            <Plus className="w-4 h-4" /> Pago
          </button>
        </div>

        {/* ── Desktop action buttons (header row) ── */}
        <div className="hidden md:flex gap-2 justify-end">
          <Link href={`/students/${id}/edit`} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Link>
          <button onClick={() => router.push(`/students/${id}/medidas`)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Scale className="w-3.5 h-3.5" /> Medidas
          </button>
          <button onClick={() => setPaymentModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700">
            <Plus className="w-3.5 h-3.5" /> Pago
          </button>
        </div>

        {/* ── Main grid: stacks on mobile, 2-col on desktop ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

          {/* LEFT */}
          <div className="space-y-4">

            {/* Body records chart with tabs */}
            {(() => {
              const records = bodyData?.records ?? [];
              const trackHeight = bodyData?.trackHeight ?? false;
              const visibleTabs = BODY_TABS.filter((t) => t.key !== 'height' || trackHeight);
              const tab = visibleTabs.find((t) => t.key === activeTab) ?? visibleTabs[0];

              // Build raw records for current metric
              let allRecords: { recordedAt: string; val: number }[];
              if (tab.key === 'weight') {
                const fromWeight = chartRecords.map((r: any) => ({ recordedAt: r.recordedAt, val: Number(r.weight) }));
                const fromBody   = records.filter((r: any) => r.weight != null).map((r: any) => ({ recordedAt: r.recordedAt, val: Number(r.weight) }));
                allRecords = [...fromWeight, ...fromBody].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
              } else {
                allRecords = records
                  .filter((r: any) => r[tab.key] != null)
                  .sort((a: any, b: any) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
                  .map((r: any) => ({ recordedAt: r.recordedAt, val: Number(r[tab.key]) }));
              }

              // Date filter
              const now = new Date();
              const filtered = allRecords.filter((r) => {
                const d = new Date(r.recordedAt);
                if (dateFilter === 'this_month') {
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }
                if (dateFilter === 'last_month') {
                  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
                }
                if (dateFilter === 'custom') {
                  const from = customFrom ? new Date(customFrom) : null;
                  const to   = customTo   ? new Date(customTo)   : null;
                  if (from && d < from) return false;
                  if (to   && d > to)   return false;
                }
                return true;
              });

              const chartData2 = filtered.map((r) => ({ fecha: formatDate(r.recordedAt), valor: r.val }));
              const vals = chartData2.map((d) => d.valor);
              const yMin2 = vals.length ? Math.floor(Math.min(...vals) - 2) : 0;
              const yMax2 = vals.length ? Math.ceil(Math.max(...vals) + 2) : 100;

              const DATE_FILTERS = [
                { key: 'all',        label: 'Todos los meses', icon: false },
                { key: 'this_month', label: 'Este mes',        icon: false },
                { key: 'last_month', label: 'Mes anterior',    icon: false },
                { key: 'custom',     label: 'Personalizado',   icon: true },
              ];

              return (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 md:px-5 pt-4 pb-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-gray-900">Evolución de medidas</h2>
                      <button onClick={() => router.push(`/students/${id}/medidas`)} className="text-xs text-brand-600 font-medium">+ Registrar</button>
                    </div>

                    {/* Metric tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                      {visibleTabs.map((t) => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                          className={cn('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                            activeTab === t.key ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                          )}
                          style={activeTab === t.key ? { backgroundColor: t.color } : {}}
                        >{t.label}</button>
                      ))}
                    </div>

                    {/* Date filter tabs */}
                    <div className="flex items-center gap-1.5 py-3 flex-wrap">
                      <span className="text-xs text-gray-400 mr-1">Filtros:</span>
                      {DATE_FILTERS.map((f) => (
                        <button key={f.key}
                          onClick={() => {
                            setDateFilter(f.key as 'all' | 'this_month' | 'last_month' | 'custom');
                            if (f.key === 'custom') setShowCustom(true);
                            else setShowCustom(false);
                          }}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                            dateFilter === f.key
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                          )}
                        >
                          {f.icon && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom date range */}
                    {showCustom && (
                      <div className="flex gap-2 pb-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-400 mb-1">Desde</label>
                          <input type="date" lang="es" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-400 mb-1">Hasta</label>
                          <input type="date" lang="es" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {chartData2.length < 2 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center px-4 pb-4">
                      <Scale className="w-8 h-8 text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">Sin suficientes datos para {tab.label.toLowerCase()}</p>
                      <button onClick={() => router.push(`/students/${id}/medidas`)} className="mt-2 text-xs text-brand-600 font-medium">+ Registrar medidas</button>
                    </div>
                  ) : (
                    <div className="px-2 pb-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData2} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis domain={[yMin2, yMax2]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <Tooltip content={<ChartTooltip unit={tab.unit} />} />
                          <Line type="monotone" dataKey="valor" stroke={tab.color} strokeWidth={2.5}
                            dot={{ r: 4, fill: tab.color, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: tab.color, strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Metrics */}
            {evo && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Inicial</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-700">{initialW}</p>
                  <p className="text-xs text-gray-400">kg</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Actual</p>
                  <p className="text-xl md:text-2xl font-bold text-brand-600">{currentW}</p>
                  <p className="text-xs text-gray-400">kg</p>
                </div>
                <div className={cn('rounded-2xl border shadow-sm p-3 md:p-4 text-center',
                  isGoodProgress ? 'bg-emerald-50 border-emerald-100' : isBadProgress ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100',
                )}>
                  <p className="text-xs text-gray-400 mb-1">Cambio</p>
                  <p className={cn('text-xl md:text-2xl font-bold', isGoodProgress ? 'text-emerald-600' : isBadProgress ? 'text-red-500' : 'text-gray-600')}>
                    {diff > 0 ? '+' : ''}{diff}
                  </p>
                  <p className="text-xs text-gray-400">kg</p>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {student.monthlyGoalKg && evo && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-gray-900">Meta mensual</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{student.monthlyGoalKg} kg</span>
                </div>
                <ProgressBar value={currentW} goal={student.goal} initial={initialW} />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{initialW} kg</span>
                  <span>Meta: {student.monthlyGoalKg} kg</span>
                </div>
              </div>
            )}

            {/* Payment history */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 md:px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Historial de pagos</h2>
              </div>
              {student.payments && student.payments.length > 0 ? (() => {
                // Group payments by periodEnd
                const groups = new Map<string, typeof student.payments>();
                student.payments!.forEach((p) => {
                  const key = p.periodEnd?.slice(0, 10) ?? 'unknown';
                  if (!groups.has(key)) groups.set(key, []);
                  groups.get(key)!.push(p);
                });
                const sorted = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
                return (
                  <div className="divide-y divide-gray-100">
                    {sorted.map(([periodEnd, pmts]) => {
                      const totalPaid = pmts.reduce((s, p) => s + Number(p.amount), 0);
                      const totalAmount = Number(pmts[0].totalAmount ?? pmts[0].amount);
                      const isComplete = totalAmount <= 0 || totalPaid >= totalAmount - 0.01;
                      const hasMultiple = pmts.length > 1;
                      return (
                        <div key={periodEnd} className="px-4 md:px-5 py-3">
                          {/* Period header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-500">Período hasta {formatDate(periodEnd)}</span>
                              {hasMultiple && (
                                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                  {pmts.length} abonos
                                </span>
                              )}
                            </div>
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                              isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                            )}>
                              {isComplete ? 'Completo' : `Pendiente $${(totalAmount - totalPaid).toFixed(2)}`}
                            </span>
                          </div>
                          {/* Individual payments */}
                          <div className="space-y-1">
                            {pmts.map((p) => (
                              <div key={p.id} className="flex items-center justify-between py-1 pl-3 border-l-2 border-gray-100">
                                <div>
                                  <p className="text-xs font-medium text-gray-700">{formatDate(p.paidAt)}</p>
                                  {p.paymentMethod && <p className="text-xs text-gray-400">{p.paymentMethod}</p>}
                                </div>
                                <span className="text-sm font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                          {/* Period total when multiple */}
                          {hasMultiple && (
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                              <span className="text-xs text-gray-400">Total pagado</span>
                              <span className="text-sm font-bold text-gray-800">{formatCurrency(totalPaid)}{totalAmount > 0 && <span className="text-xs text-gray-400 font-normal"> / {formatCurrency(totalAmount)}</span>}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CreditCard className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Sin pagos registrados aún</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">

            {/* Personal info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Información personal</h2>
              </div>
              <dl className="space-y-3">
                {([
                  ['Email', student.email || '—'],
                  ['Teléfono', student.phone || '—'],
                  ['Ingreso', formatDate(student.joinDate)],
                  ['Altura', student.height ? `${student.height} cm` : '—'],
                  ['Meta', GOAL_LABELS[student.goal]],
                  ['Meta mensual', student.monthlyGoalKg ? `${student.monthlyGoalKg} kg` : '—'],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <dt className="text-gray-400">{label}</dt>
                    <dd className="text-gray-800 font-medium text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Body measurements */}
            {((student as any).waist || (student as any).abdomen || (student as any).arms || (student as any).legs || (student as any).glutes) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  <h2 className="text-sm font-semibold text-gray-900">Medidas corporales</h2>
                </div>
                <dl className="space-y-3">
                  {([
                    ['Cintura', (student as any).waist],
                    ['Abdomen', (student as any).abdomen],
                    ['Brazos', (student as any).arms],
                    ['Piernas', (student as any).legs],
                    ['Glúteos', (student as any).glutes],
                  ] as [string, number | null | undefined][])
                    .filter(([, v]) => v != null)
                    .map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center text-sm">
                        <dt className="text-gray-400">{label}</dt>
                        <dd className="text-gray-800 font-medium">{value} cm</dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}

            {/* Health */}
            {((student as any).allergies || (student as any).isCeliac) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  <h2 className="text-sm font-semibold text-gray-900">Salud</h2>
                </div>
                <dl className="space-y-3">
                  {(student as any).allergies && (
                    <div className="flex justify-between items-start text-sm gap-2">
                      <dt className="text-gray-400 shrink-0">Alergias</dt>
                      <dd className="text-gray-800 font-medium text-right">{(student as any).allergies}</dd>
                    </div>
                  )}
                  {(student as any).isCeliac && (
                    <div className="flex justify-between items-center text-sm">
                      <dt className="text-gray-400">Celiaquía</dt>
                      <dd><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Celíaco/a</span></dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Weight history */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 md:px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Registros de peso</h2>
                </div>
                <button onClick={() => setWeightModal(true)} className="text-xs text-brand-600 font-medium">+ Nuevo</button>
              </div>
              {chartRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Scale className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Sin registros de peso</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {[...chartRecords].reverse().map((r, i) => {
                    const prev = [...chartRecords].reverse()[i + 1];
                    const d = prev ? +(r.weight - prev.weight).toFixed(1) : null;
                    return (
                      <div key={r.id} className="flex items-center justify-between px-4 md:px-5 py-3 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-3.5 h-3.5 text-brand-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.weight} kg</p>
                            <p className="text-xs text-gray-400">{formatDate(r.recordedAt)}</p>
                          </div>
                        </div>
                        {d !== null && (
                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                            isGoodProgress && d < 0 ? 'bg-emerald-50 text-emerald-600' :
                            isGoodProgress && d > 0 ? 'bg-red-50 text-red-500' :
                            !isGoodProgress && d > 0 ? 'bg-emerald-50 text-emerald-600' :
                            !isGoodProgress && d < 0 ? 'bg-red-50 text-red-500' :
                            'bg-gray-50 text-gray-400',
                          )}>{d > 0 ? '+' : ''}{d}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
