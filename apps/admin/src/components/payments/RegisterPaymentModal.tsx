'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { paymentsService } from '@/services/payments.service';

const METHODS = ['Pago Móvil', 'Transferencia', 'Efectivo USD', 'Efectivo Bs', 'Otro'];
const BS_METHODS = ['Pago Móvil', 'Transferencia', 'Efectivo Bs'];

function isBs(method: string) { return BS_METHODS.includes(method); }

/** Format ISO date string (YYYY-MM-DD) as DD/MM/YYYY without timezone shift */
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  plan: { name: string; price: number | string };
}

interface PendingMode {
  mode: 'complete' | 'abono';
  pendingBalance: number;
  periodEnd: string; // YYYY-MM-DD — fixed, reuses existing period
}

interface Props {
  student: StudentInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
  pendingMode?: PendingMode;
  onBack?: () => void;
  /** When current period is fully paid, this is the next period's end date (pre-filled & locked) */
  suggestedNextPeriodEnd?: string;
  /** The current fully-paid period end date, used to block duplicate full payments */
  currentPeriodEnd?: string;
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function RegisterPaymentModal({ student, onClose, onSuccess, pendingMode, onBack, suggestedNextPeriodEnd, currentPeriodEnd }: Props) {
  const queryClient = useQueryClient();
  const today = localToday();

  const initialTab = pendingMode ? 'partial' : 'full';
  const [tab,        setTab]        = useState<'full' | 'partial'>(initialTab);
  const [method,     setMethod]     = useState('Pago Móvil');
  const [bcvRate,    setBcvRate]    = useState('');
  const [loadingBcv, setLoadingBcv] = useState(false);
  const [amount,     setAmount]     = useState(''); // Bs if isBs(method), else USD
  const [paidAt,     setPaidAt]     = useState(today);
  const [notes,      setNotes]      = useState('');
  const [error,      setError]      = useState('');
  const autoFilledRef = useRef(false);

  const planPrice = student ? Number(student.plan.price) : 0;
  const showBs = isBs(method);

  // Reset on student change (but respect pendingMode)
  useEffect(() => {
    if (student) {
      setTab(pendingMode ? 'partial' : 'full');
      setMethod('Pago Móvil'); setBcvRate('');
      setAmount(''); setPaidAt(today); setNotes(''); setError('');
      autoFilledRef.current = false;
    }
  }, [student]);

  // Reset amount when method or tab changes (unless we just auto-filled)
  useEffect(() => {
    setError('');
    if (!autoFilledRef.current) setAmount('');
    autoFilledRef.current = false;
  }, [method, tab]);

  // Auto-fetch BCV when Bs method selected
  useEffect(() => { if (showBs && !bcvRate) fetchBcv(); }, [showBs]);

  // Auto-fill amount for 'complete' mode
  useEffect(() => {
    if (pendingMode?.mode !== 'complete') return;
    const r = Number(bcvRate || 0);
    if (!showBs) {
      autoFilledRef.current = true;
      setAmount(String(pendingMode.pendingBalance));
    } else if (r > 0) {
      autoFilledRef.current = true;
      setAmount((pendingMode.pendingBalance * r).toFixed(2));
    }
  }, [pendingMode?.mode, showBs, bcvRate]);

  async function fetchBcv() {
    setLoadingBcv(true);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      if (data?.promedio) setBcvRate(String(Number(data.promedio).toFixed(2)));
    } catch { /* silent */ } finally { setLoadingBcv(false); }
  }

  function calcPeriodEnd(from: string) {
    const [y, m, d] = from.split('-').map(Number);
    const date = new Date(y, m - 1, d); // local time — no UTC drift
    date.setMonth(date.getMonth() + 1);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }

  function getPeriodEnd() {
    if (pendingMode) return pendingMode.periodEnd;
    if (suggestedNextPeriodEnd) return suggestedNextPeriodEnd;
    return calcPeriodEnd(paidAt);
  }

  // Derived values
  const rate = Number(bcvRate || 0);
  // For pago completo: always planPrice USD regardless of method
  // For pago parcial: if Bs → amount is in Bs, convert to USD; if USD → amount is USD
  const partialUSD = showBs && rate > 0 && amount
    ? Number(amount) / rate
    : Number(amount || 0);

  const completeBs = showBs && rate > 0 ? (planPrice * rate).toFixed(2) : null;
  // In pendingMode, remaining is against pendingBalance; otherwise against planPrice
  const maxUSD = pendingMode ? pendingMode.pendingBalance : planPrice;
  const remainingUSD = maxUSD > 0 ? maxUSD - partialUSD : 0;

