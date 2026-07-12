'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Search, CreditCard, User, RefreshCw, AlertCircle } from 'lucide-react';
import { studentsService } from '@/services/students.service';
import { paymentsService } from '@/services/payments.service';
import { PendingDecisionModal } from './PendingDecisionModal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { Student } from '@/types';

const METHODS = ['Pago Móvil', 'Transferencia', 'Efectivo USD', 'Efectivo Bs', 'Otro'];
const BS_METHODS = ['Pago Móvil', 'Transferencia', 'Efectivo Bs'];

function isBs(method: string) { return BS_METHODS.includes(method); }

interface Props { onClose: () => void; onSuccess?: () => void }

type PendingDecision = 'complete' | 'abono';

export function QuickPaymentModal({ onClose, onSuccess }: Props) {
  useBodyScrollLock(true);
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [tab,             setTab]            = useState<'full' | 'partial'>('full');
  const [query,           setQuery]          = useState('');
  const [student,         setStudent]        = useState<Student | null>(null);
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  const [showDecision,    setShowDecision]   = useState(false);
  const [method,     setMethod]     = useState('Pago Móvil');
  const [bcvRate,    setBcvRate]    = useState('');
  const [loadingBcv, setLoadingBcv] = useState(false);
  const [amount,     setAmount]     = useState(''); // Bs si isBs(method), USD si no
  const [paidAt,     setPaidAt]     = useState(today);
  const [notes,      setNotes]      = useState('');
  const [error,      setError]      = useState('');

  const planPrice = student ? Number(student.plan?.price ?? 0) : 0;
  const showBs = isBs(method);

  const { data: studentsData } = useQuery({
    queryKey: ['students-all'],
    queryFn: () => studentsService.getAll({ limit: 500 }),
  });
  const allStudents = studentsData?.data ?? [];

  const results = query.trim() && !student
    ? allStudents.filter((s) => {
        const q = query.trim().toLowerCase();
        const name = `${s.firstName} ${s.lastName}`.toLowerCase();
        const ced = String((s as any).cedula ?? '').toLowerCase();
        return name.includes(q) || ced.includes(q);
      }).slice(0, 8)
    : [];

  function selectStudent(s: Student) {
    setStudent(s);
    setQuery(`${s.firstName} ${s.lastName}`);
    setPendingDecision(null);
    setShowDecision(false);
  }
  function clearStudent() {
    setStudent(null);
    setQuery('');
    setPendingDecision(null);
    setShowDecision(false);
  }

  useEffect(() => { setAmount(''); setError(''); }, [method, tab, student]);
  useEffect(() => { if (showBs && !bcvRate) fetchBcv(); }, [showBs]);

  function calcPeriodEnd(from: string) {
    const d = new Date(from);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  async function fetchBcv() {
    setLoadingBcv(true);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      if (data?.promedio) setBcvRate(String(Number(data.promedio).toFixed(2)));
    } catch { /* silent */ } finally { setLoadingBcv(false); }
  }

  const rate = Number(bcvRate || 0);
  const partialUSD = showBs && rate > 0 && amount ? Number(amount) / rate : Number(amount || 0);
  const completeBs = showBs && rate > 0 && planPrice > 0 ? (planPrice * rate).toFixed(2) : null;

  const hasPending = student?.paymentStatus === 'PARTIAL' && (student?.pendingBalance ?? 0) > 0 && !!student?.currentPeriodEnd;
  const effectivePendingBalance = hasPending ? (student!.pendingBalance ?? 0) : 0;
  const maxUSD = pendingDecision ? effectivePendingBalance : planPrice;
  const remainingUSD = maxUSD > 0 ? maxUSD - partialUSD : 0;

  const mutation = useMutation({
    mutationFn: () => {
      if (!student) throw new Error('Alumno no encontrado');
      const finalAmountUSD = tab === 'full' ? planPrice : partialUSD;
      const noteParts = [
        showBs && bcvRate ? `Tasa BCV: ${bcvRate} Bs/USD` : '',
        showBs && tab === 'full' && completeBs ? `Cobrado: ${Number(completeBs).toLocaleString('es-VE')} Bs` : '',
        showBs && tab === 'partial' && amount ? `Pagado: ${Number(amount).toLocaleString('es-VE')} Bs` : '',
        notes,
      ].filter(Boolean);
      const effectivePeriodEnd = pendingDecision && student.currentPeriodEnd
        ? student.currentPeriodEnd
        : calcPeriodEnd(paidAt);
      return paymentsService.create({
        studentId:     student.id,
        amount:        finalAmountUSD,
        paymentType:   tab === 'full' ? 'FULL' : 'PARTIAL',
        paidAt,
        periodStart:   paidAt,
        periodEnd:     effectivePeriodEnd,
        paymentMethod: method,
        notes: noteParts.length ? noteParts.join(' | ') : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['payments-all-students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments-stats'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!student) { setError('Ingresá una cédula válida para identificar al alumno'); return; }
    // If student has pending balance and user hasn't decided yet, show decision modal
    if (hasPending && !pendingDecision) { setShowDecision(true); return; }
    if (showBs && !bcvRate) { setError('Ingresá la tasa BCV para continuar'); return; }
    if (tab === 'partial') {
      if (!amount || Number(amount) <= 0) { setError('El monto debe ser mayor a 0'); return; }
      if (maxUSD > 0 && partialUSD > maxUSD + 0.01) {
        setError(showBs
          ? `Equivale a $${partialUSD.toFixed(2)} USD, máximo $${maxUSD.toFixed(2)} USD`
          : `El monto supera el máximo de $${maxUSD.toFixed(2)} USD`
        );
        return;
      }
    }
    mutation.mutate();
  }

  const inp = 'w-full px-4 h-[46px] border border-[#eae6e0] rounded-full text-sm bg-[#faf9f7] text-[#1a1a1a] placeholder:text-[#a39a8e] outline-none transition-colors focus:border-[#E53935] focus:bg-white';
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#6b6258', paddingLeft: 16, marginBottom: 6 };

  if (showDecision && hasPending && student) {
    return (
      <PendingDecisionModal
        studentName={`${student.firstName} ${student.lastName}`}
        studentId={student.id}
        currentPeriodEnd={student.currentPeriodEnd!}
        pendingBalance={effectivePendingBalance}
        planPrice={planPrice}
        onComplete={() => { setPendingDecision('complete'); setTab('partial'); setAmount(String(effectivePendingBalance)); setShowDecision(false); }}
        onAbono={() => { setPendingDecision('abono'); setTab('partial'); setAmount(''); setShowDecision(false); }}
        onClose={() => setShowDecision(false)}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes qpm-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @media (max-width: 520px) {
          .qpm-overlay { padding: 0 !important; align-items: flex-end !important; backdrop-filter: none !important; }
          .qpm-card    { border-radius: 20px 20px 0 0 !important; max-width: 100% !important; box-shadow: 0 -4px 24px rgba(0,0,0,0.12) !important; }
        }
      `}</style>

      <div className="qpm-overlay" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="qpm-card" style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'qpm-in 0.2s cubic-bezier(0.22,1,0.36,1) both', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 48px)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard style={{ width: 16, height: 16, color: '#E53935' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#121212' }}>Registrar pago</p>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Buscá al alumno por nombre o cédula</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f4f6f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

            {/* Buscar alumno */}
            <div>
              <label style={lbl}>Buscar alumno *</label>

              {!student ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF', pointerEvents: 'none' }} />
                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre o cédula…" className={inp} style={{ paddingLeft: 36 }} autoFocus />
                  </div>
                  {query.trim() && (
                    <div style={{ marginTop: 6, border: '1px solid #eae6e0', borderRadius: 12, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                      {results.length === 0 ? (
                        <div style={{ padding: '12px 14px', fontSize: 12.5, color: '#a39a8e' }}>Sin resultados para “{query.trim()}”.</div>
                      ) : results.map((s) => (
                        <button key={s.id} type="button" onClick={() => selectStudent(s)}
                          style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f6f3ef', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#faf9f7')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: '#f0ece6', color: '#6b6258', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                            {`${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.firstName} {s.lastName}</div>
                            <div style={{ fontSize: 11, color: '#a39a8e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              CI {(s as any).cedula || '—'} · {s.plan?.name ?? 'Sin plan'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ marginTop: 0 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <User style={{ width: 15, height: 15, color: '#16a34a', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.firstName} {student.lastName}</div>
                        <div style={{ fontSize: 11, color: '#16a34a' }}>CI {(student as any).cedula || '—'} · {student.plan?.name ?? 'Sin plan'}{planPrice ? ` · $${planPrice} USD` : ''}</div>
                      </div>
                    </div>
                    <button type="button" onClick={clearStudent} style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}>Cambiar</button>
                  </div>
                  {student && hasPending && (
                    <div style={{ marginTop: 5, padding: '7px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle style={{ width: 13, height: 13, color: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                          Saldo pendiente: ${effectivePendingBalance.toFixed(2)} USD
                          {pendingDecision && <span style={{ fontWeight: 400, color: '#78350f' }}> — {pendingDecision === 'complete' ? 'Completar' : 'Abonar'}</span>}
                        </span>
                      </div>
                      {pendingDecision && (
                        <button type="button" onClick={() => { setPendingDecision(null); setShowDecision(true); }}
                          style={{ fontSize: 11, color: '#d97706', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}>
                          Cambiar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabs — solo si hay alumno */}
            {student && (
              <div style={{ display: 'flex', gap: 8 }}>
                {(['full', 'partial'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s', background: tab === t ? (t === 'full' ? '#E53935' : '#f59e0b') : '#f4f6f9', color: tab === t ? '#fff' : '#6B7280' }}>
                    {t === 'full' ? 'Pago completo' : 'Pago parcial'}
                  </button>
                ))}
              </div>
            )}

            {/* 1. Método de pago */}
            <div>
              <label style={lbl}>Método de pago *</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inp} style={{ appearance: 'auto' }}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* 2. Tasa BCV — si es método Bs */}
            {showBs && (
              <div>
                <label style={lbl}>Tasa de cambio (Bs/USD) *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" inputMode="decimal" value={bcvRate}
                    onChange={(e) => { const v = e.target.value; if (/^\d*[.,]?\d*$/.test(v)) setBcvRate(v.replace(',', '.')); }}
                    placeholder="Ej: 91.45" className={inp} style={{ flex: 1 }} />
                  <button type="button" onClick={fetchBcv} disabled={loadingBcv} title="Actualizar tasa BCV"
                    style={{ padding: '0 12px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    <RefreshCw style={{ width: 13, height: 13, animation: loadingBcv ? 'spin 1s linear infinite' : 'none' }} />
                    BCV
                  </button>
                </div>
              </div>
            )}

            {/* 3. Monto */}
            {student && (
              tab === 'full' ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#15803d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {showBs ? 'Monto a cobrar en Bs' : 'Monto a cobrar'}
                  </p>
                  {showBs && completeBs ? (
                    <>
                      <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: '#15803d' }}>
                        {Number(completeBs).toLocaleString('es-VE')} <span style={{ fontSize: 14, fontWeight: 600 }}>Bs</span>
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#16a34a' }}>= ${planPrice} USD</p>
                    </>
                  ) : showBs ? (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Ingresá la tasa BCV para ver el monto en Bs</p>
                  ) : (
                    <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: '#15803d' }}>
                      ${planPrice} <span style={{ fontSize: 14, fontWeight: 600 }}>USD</span>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label style={lbl}>{showBs ? 'Monto recibido (Bs) *' : 'Monto recibido (USD) *'}</label>
                  <input type="text" inputMode="decimal" required value={amount}
                    onChange={(e) => { const v = e.target.value; if (/^\d*[.,]?\d*$/.test(v)) setAmount(v.replace(',', '.')); }}
                    placeholder={showBs ? (rate > 0 ? `Máx: ${(maxUSD * rate).toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs` : 'Ej: 1800') : `Máx: $${maxUSD.toFixed(2)}`}
                    className={inp} />
                  {showBs && amount && rate > 0 && (
                    <p style={{ marginTop: 4, fontSize: 11, color: '#6B7280' }}>
                      = ${partialUSD.toFixed(2)} USD
                      {remainingUSD > 0 && <span style={{ color: '#f59e0b', fontWeight: 700 }}> · Saldo: ${remainingUSD.toFixed(2)} USD</span>}
                    </p>
                  )}
                  {!showBs && amount && Number(amount) > 0 && remainingUSD > 0 && (
                    <p style={{ marginTop: 4, fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>
                      Saldo pendiente: ${remainingUSD.toFixed(2)} USD
                    </p>
                  )}
                </div>
              )
            )}

            {/* 4. Fecha de pago */}
            <div>
              <label style={lbl}>Fecha de pago *</label>
              <input type="date" required value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inp} />
              <p style={{ marginTop: 4, fontSize: 11, color: '#9CA3AF' }}>
                Período: {paidAt} → {pendingDecision && student?.currentPeriodEnd ? student.currentPeriodEnd : calcPeriodEnd(paidAt)}
              </p>
            </div>

            {/* 5. Notas (solo pago parcial) */}
            {tab === 'partial' && student && (
              <div>
                <label style={lbl}>Notas <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Abono inicial" className={inp} />
              </div>
            )}

            {error && (
              <p style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', margin: 0 }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={mutation.isPending} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: tab === 'full' ? '#E53935' : '#f59e0b', color: '#fff', fontSize: 13, fontWeight: 600, cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1, boxShadow: `0 4px 12px ${tab === 'full' ? 'rgba(229,57,53,0.28)' : 'rgba(245,158,11,0.28)'}` }}>
                {mutation.isPending ? 'Registrando...' : tab === 'full' ? 'Registrar pago' : 'Registrar abono'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
