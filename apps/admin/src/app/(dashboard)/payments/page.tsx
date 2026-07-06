'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, DollarSign, Plus,
  Search, ChevronRight, Wallet, Download,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { paymentsService } from '@/services/payments.service';
import { Toast } from '@/components/ui/Toast';
import { PaymentFlowModal } from '@/components/payments/PaymentFlowModal';
import { QuickPaymentModal } from '@/components/payments/QuickPaymentModal';
import { formatDate, formatCurrency } from '@/lib/utils';
import { exportPdf } from '@/lib/export';
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

function Dot({ c }: { c: string }) { return <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />; }

function StatusBadge({ status }: { status: StudentForPayments['paymentStatus'] }) {
  if (status === 'OVERDUE')  return <span className="ec-badge" style={{ background: '#fdeeed', color: '#E53935' }}><Dot c="#E53935" />En mora</span>;
  if (status === 'DUE_SOON') return <span className="ec-badge" style={{ background: '#fdf4e7', color: '#b45309' }}><Dot c="#d97706" />Próx. venc.</span>;
  if (status === 'PARTIAL')  return <span className="ec-badge" style={{ background: '#fdf4e7', color: '#b45309' }}><Dot c="#d97706" />Pago parcial</span>;
  return <span className="ec-badge" style={{ background: '#e9f6ee', color: '#16a34a' }}><Dot c="#16a34a" />Al día</span>;
}