  const mutation = useMutation({
    mutationFn: () => {
      if (!student) throw new Error('Sin alumno');
      const finalAmountUSD = tab === 'full' ? planPrice : partialUSD;
      const noteParts = [
        showBs && bcvRate ? `Tasa BCV: ${bcvRate} Bs/USD` : '',
        showBs && tab === 'full' && completeBs ? `Cobrado: ${Number(completeBs).toLocaleString('es-VE')} Bs` : '',
        showBs && tab === 'partial' && amount ? `Pagado: ${Number(amount).toLocaleString('es-VE')} Bs` : '',
        pendingMode ? (pendingMode.mode === 'complete' ? 'Cierre de saldo pendiente' : 'Abono a saldo pendiente') : '',
        notes,
      ].filter(Boolean);
      return paymentsService.create({
        studentId:     student.id,
        amount:        finalAmountUSD,
        totalAmount:   planPrice,
        paymentType:   tab === 'full' ? 'FULL' : 'PARTIAL',
        paidAt,
        periodStart:   paidAt,
        periodEnd:     getPeriodEnd(),
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
    if (showBs && !bcvRate) { setError('Ingresá la tasa BCV para continuar'); return; }
    if (tab === 'partial') {
      if (!amount || Number(amount) <= 0) { setError('El monto debe ser mayor a 0'); return; }
      if (maxUSD > 0 && partialUSD > maxUSD + 0.01) {
        setError(showBs
          ? `El monto en Bs equivale a $${partialUSD.toFixed(2)} USD, máximo $${maxUSD.toFixed(2)} USD`
          : `El monto supera el máximo permitido de $${maxUSD.toFixed(2)} USD`
        );
        return;
      }
    }
    mutation.mutate();
  }

  if (!student) return null;

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white';
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };

  return (
    <>
      <style>{`
        @keyframes rpm-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @media (max-width: 520px) {
          .rpm-overlay { padding: 0 !important; align-items: flex-end !important; }
          .rpm-card    { border-radius: 20px 20px 0 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="rpm-overlay" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="rpm-card" style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'rpm-in 0.2s cubic-bezier(0.22,1,0.36,1) both', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 48px)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {onBack && (
                <button onClick={onBack} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f4f6f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', marginRight: 2 }}>
                  <ArrowLeft style={{ width: 16, height: 16 }} />
                </button>
              )}
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard style={{ width: 16, height: 16, color: '#E53935' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#121212' }}>{student.firstName} {student.lastName}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{student.plan.name} · ${planPrice} USD/mes</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f4f6f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Tabs — hidden in pendingMode (always partial) */}
          {!pendingMode && (
            <div style={{ display: 'flex', padding: '12px 24px 0', gap: 8, flexShrink: 0 }}>
              {(['full', 'partial'] as const).map((t) => (
                <button key={t} type="button" onClick={() => { setTab(t); setError(''); setAmount(''); }}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s', background: tab === t ? (t === 'full' ? '#E53935' : '#f59e0b') : '#f4f6f9', color: tab === t ? '#fff' : '#6B7280' }}>
                  {t === 'full' ? 'Pago completo' : 'Pago parcial'}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

            {/* Next period banner — shown when current period is fully paid */}
            {suggestedNextPeriodEnd && !pendingMode && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
                <AlertCircle style={{ width: 15, height: 15, color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                  <strong>Período actual pagado</strong> hasta {currentPeriodEnd ? fmtDate(currentPeriodEnd) : '—'}.<br />
                  Este pago se aplicará al siguiente período: <strong>{fmtDate(suggestedNextPeriodEnd)}</strong>.
                </p>
              </div>
            )}

            {/* Pending balance banner */}
            {pendingMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
                <AlertCircle style={{ width: 15, height: 15, color: '#f59e0b', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
                  {pendingMode.mode === 'complete'
                    ? <><strong>Completar saldo:</strong> ${pendingMode.pendingBalance.toFixed(2)} USD restantes</>
                    : <><strong>Abono:</strong> saldo pendiente de ${pendingMode.pendingBalance.toFixed(2)} USD</>
                  }
                </p>
              </div>
            )}

            {/* 1. Método de pago — PRIMERO */}
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
                  <input type="number" step="0.01" min="0" value={bcvRate} onChange={(e) => setBcvRate(e.target.value)}
                    placeholder="Ej: 91.45" className={inp} style={{ flex: 1 }} />
                  <button type="button" onClick={fetchBcv} disabled={loadingBcv} title="Actualizar tasa BCV"
                    style={{ padding: '0 12px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    <RefreshCw style={{ width: 13, height: 13, animation: loadingBcv ? 'spin 1s linear infinite' : 'none' }} />
                    BCV
                  </button>
                </div>
              </div>
            )}

            {/* 3. Monto — depende de tab y método */}
            {tab === 'full' ? (
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
                <input type="number" min="0.01" step="0.01" required value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={showBs ? (completeBs ? `Máx: ${(maxUSD * rate).toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs` : 'Ej: 1800') : `Máx: $${maxUSD.toFixed(2)}`}
                  className={inp} autoFocus />
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
            )}

            {/* 4. Fecha de pago — automática (hoy) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fecha de pago</p>
                <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{fmtDate(paidAt)}</p>
                <p style={{ margin: '1px 0 0', fontSize: 10, color: '#94a3b8' }}>
                  Período: {fmtDate(paidAt)} → {fmtDate(getPeriodEnd())}
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 99 }}>Hoy</span>
            </div>

            {/* 5. Notas (solo pago parcial) */}
            {tab === 'partial' && (
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
              <button type="button" onClick={pendingMode && onBack ? onBack : onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                {pendingMode && onBack ? '← Volver' : 'Cancelar'}
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
