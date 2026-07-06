'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { QuickPaymentModal } from '@/components/payments/QuickPaymentModal';
import { dashboardService } from '@/services/dashboard.service';
import { paymentsService } from '@/services/payments.service';
import { formatCurrency } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_LONG = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buen día';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

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

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ height: 60, width: 340, background: '#f0ece6', borderRadius: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
        <div style={{ gridRow: 'span 2', height: 340, background: '#f0ece6', borderRadius: 22 }} />
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: 162, background: '#fff', border: '1px solid #eae6e0', borderRadius: 22 }} />)}
      </div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ background: '#fff', border: '1px solid #eae6e0', borderRadius: 22, boxShadow: '0 2px 10px rgba(26,26,26,0.03)', ...style }}>
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [payModal, setPayModal] = useState(false);
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    const raw = localStorage.getItem('gym_user');
    if (raw) { try { setUserName(JSON.parse(raw).name?.split(' ')[0] ?? 'Admin'); } catch {} }
  }, []);

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

  const now = new Date();
  const dateLabel = `${DAYS[now.getDay()]} ${now.getDate()} de ${MONTHS_LONG[now.getMonth()]}`;

  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const found = payStats?.monthlyRevenue.find((r) => r.month === key);
    return { label: MONTHS[d.getMonth()], total: found?.total ?? 0 };
  });
  const maxRev = Math.max(...monthlyRevenue.map((m) => m.total), 1);

  const currentMonthRevenue = payStats?.kpis?.revenueThisMonth ?? 0;
  const prevMonthRevenue    = monthlyRevenue[4]?.total ?? 0;
  const revenueChange = prevMonthRevenue > 0
    ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : null;

  const overdueStudents = dueSoon.filter((s) => s.isOverdue);
  const upPct   = totals.active > 0 ? Math.round((totals.upToDate / totals.active) * 100) : 0;
  const overPct = totals.active > 0 ? Math.round((totals.overdue / totals.active) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {payModal && <QuickPaymentModal onClose={() => setPayModal(false)} />}

      {/* ── Saludo ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#a39a8e', textTransform: 'capitalize' }}>{dateLabel}</div>
          <h1 className="ec-h1 !text-[25px] md:!text-[40px]">
            {greeting()}, {userName} 👋
          </h1>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Link href="/students/new" className="ec-btn-ghost">+ Nuevo alumno</Link>
          <button onClick={() => setPayModal(true)} className="ec-btn-primary">Registrar pago</button>
        </div>
      </div>

      {/* ── Alerta de mora ── */}
      {overdueStudents.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #f3ddda', borderRadius: 18, padding: '18px 24px', boxShadow: '0 2px 10px rgba(26,26,26,0.03)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fdeeed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div className="ec-pulse" style={{ width: 9, height: 9, borderRadius: '50%', background: '#E53935' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{overdueStudents.length} alumno{overdueStudents.length !== 1 ? 's' : ''} con pagos vencidos</div>
            <div style={{ fontSize: 13, color: '#a39a8e' }}>Requieren cobro inmediato para no perder el mes</div>
          </div>
          <button onClick={() => setPayModal(true)} className="ec-btn-dark">Cobrar ahora</button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">

        {/* Tarjeta oscura: ingresos del mes */}
        <div className="col-span-2 lg:col-span-1 lg:row-span-2" style={{ background: '#1a1a1a', borderRadius: 22, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>Ingresos del mes</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {revenueChange !== null && (
                <div style={{ padding: '4px 10px', borderRadius: 99, background: revenueChange >= 0 ? 'rgba(74,222,128,0.16)' : 'rgba(229,57,53,0.18)', fontSize: 11.5, fontWeight: 700, color: revenueChange >= 0 ? '#4ade80' : '#ff8a87' }}>
                  {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange)}%
                </div>
              )}
              <div style={{ padding: '5px 12px', borderRadius: 99, background: 'rgba(229,57,53,0.18)', fontSize: 11.5, fontWeight: 700, color: '#ff8a87' }}>{MONTHS[now.getMonth()]}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="text-[38px] md:text-[48px]" style={{ fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{formatCurrency(currentMonthRevenue)}</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)' }}>{payStats?.kpis?.paidThisMonth ?? 0} pagos recibidos este mes</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 108 }}>
            {monthlyRevenue.map((m, i) => {
              const isCurrent = i === monthlyRevenue.length - 1;
              const h = Math.max(8, Math.round((m.total / maxRev) * 78));
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: isCurrent ? '#ff8a87' : 'rgba(255,255,255,0.4)' }}>
                    ${(m.total / 1000).toFixed(1)}k
                  </div>
                  <div style={{ width: '100%', height: h, background: isCurrent ? '#E53935' : 'rgba(255,255,255,0.14)', borderRadius: 6 }} />
                  <div style={{ fontSize: 10, fontWeight: 600, color: isCurrent ? '#ff8a87' : 'rgba(255,255,255,0.35)' }}>{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total alumnos */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }} className="p-[18px] md:p-6">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a39a8e' }}>Total alumnos</div>
          <div className="flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2.5">
            <div className="text-[28px] md:text-[38px]" style={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{totals.total}</div>
            <div style={{ fontSize: 12.5, color: '#a39a8e' }}>en el sistema</div>
          </div>
        </Card>

        {/* Activos */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }} className="p-[18px] md:p-6">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a39a8e' }}>Activos</div>
          <div className="flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2.5">
            <div className="text-[28px] md:text-[38px]" style={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{totals.active}</div>
            <div style={{ fontSize: 12.5, color: '#a39a8e' }}>{totals.inactive} inactivo{totals.inactive !== 1 ? 's' : ''}</div>
          </div>
        </Card>

        {/* Al día */}
        <Card style={{ borderColor: '#d8eede', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }} className="p-[18px] md:p-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#a39a8e' }}>Al día</div>
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2.5">
            <div className="text-[28px] md:text-[38px]" style={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: '#16a34a' }}>{totals.upToDate}</div>
            <div style={{ fontSize: 12.5, color: '#a39a8e' }}>{upPct}% del total</div>
          </div>
        </Card>

        {/* En mora */}
        <div className="p-[18px] md:p-6" style={{ background: '#fdeeed', border: '1px solid #f3ddda', borderRadius: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="ec-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#E53935' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#c2554f' }}>En mora</div>
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2.5">
            <div className="text-[28px] md:text-[38px]" style={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: '#E53935' }}>{totals.overdue}</div>
            <div style={{ fontSize: 12.5, color: '#c2554f' }}>{overPct}% del total</div>
          </div>
        </div>
      </div>

      {/* ── Fila inferior ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">

        {/* Próximos pagos a vencer */}
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px 16px' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Próximos pagos a vencer</div>
            <Link href="/payments" style={{ fontSize: 13, fontWeight: 600, color: '#E53935' }}>Ver todos →</Link>
          </div>
          {dueSoon.length === 0 ? (
            <div style={{ padding: '32px 26px 40px', textAlign: 'center', color: '#a39a8e', fontSize: 13.5 }}>¡Todo al día! No hay pagos próximos a vencer 🎉</div>
          ) : (
            <div>
              {dueSoon.slice(0, 7).map((s) => {
                const dateStr = s.nextDueDate?.toString();
                const daysLeft = dateStr ? Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000) : null;
                const isOver = s.isOverdue || (daysLeft !== null && daysLeft < 0);
                const initials = `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase();
                return (
                  <Link key={s.id} href={`/students/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 26px', borderTop: '1px solid #f6f3ef', textDecoration: 'none', color: 'inherit', transition: 'background 0.12s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fcfbf9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: isOver ? '#fdeeed' : '#f0ece6', color: isOver ? '#E53935' : '#6b6258', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.firstName} {s.lastName}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#a39a8e' }}>{s.plan?.name ?? '—'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isOver ? '#E53935' : '#6b6258' }}>{dateStr ? fmtDate(dateStr) : '—'}</div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 2, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: isOver ? '#fdeeed' : '#e9f6ee', color: isOver ? '#E53935' : '#16a34a' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOver ? '#E53935' : '#16a34a' }} />
                        {isOver ? 'Vencido' : daysLeft === 0 ? 'Hoy' : `${daysLeft}d`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Estado de alumnos + actividad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Estado de alumnos</div>
            <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', background: '#f0ece6' }}>
              {upPct > 0 && <div style={{ width: `${upPct}%`, background: '#16a34a' }} />}
              {overPct > 0 && <div style={{ width: `${overPct}%`, background: '#E53935' }} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ width: 9, height: 9, borderRadius: 3, background: '#16a34a' }} /><div style={{ fontSize: 13.5, color: '#6b6258' }}>Al día <strong style={{ color: '#1a1a1a' }}>{totals.upToDate}</strong></div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ width: 9, height: 9, borderRadius: 3, background: '#E53935' }} /><div style={{ fontSize: 13.5, color: '#6b6258' }}>En mora <strong style={{ color: '#E53935' }}>{totals.overdue}</strong></div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ width: 9, height: 9, borderRadius: 3, background: '#d8d2c9' }} /><div style={{ fontSize: 13.5, color: '#6b6258' }}>Inactivos <strong style={{ color: '#1a1a1a' }}>{totals.inactive}</strong></div></div>
            </div>
          </Card>

          <Card style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Actividad reciente</div>
            {recentWeightChanges.length === 0 ? (
              <div style={{ fontSize: 13, color: '#a39a8e' }}>Sin actividad todavía</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {recentWeightChanges.slice(0, 5).map((r) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: '#f0ece6', color: '#6b6258', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                      {r.student.firstName[0]}{r.student.lastName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.student.firstName} {r.student.lastName}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#a39a8e' }}>Peso → <strong style={{ color: '#6b6258' }}>{r.weight} kg</strong></p>
                    </div>
                    <span style={{ fontSize: 11, color: '#c4bcb0', flexShrink: 0 }}>{timeAgo(r.recordedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

    </div>
  );
}