function MethodPill({ method }: { method: string | null | undefined }) {
  if (!method) return <span className="text-xs text-[#c4bcb0]">—</span>;
  return (
    <span style={{ display: 'inline-flex', padding: '5px 12px', borderRadius: 99, background: '#f0ece6', fontSize: 12, fontWeight: 600, color: '#6b6258' }}>
      {method}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<StudentForPayments | null>(null);
  const [quickPayModal, setQuickPayModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE'>('ALL');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [showCharts, setShowCharts] = useState(false);

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

  const STATUS_LABELS: Record<string, string> = {
    UP_TO_DATE: 'Al día', OVERDUE: 'En mora',
    DUE_SOON: 'Próx. venc.', PARTIAL: 'Pago parcial',
  };

  const handleExport = () => {
    const n = new Date();
    const dateStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    exportPdf({
      title: 'Registro de Pagos',
      filename: `Pagos_Gym_El_Cuba_${dateStr}.pdf`,
      headers: ['Nombre', 'Apellido', 'Plan', 'Estado', 'Próximo cobro', 'Saldo pendiente', 'Último pago', 'Monto', 'Método'],
      rows: filtered.map((s) => [
        s.firstName,
        s.lastName,
        s.plan?.name ?? '—',
        STATUS_LABELS[s.paymentStatus ?? ''] ?? '—',
        s.nextDueDate ? s.nextDueDate.toString().slice(0, 10) : '—',
        s.pendingBalance ? `$${Number(s.pendingBalance).toFixed(2)}` : '—',
        s.lastPayment?.paidAt ? s.lastPayment.paidAt.slice(0, 10) : '—',
        s.lastPayment?.amount ? `$${Number(s.lastPayment.amount).toFixed(2)}` : '—',
        s.lastPayment?.paymentMethod ?? '—',
      ]),
    });
  };

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
      {quickPayModal && <QuickPaymentModal onClose={() => setQuickPayModal(false)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header ── */}
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex flex-col gap-2">
            <div className="ec-eyebrow">Cobros y vencimientos</div>
            <h1 className="ec-h1 !text-[30px] md:!text-[40px]">Pagos</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowCharts((v) => !v)} className="ec-btn-ghost hidden sm:inline-flex">
              {showCharts ? 'Ocultar gráficas' : 'Ver gráficas'}
            </button>
            <button onClick={handleExport} disabled={filtered.length === 0} className="ec-btn-ghost disabled:opacity-40">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
            <button onClick={() => setQuickPayModal(true)} className="ec-btn-primary flex-1 sm:flex-none">
              <Plus className="w-4 h-4" />
              Registrar pago
            </button>
          </div>
        </div>

        {/* ── 3 tarjetas resumen ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr] gap-3 md:gap-4">
          {/* Ingresos (oscura) */}
          <div style={{ background: '#1a1a1a', borderRadius: 22, padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: 14, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>Ingresos del mes</div>
              <div style={{ padding: '5px 12px', borderRadius: 99, background: 'rgba(229,57,53,0.18)', fontSize: 11.5, fontWeight: 700, color: '#ff8a87' }}>{MONTH_NAMES[new Date().getMonth()]}</div>
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{stats ? formatCurrency(stats.kpis.revenueThisMonth) : '—'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{stats?.kpis.paidThisMonth ?? 0} pagos recibidos este mes</div>
          </div>
          {/* Al día (verde) */}
          <div className="ec-card" style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Dot c="#16a34a" /><div style={{ fontSize: 13, fontWeight: 600, color: '#a39a8e' }}>Al día</div></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: '#16a34a' }}>{chartStatus.find((s) => s.status === 'Al día')?.count ?? 0}</div>
              <div style={{ fontSize: 12.5, color: '#a39a8e' }}>alumnos con pago vigente</div>
            </div>
          </div>
          {/* En mora (roja) */}
          <div style={{ background: '#fdeeed', border: '1px solid #f3ddda', borderRadius: 22, padding: '26px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="ec-pulse"><Dot c="#E53935" /></span><div style={{ fontSize: 13, fontWeight: 600, color: '#c2554f' }}>En mora</div></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: '#E53935' }}>{stats?.kpis.overdue ?? 0}</div>
              <div style={{ fontSize: 12.5, color: '#c2554f' }}>requieren cobro</div>
            </div>
          </div>
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

        {/* ── Tabs segmentadas + buscador ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="ec-seg-scroll" style={{ display: 'flex', gap: 6, background: '#f0ece6', borderRadius: 99, padding: 4, maxWidth: '100%', overflowX: 'auto' }}>
            {(['ALL','OVERDUE','DUE_SOON','UP_TO_DATE'] as const).map((s) => {
              const labels = { ALL: 'Todos', OVERDUE: 'En mora', DUE_SOON: 'Próx. venc.', UP_TO_DATE: 'Al día' };
              const active = filterStatus === s;
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{ height: 38, padding: '0 16px', border: 'none', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, background: active ? '#fff' : 'transparent', color: active ? '#1a1a1a' : '#6b6258', boxShadow: active ? '0 1px 4px rgba(26,26,26,0.08)' : 'none', transition: 'all .15s' }}>
                  {labels[s]}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-[240px]">
              <Search className="absolute left-[18px] top-1/2 -translate-y-1/2 w-4 h-4 text-[#a39a8e] pointer-events-none" />
              <input type="text" placeholder="Buscar alumno…" value={search} onChange={(e) => setSearch(e.target.value)} className="ec-field w-full pl-[46px]" style={{ height: 46 }} />
            </div>
            <div className="relative flex-shrink-0">
              <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="ec-select" style={{ height: 46 }}>
                <option value="ALL">Plan: todos</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronRight className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a39a8e] rotate-90" />
            </div>
          </div>
        </div>

        {/* ── Students list ── */}
        <div className="ec-card overflow-hidden">

          {/* List */}
          {loadingStudents ? (
            <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">Sin resultados</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fcfbf9', borderBottom: '1px solid #f0ece6' }}>
                      {['Alumno','Plan','Estado','Vencimiento','Último pago','Método',''].map((h) => (
                        <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a39a8e', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const initials = `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase();
                      const mora = s.paymentStatus === 'OVERDUE';
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f6f3ef', transition: 'background 0.12s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fcfbf9')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '15px 20px' }}>
                            <Link href={`/students/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, background: mora ? '#fdeeed' : '#f0ece6', color: mora ? '#E53935' : '#6b6258' }}>{initials}</div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{s.firstName} {s.lastName}</span>
                            </Link>
                          </td>
                          <td style={{ padding: '15px 20px', fontSize: 13.5, color: '#6b6258' }}>{s.plan?.name ?? '—'}</td>
                          <td style={{ padding: '15px 20px' }}><StatusBadge status={s.paymentStatus} /></td>
                          <td style={{ padding: '15px 20px', fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: mora ? '#E53935' : '#6b6258' }}>{s.nextDueDate ? formatDate(s.nextDueDate) : '—'}</td>
                          <td style={{ padding: '15px 20px', fontSize: 13, color: '#6b6258' }}>
                            {s.lastPayment ? <span>{formatDate(s.lastPayment.paidAt)} · <strong style={{ color: '#1a1a1a', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(s.lastPayment.amount)}</strong></span> : '—'}
                          </td>
                          <td style={{ padding: '15px 20px' }}><MethodPill method={s.lastPayment?.paymentMethod} /></td>
                          <td style={{ padding: '15px 20px' }}>
                            <button onClick={() => openModal(s)} className="ec-btn-dark" style={{ height: 34, fontSize: 12.5 }}>
                              <Plus className="w-3.5 h-3.5" /> Registrar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden">
                {filtered.map((s) => (
                  <div key={s.id} className="p-4" style={{ borderTop: '1px solid #f6f3ef' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <Link href={`/students/${s.id}`} className="text-sm font-bold text-[#1a1a1a]">
                          {s.firstName} {s.lastName}
                        </Link>
                        <p className="text-xs text-[#a39a8e] mt-0.5">{s.plan?.name ?? '—'}</p>
                      </div>
                      <StatusBadge status={s.paymentStatus} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-[#a39a8e] space-y-0.5">
                        {s.nextDueDate && <p>Vence: {formatDate(s.nextDueDate)}</p>}
                        {s.lastPayment && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{formatDate(s.lastPayment.paidAt)} · {formatCurrency(s.lastPayment.amount)}</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => openModal(s)} className="ec-btn-dark flex-shrink-0" style={{ height: 36 }}>
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
            <div style={{ padding: '16px 26px', background: '#fcfbf9', fontSize: 13, color: '#a39a8e' }}>
              Mostrando {filtered.length} alumno{filtered.length !== 1 ? 's' : ''}{filtered.length !== students.length ? ` de ${students.length}` : ''}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
