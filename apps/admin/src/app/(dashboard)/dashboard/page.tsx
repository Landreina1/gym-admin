'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, UserCheck, AlertCircle, TrendingUp,
  Clock, ArrowDown, ArrowUp, Minus, Scale,
  CreditCard, Calendar, PartyPopper, Plus, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { QuickPaymentModal } from '@/components/payments/QuickPaymentModal';
import { dashboardService } from '@/services/dashboard.service';
import { paymentsService } from '@/services/payments.service';
import { formatDate, cn, formatCurrency } from '@/lib/utils';

// ── Lazy-load charts (no SSR, split bundle) ────────────────────────────────────
const RevenueChart  = dynamic(() => import('./_charts/RevenueChart'),  { ssr: false, loading: () => <ChartSkeleton /> });
const StatusChart   = dynamic(() => import('./_charts/StatusChart'),   { ssr: false, loading: () => <ChartSkeleton /> });

// ── Chart skeleton ─────────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="h-48 flex items-end gap-2 px-2 pb-2 animate-pulse">
      {[40, 65, 45, 80, 55, 90, 60].map((h, i) => (
        <div key={i} className="flex-1 bg-gray-100 rounded-t-lg" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

// ── Full skeleton while loading ────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 w-32 bg-gray-200 rounded-lg" />
        <div className="h-4 w-48 bg-gray-100 rounded-lg" />
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
      </div>
      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="h-72 bg-white rounded-2xl border border-gray-100" />
        <div className="h-72 bg-white rounded-2xl border border-gray-100" />
      </div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
const KPI_CONFIG = {
  blue:   { iconBg: '#f1f5f9', iconColor: '#475569', valueBg: '#e2e8f0', valueColor: '#334155', border: '#e2e8f0' },
  green:  { iconBg: '#f0fdf4', iconColor: '#16a34a', valueBg: '#dcfce7', valueColor: '#15803d', border: '#bbf7d0' },
  red:    { iconBg: '#fef2f2', iconColor: '#E53935', valueBg: '#fee2e2', valueColor: '#C62828', border: '#fecaca' },
  amber:  { iconBg: '#fffbeb', iconColor: '#d97706', valueBg: '#fef3c7', valueColor: '#b45309', border: '#fde68a' },
} as const;

function KpiCard({ title, value, subtitle, icon: Icon, scheme, href }: {
  title: string; value: number; subtitle: string;
  icon: React.ElementType; scheme: keyof typeof KPI_CONFIG; href: string;
}) {
  const c = KPI_CONFIG[scheme];
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: `1px solid ${c.border}`,
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{title}</span>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon style={{ width: 16, height: 16, color: c.iconColor }} />
          </div>
        </div>
        <div>
          <p style={{
            fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em',
            color: c.valueColor, margin: '0 0 4px', lineHeight: 1,
          }}>{value}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Due badge ──────────────────────────────────────────────────────────────────
function DueBadge({ date }: { date?: string }) {
  if (!date) return <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>—</span>;
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  const overdue = diff < 0;
  const soon = diff <= 2;
  const style = overdue
    ? { background: '#fef2f2', color: '#dc2626' }
    : soon
    ? { background: '#fffbeb', color: '#d97706' }
    : { background: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      ...style,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
    }}>
      <Clock style={{ width: 10, height: 10 }} />
      {overdue ? 'Vencido' : soon ? `${diff}d` : formatDate(date)}
    </span>
  );
}

// ── Weight indicator ───────────────────────────────────────────────────────────
function WeightChange({ current, prev, goal }: { current: number; prev?: number; goal?: string }) {
  if (!prev) return <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{current} kg</span>;
  const diff = +(current - prev).toFixed(1);
  const isDown = diff < 0;
  const isGood = (goal === 'LOSE_WEIGHT' && isDown) || (goal === 'GAIN_WEIGHT' && !isDown && diff !== 0);
  const isBad  = (goal === 'LOSE_WEIGHT' && !isDown && diff !== 0) || (goal === 'GAIN_WEIGHT' && isDown);
  const pillStyle = isGood
    ? { background: '#f0fdf4', color: '#16a34a' }
    : isBad
    ? { background: '#fef2f2', color: '#dc2626' }
    : { background: '#f8fafc', color: '#94a3b8' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{current} kg</span>
      <span style={{
        ...pillStyle,
        display: 'inline-flex', alignItems: 'center', gap: 2,
        fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
      }}>
        {isDown ? <ArrowDown style={{ width: 10, height: 10 }} />
          : diff > 0 ? <ArrowUp style={{ width: 10, height: 10 }} />
          : <Minus style={{ width: 10, height: 10 }} />}
        {Math.abs(diff)}
      </span>
    </div>
  );
}

// ── Card wrapper ───────────────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden', className)}>
      {children}
    </div>
  );
}

