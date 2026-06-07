'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Clock, TrendingUp, DollarSign, Plus,
  Search, ChevronRight, Wallet,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { paymentsService } from '@/services/payments.service';
import { Toast } from '@/components/ui/Toast';
import { PaymentFlowModal } from '@/components/payments/PaymentFlowModal';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import type { StudentForPayments } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_COLOR: Record<string, string> = {
  'Efectivo USD': '#10b981',
  'Efectivo Bs':  '#f59e0b',
  'Transferencia': '#3b82f6',
  'Pago móvil':   '#8b5cf6',
  'Otro':         '#6b7280',
  'No especificado': '#d1d5db',
};

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function monthLabel(key: string) {
  const [, m] = key.split('-');
  return MONTH_NAMES[parseInt(m) - 1] ?? key;
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className={cn('p-2.5 rounded-xl flex-shrink-0', color)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-0.5 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StudentForPayments['paymentStatus'] }) {
  if (status === 'OVERDUE')  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3" />En mora</span>;
  if (status === 'DUE_SOON') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />Próx. venc.</span>;
  if (status === 'PARTIAL')  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Pago parcial</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><TrendingUp className="w-3 h-3" />Al día</span>;
}

function MethodPill({ method }: { method: string | null | undefined }) {
  if (!method) return <span className="text-xs text-gray-300">—</span>;
  const color = METHOD_COLOR[method] ?? '#6b7280';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ borderColor: color + '40', backgroundColor: color + '15', color }}>
      {method}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<StudentForPayments | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE'>('ALL');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [showCharts, setShowCharts] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['payments-all-students'],
    queryFn: paymentsService.getAllStudents,
  });

  const { data: stats } = useQuery({
    queryKey: ['payments-stats'],
    queryFn: paymentsService.getStats,
  });

  const openModal = (s: StudentForPayments) => setSelectedStudent(s);

  // Unique plans for filter
  const plans = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => { if (s.plan) map.set(s.plan.id, s.plan.name); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  // Filtered list
  const filtered = useMemo(() => students.filter((s) => {
    if (search && !`${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'ALL' && s.paymentStatus !== filterStatus) return false;
    if (filterMethod !== 'ALL' && s.lastPayment?.paymentMethod !== filterMethod) return false;
    if (filterPlan !== 'ALL' && s.plan?.id !== filterPlan) return false;
    return true;
  }), [students, search, filterStatus, filterMethod, filterPlan]);

  // Always show last 6 months, filling 0 for months without data
  const chartMonthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = stats?.monthlyRevenue.find((r) => r.month === key);
      return { month: key, label: monthLabel(key), total: found?.total ?? 0 };
    });
  }, [stats]);

  const chartMethods = stats?.methodDistribution ?? [];
  const chartStatus  = stats?.statusDistribution ?? [];

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PaymentFlowModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onSuccess={() => setToast({ message: 'Pago registrado correctamente', type: 'success' })}
      />

      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pagos</h1>
            <p className="text-sm text-gray-400 mt-0.5">Control financiero del gimnasio</p>
          </div>
          <button onClick={() => setShowCharts((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1">
            {showCharts ? 'Ocultar gráficas' : 'Ver gráficas'}
          </button>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
            label="En mora"
            value={stats?.kpis.overdue ?? '—'}
            color="bg-red-50"
          />
          <KpiCard
            icon={<Clock className="w-4 h-4 text-amber-600" />}
            label="Próx. vencimientos"
            value={stats?.kpis.dueSoon ?? '—'}
            sub="próximos 7 días"
            color="bg-amber-50"
          />
          <KpiCard
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
            label="Pagados este mes"
            value={stats?.kpis.paidThisMonth ?? '—'}
            color="bg-emerald-50"
          />
          <KpiCard
            icon={<DollarSign className="w-4 h-4 text-brand-600" />}
            label="Recaudación del mes"
            value={stats ? formatCurrency(stats.kpis.revenueThisMonth) : '—'}
            color="bg-brand-50"
          />
        </div>

        {/* ── Charts ── */}
        {showCharts && (
          <div className="space-y-4">

            {/* ── Monthly revenue ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Ingresos por mes</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses</p>
                </div>
                {chartMonthly.some((r) => r.total > 0) && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Total: {formatCurrency(chartMonthly.reduce((s, r) => s + r.total, 0))}
                  </span>
                )}
              </div>
              {chartMonthly.every((r) => r.total === 0) ? (
                <div className="flex items-center justify-center h-40 text-sm text-gray-300 flex-col gap-2">
                  <DollarSign className="w-8 h-8 text-gray-200" />
                  Sin pagos registrados en los últimos 6 meses
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartMonthly} margin={{ top: 22, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={fmtShort} width={48} />
                    <Tooltip
                      cursor={{ fill: '#f0f9ff', radius: 6 }}
                      formatter={(val: number) => [formatCurrency(val), 'Recaudado']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                    <Bar dataKey="total" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={52}>
                      <LabelList dataKey="total" position="top"
                        formatter={(v: number) => v > 0 ? fmtShort(v) : ''}
                        style={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Métodos + Estado ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Methods donut */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Métodos de pago</h3>
                <p className="text-xs text-gray-400 mb-3">Distribución últimos 6 meses</p>
                {chartMethods.length === 0 ? (
                  <div className="flex items-center justify-center h-44 text-sm text-gray-300 flex-col gap-2">
                    <Wallet className="w-8 h-8 text-gray-200" />
                    Sin datos aún
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={chartMethods}
                          dataKey="count"
                          nameKey="method"
                          cx="50%" cy="50%"
                          outerRadius={70}
                          innerRadius={42}
                          paddingAngle={3}
                          labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            if (percent < 0.06) return null;
                            const RADIAN = Math.PI / 180;
                            const r = innerRadius + (outerRadius - innerRadius) * 0.55;
                            const x = cx + r * Math.cos(-midAngle * RADIAN);
                            const y = cy + r * Math.sin(-midAngle * RADIAN);
                            return (
                              <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
                                fontSize={11} fontWeight={700}>
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                        >
                          {chartMethods.map((entry) => (
                            <Cell key={entry.method} fill={METHOD_COLOR[entry.method] ?? '#6b7280'} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number, name: string) => [`${val} pagos`, name]}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Custom legend */}
                    <div className="space-y-1.5">
                      {chartMethods.map((m) => {
                        const total = chartMethods.reduce((s, x) => s + x.count, 0);
                        const pct = total > 0 ? Math.round((m.count / total) * 100) : 0;
                        const color = METHOD_COLOR[m.method] ?? '#6b7280';
                        return (
                          <div key={m.method} className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="flex-1 text-gray-600 truncate">{m.method}</span>
                            <span className="font-semibold text-gray-900">{m.count}</span>
                            <span className="text-gray-400 w-8 text-right">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Status horizontal bars */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Estado de alumnos</h3>
                <p className="text-xs text-gray-400 mb-3">Alumnos activos por estado</p>
                {chartStatus.every((s) => s.count === 0) ? (
                  <div className="flex items-center justify-center h-44 text-sm text-gray-300 flex-col gap-2">
                    <TrendingUp className="w-8 h-8 text-gray-200" />
                    Sin alumnos activos
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {chartStatus.map((s) => {
                      const max = Math.max(...chartStatus.map((x) => x.count), 1);
                      const pct = Math.round((s.count / max) * 100);
                      return (
                        <div key={s.status}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-gray-700">{s.status}</span>
                            <span className="text-sm font-bold" style={{ color: s.color }}>{s.count}</span>
                          </div>
                          <div className="h-7 bg-gray-100 rounded-xl overflow-hidden">
                            <div
                              className="h-full rounded-xl transition-all duration-700 flex items-center justify-end pr-3"
                              style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: s.color + 'cc' }}
                            >
                              {pct >= 20 && (
                                <span className="text-xs font-bold text-white">{s.count}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-400 pt-1 text-right">
                      Total: {chartStatus.reduce((s, x) => s + x.count, 0)} alumnos activos
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ── Students list ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-100 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Buscar alumno..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="ALL">Todos los planes</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {/* Status + method filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {(['ALL','OVERDUE','DUE_SOON','UP_TO_DATE'] as const).map((s) => {
                const labels = { ALL: 'Todos', OVERDUE: 'En mora', DUE_SOON: 'Próx. venc.', UP_TO_DATE: 'Al día' };
                const colors = { ALL: 'bg-gray-900 text-white', OVERDUE: 'bg-red-500 text-white', DUE_SOON: 'bg-amber-500 text-white', UP_TO_DATE: 'bg-emerald-500 text-white' };
                return (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                      filterStatus === s ? colors[s] : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                    )}>{labels[s]}</button>
                );
              })}
              <div className="w-px bg-gray-200 mx-1 self-stretch" />
              <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none bg-white">
                <option value="ALL">Método: Todos</option>
                {['Pago Móvil', 'Transferencia', 'Efectivo USD', 'Efectivo Bs', 'Otro'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* List */}
          {loadingStudents ? (
            <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">Sin resultados</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Alumno</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vencimiento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Último pago</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Método</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <Link href={`/students/${s.id}`}
                            className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                            {s.firstName} {s.lastName}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-500">{s.plan?.name ?? '—'}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={s.paymentStatus} /></td>
                        <td className="px-4 py-3.5 text-sm text-gray-500">
                          {s.nextDueDate ? formatDate(s.nextDueDate) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-500">
                          {s.lastPayment ? (
                            <span>{formatDate(s.lastPayment.paidAt)} · <span className="font-medium text-gray-700">{formatCurrency(s.lastPayment.amount)}</span></span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <MethodPill method={s.lastPayment?.paymentMethod} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => openModal(s)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors">
                              <Plus className="w-3.5 h-3.5" /> Registrar
                            </button>
                            <Link href={`/students/${s.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((s) => (
                  <div key={s.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <Link href={`/students/${s.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-brand-600">
                          {s.firstName} {s.lastName}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{s.plan?.name ?? '—'}</p>
                      </div>
                      <StatusBadge status={s.paymentStatus} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-gray-400 space-y-0.5">
                        {s.nextDueDate && <p>Vence: {formatDate(s.nextDueDate)}</p>}
                        {s.lastPayment && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{formatDate(s.lastPayment.paidAt)} · {formatCurrency(s.lastPayment.amount)}</span>
                            <MethodPill method={s.lastPayment.paymentMethod} />
                          </div>
                        )}
                      </div>
                      <button onClick={() => openModal(s)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-medium hover:bg-brand-700">
                        <Plus className="w-3.5 h-3.5" /> Pago
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer count */}
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} alumno{filtered.length !== 1 ? 's' : ''}{filtered.length !== students.length ? ` de ${students.length}` : ''}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
