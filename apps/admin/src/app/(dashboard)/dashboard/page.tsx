'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, UserCheck, AlertCircle, TrendingUp, DollarSign,
  Clock, CreditCard, Calendar, PartyPopper, ChevronRight,
  ArrowUp, ArrowDown, AlertTriangle, Activity, UserPlus,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { QuickPaymentModal } from '@/components/payments/QuickPaymentModal';
import { dashboardService } from '@/services/dashboard.service';
import { paymentsService } from '@/services/payments.service';
import { formatDate, formatCurrency } from '@/lib/utils';

const RevenueChart = dynamic(() => import('./_charts/RevenueChart'), { ssr: false, loading: () => <ChartSkeleton /> });
const StatusChart  = dynamic(() => import('./_charts/StatusChart'),  { ssr: false, loading: () => <ChartSkeleton /> });

function ChartSkeleton() {
  return (
    <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 12px 8px', opacity: 0.5 }}>
      {[40, 65, 45, 80, 55, 90, 60].map((h, i) => (
        <div key={i} style={{ flex: 1, background: '#e2e8f0', borderRadius: '4px 4px 0 0', height: `${h}%` }} />
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 28, width: 120, background: '#e2e8f0', borderRadius: 8 }} />
          <div style={{ height: 14, width: 180, background: '#f1f5f9', borderRadius: 8 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ height: 38, width: 130, background: '#f1f5f9', borderRadius: 10 }} />
          <div style={{ height: 38, width: 140, background: '#fee2e2', borderRadius: 10 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[...Array(5)].map((_, i) => <div key={i} style={{ height: 110, background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        <div style={{ height: 200, background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9' }} />
        <div style={{ height: 200, background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div style={{ height: 280, background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9' }} />
        <div style={{ height: 280, background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9' }} />
      </div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, valueColor, border, change, href }: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string; iconColor: string; valueColor: string; border: string;
  change?: { pct: number; label: string } | null;
  href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{ background: '#fff', borderRadius: 16, border: `1px solid ${border}`, padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 15, height: 15, color: iconColor }} />
          </div>
        </div>
        <div>
          <p style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: valueColor, margin: '0 0 5px', lineHeight: 1 }}>{value}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{subtitle}</p>
            {change != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: change.pct >= 0 ? '#f0fdf4' : '#fef2f2', color: change.pct >= 0 ? '#16a34a' : '#dc2626' }}>
                {change.pct >= 0 ? <ArrowUp style={{ width: 8, height: 8 }} /> : <ArrowDown style={{ width: 8, height: 8 }} />}
                {Math.abs(change.pct)}% {change.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, iconBg, title, sub, action }: {
  icon: React.ReactNode; iconBg: string; title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>{title}</p>
          {sub && <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ── Time ago ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'Ahora mismo';
  if (m < 60) return `Hace ${m} min`;
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${d}d`;
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

  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const now = new Date();
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const found = payStats?.monthlyRevenue.find((r) => r.month === key);
    return { label: MONTHS[d.getMonth()], total: found?.total ?? 0 };
  });

  const statusData = payStats?.statusDistribution ?? [];
  const currentMonthRevenue = payStats?.kpis?.revenueThisMonth ?? 0;
  const prevMonthRevenue    = monthlyRevenue[4]?.total ?? 0;
  const revenueChange = prevMonthRevenue > 0
    ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : null;

  const overdueStudents  = dueSoon.filter((s) => s.isOverdue);
  const dueSoonStudents  = dueSoon.filter((s) => !s.isOverdue);

  return (
    <div className="space-y-5 animate-slide-up">
      {payModal && <QuickPaymentModal onClose={() => setPayModal(false)} />}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Resumen</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6B7280' }}>Visión general del gimnasio</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/students/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}>
            <UserPlus style={{ width: 14, height: 14 }} />
            Nuevo alumno
          </Link>
          <button onClick={() => setPayModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(239,68,68,0.28)' }}>
            <CreditCard style={{ width: 14, height: 14 }} />
            Registrar pago
          </button>
        </div>
      </div>

      {/* ── 5 KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          title="Total alumnos" value={totals.total} subtitle="en el sistema"
          icon={Users} iconBg="#f1f5f9" iconColor="#475569" valueColor="#1e293b" border="#E2E8F0"
          href="/students"
        />
        <KpiCard
          title="Activos" value={totals.active} subtitle={`${totals.inactive} inactivo${totals.inactive !== 1 ? 's' : ''}`}
          icon={UserCheck} iconBg="#f0fdf4" iconColor="#16a34a" valueColor="#15803d" border="#bbf7d0"
          href="/students"
        />
        <KpiCard
          title="Al día" value={totals.upToDate} subtitle="pagos vigentes"
          icon={CheckCircle2} iconBg="#f0fdf4" iconColor="#16a34a" valueColor="#15803d" border="#bbf7d0"
          href="/payments"
        />
        <KpiCard
          title="En mora" value={totals.overdue} subtitle="requieren atención"
          icon={AlertCircle} iconBg="#fef2f2" iconColor="#EF4444" valueColor="#dc2626" border="#fecaca"
          href="/payments"
        />
        <KpiCard
          title="Ingresos del mes" value={formatCurrency(currentMonthRevenue)} subtitle="recaudado este mes"
          icon={DollarSign} iconBg="#eff6ff" iconColor="#3b82f6" valueColor="#1d4ed8" border="#bfdbfe"
          change={revenueChange !== null ? { pct: revenueChange, label: 'vs mes ant.' } : null}
          href="/payments"
        />
      </div>

      {/* ── Alert banner ── */}
      {(overdueStudents.length > 0 || dueSoonStudents.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {overdueStudents.length > 0 && (
            <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle style={{ width: 14, height: 14, color: '#dc2626' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#991b1b' }}>
                  {overdueStudents.length} alumno{overdueStudents.length !== 1 ? 's' : ''} con pagos vencidos
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#b91c1c' }}>Requieren cobro inmediato</p>
              </div>
            </div>
          )}
          {dueSoonStudents.length > 0 && (
            <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock style={{ width: 14, height: 14, color: '#d97706' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                  {dueSoonStudents.length} pago{dueSoonStudents.length !== 1 ? 's' : ''} vencen pronto
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#b45309' }}>En los próximos 3 días</p>
              </div>
              <Link href="/payments" style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#d97706', color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                Ver
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

        <Card>
          <CardHeader
            icon={<TrendingUp style={{ width: 14, height: 14, color: '#3b82f6' }} />}
            iconBg="#eff6ff"
            title="Ingresos mensuales"
            sub="Últimos 6 meses"
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {revenueChange !== null && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: revenueChange >= 0 ? '#f0fdf4' : '#fef2f2', color: revenueChange >= 0 ? '#16a34a' : '#dc2626' }}>
                    {revenueChange >= 0 ? <ArrowUp style={{ width: 9, height: 9 }} /> : <ArrowDown style={{ width: 9, height: 9 }} />}
                    {Math.abs(revenueChange)}% vs mes ant.
                  </span>
                )}
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '3px 10px', borderRadius: 99 }}>
                  {formatCurrency(monthlyRevenue.reduce((s, r) => s + r.total, 0))} total
                </span>
              </div>
            }
          />
          <div style={{ padding: '10px 8px 4px' }}>
            <RevenueChart data={monthlyRevenue} height={120} />
          </div>
        </Card>

        <Card style={{ overflow: 'visible' }}>
          <CardHeader
            icon={<Activity style={{ width: 14, height: 14, color: '#7c3aed' }} />}
            iconBg="#f5f3ff"
            title="Estado de alumnos"
            sub="Distribución actual"
          />
          <StatusChart data={statusData} total={totals.active + totals.overdue} />
        </Card>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

        {/* Due payments table */}
        <Card>
          <CardHeader
            icon={<Calendar style={{ width: 14, height: 14, color: '#d97706' }} />}
            iconBg="#fffbeb"
            title="Próximos pagos a vencer"
            sub={`${dueSoon.length} alumno${dueSoon.length !== 1 ? 's' : ''} · vencidos y próximos 3 días`}
            action={
              <Link href="/payments" style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                Ver todos <ChevronRight style={{ width: 12, height: 12 }} />
              </Link>
            }
          />

          {dueSoon.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 24px', textAlign: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <PartyPopper style={{ width: 24, height: 24, color: '#16a34a' }} />
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#15803d' }}>¡Todo al día!</p>
              <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>No hay pagos próximos a vencer</p>
            </div>
          ) : (
            <>
              {/* Table head */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px 58px 80px 116px', gap: 8, padding: '8px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['Alumno','Plan','Vencimiento','Días','Estado',''].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>

              {dueSoon.slice(0, 8).map((student) => {
                const dateStr = student.nextDueDate?.toString();
                const daysLeft = dateStr ? Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000) : null;
                const isOver = student.isOverdue || (daysLeft !== null && daysLeft < 0);
                const isSoon = !isOver && daysLeft !== null && daysLeft <= 3;
                return (
                  <div key={student.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px 58px 80px 116px', gap: 8, padding: '11px 20px', borderBottom: '1px solid #f8fafc', alignItems: 'center', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Link href={`/students/${student.id}`} style={{ textDecoration: 'none' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.firstName} {student.lastName}</p>
                      {student.email && <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</p>}
                    </Link>
                    <span style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.plan?.name ?? '—'}</span>
                    <span style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>{dateStr ? formatDate(dateStr) : '—'}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isOver ? '#dc2626' : isSoon ? '#d97706' : '#374151' }}>
                      {daysLeft !== null ? (daysLeft < 0 ? `${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Hoy' : `${daysLeft}d`) : '—'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: isOver ? '#fef2f2' : isSoon ? '#fffbeb' : '#f0fdf4', color: isOver ? '#dc2626' : isSoon ? '#d97706' : '#16a34a' }}>
                      <Clock style={{ width: 8, height: 8 }} />
                      {isOver ? 'Vencido' : isSoon ? 'Pronto' : 'Al día'}
                    </span>
                    <button onClick={() => setPayModal(true)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isOver ? '#EF4444' : '#f1f5f9', color: isOver ? '#fff' : '#374151', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: isOver ? '0 2px 6px rgba(239,68,68,0.25)' : 'none', transition: 'opacity 0.15s' }}>
                      Registrar pago
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader
            icon={<Activity style={{ width: 14, height: 14, color: '#7c3aed' }} />}
            iconBg="#f5f3ff"
            title="Actividad reciente"
            sub="Últimos movimientos"
          />
          {recentWeightChanges.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 16px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Activity style={{ width: 20, height: 20, color: '#CBD5E1' }} />
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Sin actividad</p>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Los movimientos aparecerán aquí</p>
            </div>
          ) : (
            <div>
              {recentWeightChanges.slice(0, 8).map((record, i) => (
                <div key={record.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: i < Math.min(recentWeightChanges.length, 8) - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 99, flexShrink: 0, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed' }}>
                      {record.student.firstName[0]}{record.student.lastName[0]}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.student.firstName} {record.student.lastName}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
                      Peso actualizado → <strong style={{ color: '#374151' }}>{record.weight} kg</strong>
                    </p>
                  </div>
                  <span style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {timeAgo(record.recordedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