function CardHeader({ icon, iconBg, title, sub, action }: {
  icon: React.ReactNode; iconBg: string; title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
          {sub && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [payModal, setPayModal] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 60_000,
  });

  const { data: payStats } = useQuery({
    queryKey: ['payment-stats-dashboard'],
    queryFn: paymentsService.getStats,
    staleTime: 5 * 60_000,
  });

  if (isLoading || !data) return <PageSkeleton />;

  const { totals, dueSoon, recentWeightChanges } = data;

  // Últimos 6 meses con relleno en cero
  const now = new Date();
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const label = MONTH_NAMES[d.getMonth()];
    const found = payStats?.monthlyRevenue.find((r) => r.month === key);
    return { label, total: found?.total ?? 0 };
  });

  const statusData = payStats?.statusDistribution ?? [];
  const totalRevenue6m = monthlyRevenue.reduce((s, r) => s + r.total, 0);

  // Progreso por alumno
  const progressByStudent = Object.values(
    recentWeightChanges.reduce<Record<string, typeof recentWeightChanges>>((acc, r) => {
      const key = r.student.firstName + r.student.lastName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {}),
  ).map((recs) => {
    const sorted = [...recs].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    return { current: sorted[sorted.length - 1], prev: sorted[sorted.length - 2] };
  });

  return (
    <div className="space-y-5 animate-slide-up">

      {payModal && <QuickPaymentModal onClose={() => setPayModal(false)} />}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Resumen
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Visión general del gimnasio
          </p>
        </div>
        <button onClick={() => setPayModal(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'var(--brand-600)', color: '#fff',
          fontSize: 12, fontWeight: 600,
          boxShadow: '0 2px 8px rgba(229,57,53,0.25)',
        }}>
          <Plus style={{ width: 14, height: 14 }} />
          Registrar pago
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total alumnos"  value={totals.total}    subtitle="en el sistema"                     icon={Users}       scheme="blue"  href="/students" />
        <KpiCard title="Activos"        value={totals.active}   subtitle={`${totals.inactive} inactivo${totals.inactive !== 1 ? 's' : ''}`} icon={UserCheck}   scheme="green" href="/students" />
        <KpiCard title="Al día"         value={totals.upToDate} subtitle="pagos vigentes"                    icon={CreditCard}  scheme="green" href="/payments" />
        <KpiCard title="En mora"        value={totals.overdue}  subtitle="requieren atención"                icon={AlertCircle} scheme="red"   href="/payments" />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">

        {/* Revenue line chart */}
        <Card>
          <CardHeader
            icon={<TrendingUp style={{ width: 15, height: 15, color: '#E53935' }} />}
            iconBg="#eff6ff"
            title="Ingresos por mes"
            sub="Últimos 6 meses"
            action={totalRevenue6m > 0 ? (
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#16a34a',
                background: '#f0fdf4', padding: '3px 10px', borderRadius: 99,
              }}>
                {formatCurrency(totalRevenue6m)} total
              </span>
            ) : undefined}
          />
          <div style={{ padding: '16px 12px 8px' }}>
            <RevenueChart data={monthlyRevenue} />
          </div>
        </Card>

        {/* Status donut */}
        <Card>
          <CardHeader
            icon={<Users style={{ width: 15, height: 15, color: '#7c3aed' }} />}
            iconBg="#f5f3ff"
            title="Estado de alumnos"
            sub="Distribución actual"
          />
          <div style={{ padding: '12px 8px 8px' }}>
            <StatusChart data={statusData} total={totals.active + totals.overdue} />
          </div>
        </Card>
      </div>

      {/* ── Lists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

        {/* Due soon */}
        <Card>
          <CardHeader
            icon={<Calendar style={{ width: 15, height: 15, color: '#d97706' }} />}
            iconBg="#fffbeb"
            title="Pagos próximos a vencer"
            sub="Próximos 3 días"
            action={
              <Link href="/students" style={{
                fontSize: 11, fontWeight: 600, color: 'var(--brand-600)',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2,
              }}>
                Ver todos <ChevronRight style={{ width: 12, height: 12 }} />
              </Link>
            }
          />

          {dueSoon.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '40px 24px', textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <PartyPopper style={{ width: 26, height: 26, color: '#16a34a' }} />
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#15803d' }}>
                ¡Todo al día!
              </p>
              <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 220 }}>
                No hay pagos próximos a vencer en los próximos 3 días.
              </p>
              <button onClick={() => setPayModal(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'var(--brand-600)', color: '#fff',
                fontSize: 12, fontWeight: 600,
                boxShadow: '0 2px 8px rgba(229,57,53,0.2)',
              }}>
                <Plus style={{ width: 13, height: 13 }} />
                Registrar pago
              </button>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                gap: 12, padding: '8px 20px',
                background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
              }}>
                {['Alumno','Plan','Vence','Estado'].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                ))}
              </div>
              {dueSoon.map((student) => (
                <Link
                  key={student.id}
                  href={`/students/${student.id}`}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                    gap: 12, alignItems: 'center', padding: '12px 20px',
                    textDecoration: 'none', borderBottom: '1px solid #f8fafc',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {student.firstName} {student.lastName}
                    </p>
                    {student.email && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{student.email}</p>}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{student.plan?.name ?? '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {student.nextDueDate ? formatDate(student.nextDueDate) : '—'}
                  </span>
                  <DueBadge date={student.nextDueDate?.toString()} />
                </Link>
              ))}
            </>
          )}
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader
            icon={<Scale style={{ width: 15, height: 15, color: '#7c3aed' }} />}
            iconBg="#f5f3ff"
            title="Actividad reciente"
            sub="Últimos pesos registrados"
          />
          {recentWeightChanges.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '40px 16px', textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16,
                background: '#f8fafc', display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 12,
              }}>
                <Scale style={{ width: 22, height: 22, color: '#cbd5e1' }} />
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Sin actividad
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                Los registros de peso aparecerán aquí
              </p>
            </div>
          ) : (
            <div>
              {recentWeightChanges.slice(0, 6).map((record) => (
                <div key={record.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 20px', borderBottom: '1px solid #f8fafc',
                  transition: 'background 0.1s', cursor: 'default',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 99,
                    background: '#f5f3ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Scale style={{ width: 13, height: 13, color: '#7c3aed' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.student.firstName} {record.student.lastName}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDate(record.recordedAt)}
                    </p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>
                    {record.weight} kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Progress table ── */}
      {progressByStudent.length > 0 && (
        <Card>
          <CardHeader
            icon={<TrendingUp style={{ width: 15, height: 15, color: '#E53935' }} />}
            iconBg="#eff6ff"
            title="Progreso de alumnos"
            sub="Último registro vs anterior"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 1, background: '#f1f5f9' }}>
            {progressByStudent.map(({ current, prev }) => (
              <Link
                key={current.id}
                href={`/students/${current.studentId}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#fff', padding: '14px 20px', textDecoration: 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {current.student.firstName} {current.student.lastName}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {formatDate(current.recordedAt)}
                  </p>
                </div>
                <WeightChange current={current.weight} prev={prev?.weight} />
              </Link>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}
