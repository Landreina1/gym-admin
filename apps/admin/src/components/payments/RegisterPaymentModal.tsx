'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, RefreshCw } from 'lucide-react';
import { paymentsService } from '@/services/payments.service';

const METHODS = ['Pago Móvil', 'Transferencia', 'Efectivo USD', 'Efectivo Bs', 'Otro'];
const BS_METHODS = ['Efectivo Bs', 'Pago Móvil'];

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  plan: { name: string; price: number | string };
}

interface Props {
  student: StudentInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RegisterPaymentModal({ student, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [tab,       setTab]       = useState<'full' | 'partial'>('full');
  const [method,    setMethod]    = useState('Pago Móvil');
  const [amount,    setAmount]    = useState('');
  const [paidAt,    setPaidAt]    = useState(today);
  const [bcvRate,   setBcvRate]   = useState('');
  const [loadingBcv, setLoadingBcv] = useState(false);
  const [notes,     setNotes]     = useState('');
  const [error,     setError]     = useState('');

  const showBs = BS_METHODS.includes(method);
  const planPrice = student ? Number(student.plan.price) : 0;

  // Reset state when student changes or modal opens
  useEffect(() => {
    if (student) {
      setTab('full');
      setMethod('Pago Móvil');
      setAmount('');
      setPaidAt(today);
      setBcvRate('');
      setNotes('');
      setError('');
    }
  }, [student]);

  // Fetch BCV rate when Bs method selected
  useEffect(() => {
    if (showBs && !bcvRate) fetchBcv();
  }, [showBs]);

  async function fetchBcv() {
    setLoadingBcv(true);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      if (data?.promedio) setBcvRate(String(Number(data.promedio).toFixed(2)));
    } catch {
      // silent — user can enter manually
    } finally {
      setLoadingBcv(false);
    }
  }

  const effectiveAmount = tab === 'full' ? planPrice : Number(amount || 0);
  const remaining = planPrice - effectiveAmount;
  const amountInBs = showBs && effectiveAmount > 0 && bcvRate
    ? (effectiveAmount * Number(bcvRate)).toFixed(2)
    : null;

  function calcPeriodEnd(from: string) {
    const d = new Date(from);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!student) throw new Error('Sin alumno');
      const finalAmount = tab === 'full' ? planPrice : Number(amount);
      const noteParts = [
        showBs && bcvRate ? `Tasa BCV: ${bcvRate} Bs/USD` : '',
        notes,
      ].filter(Boolean);
      return paymentsService.create({
        studentId:    student.id,
        amount:       finalAmount,
        totalAmount:  planPrice,
        paymentType:  tab === 'full' ? 'FULL' : 'PARTIAL',
        paidAt,
        periodStart:  paidAt,
        periodEnd:    calcPeriodEnd(paidAt),
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
    if (tab === 'partial') {
      if (!amount || Number(amount) <= 0) { setError('El monto debe ser mayor a 0'); return; }
      if (Number(amount) >= planPrice) { setError(`El monto parcial debe ser menor al total ($${planPrice})`); return; }
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

      <div
        className="rpm-overlay"
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="rpm-card"
          style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            animation: 'rpm-in 0.2s cubic-bezier(0.22,1,0.36,1) both',
            display: 'flex', flexDirection: 'column',
            maxHeight: 'calc(100vh - 48px)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard style={{ width: 16, height: 16, color: '#E53935' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#121212' }}>
                  {student.firstName} {student.lastName}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{student.plan.name} · ${planPrice} USD/mes</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f4f6f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', padding: '12px 24px 0', gap: 8, flexShrink: 0 }}>
            {(['full', 'partial'] as const).map((t) => {
              const active = tab === t;
              const label = t === 'full' ? 'Pago completo' : 'Pago parcial';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setError(''); setAmount(''); }}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                    background: active ? (t === 'full' ? '#E53935' : '#f59e0b') : '#f4f6f9',
                    color: active ? '#fff' : '#6B7280',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

            {/* Amount display */}
            {tab === 'full' ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#15803d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monto a cobrar</p>
                <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: '#15803d' }}>${planPrice} <span style={{ fontSize: 14, fontWeight: 600 }}>USD</span></p>
              </div>
            ) : (
              <div>
                <label style={lbl}>Monto pagado (USD) *</label>
                <input
                  type="number" min="0.01" step="0.01" required
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Máx: $${planPrice}`} className={inp}
                  autoFocus
                />
                {amount && Number(amount) > 0 && Number(amount) < planPrice && (
                  <p style={{ marginTop: 4, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                    Saldo pendiente: ${(planPrice - Number(amount)).toFixed(2)} USD
                  </p>
                )}
                {amountInBs && <p style={{ marginTop: 2, fontSize: 11, color: '#6B7280' }}>≈ {Number(amountInBs).toLocaleString('es-VE')} Bs</p>}
              </div>
            )}

            {/* Payment method */}
            <div>
              <label style={lbl}>Método de pago *</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inp} style={{ appearance: 'auto' }}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* BCV rate */}
            {showBs && (
              <div>
                <label style={lbl}>Tasa de cambio (Bs/USD) *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number" step="0.01" min="0"
                    value={bcvRate} onChange={(e) => setBcvRate(e.target.value)}
                    placeholder="Ej: 91.45" className={inp} style={{ flex: 1 }}
                  />
                  <button type="button" onClick={fetchBcv} disabled={loadingBcv} title="Actualizar tasa BCV"
                    style={{ padding: '0 12px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    <RefreshCw style={{ width: 13, height: 13, animation: loadingBcv ? 'spin 1s linear infinite' : 'none' }} />
                    BCV
                  </button>
                </div>
                {tab === 'full' && amountInBs && (
                  <p style={{ marginTop: 4, fontSize: 11, color: '#6B7280' }}>≈ {Number(amountInBs).toLocaleString('es-VE')} Bs</p>
                )}
              </div>
            )}

            {/* Payment date */}
            <div>
              <label style={lbl}>Fecha de pago *</label>
              <input type="date" required value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inp} />
              <p style={{ marginTop: 4, fontSize: 11, color: '#9CA3AF' }}>
                Período: {paidAt} → {calcPeriodEnd(paidAt)}
              </p>
            </div>

            {/* Notes (partial only) */}
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
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={mutation.isPending} style={{
                flex: 1, padding: '11px 0', borderRadius: 12, border: 'none',
                background: tab === 'full' ? '#E53935' : '#f59e0b',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                opacity: mutation.isPending ? 0.7 : 1,
                boxShadow: `0 4px 12px ${tab === 'full' ? 'rgba(229,57,53,0.28)' : 'rgba(245,158,11,0.28)'}`,
              }}>
                {mutation.isPending ? 'Registrando...' : tab === 'full' ? 'Registrar pago' : 'Registrar abono'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
