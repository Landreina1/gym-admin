'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Search, CreditCard, User, RefreshCw } from 'lucide-react';
import { studentsService } from '@/services/students.service';
import { paymentsService } from '@/services/payments.service';
import type { Student } from '@/types';

const METHODS = ['Pago Móvil', 'Transferencia', 'Efectivo USD', 'Efectivo Bs', 'Otro'];
const BS_METHODS = ['Pago Móvil', 'Transferencia', 'Efectivo Bs'];

function isBs(method: string) { return BS_METHODS.includes(method); }

interface Props { onClose: () => void; onSuccess?: () => void }

export function QuickPaymentModal({ onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [tab,        setTab]        = useState<'full' | 'partial'>('full');
  const [cedula,     setCedula]     = useState('');
  const [student,    setStudent]    = useState<Student | null>(null);
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

  useEffect(() => {
    if (!cedula.trim()) { setStudent(null); return; }
    const match = allStudents.find(
      (s) => (s as any).cedula?.toLowerCase() === cedula.trim().toLowerCase()
    );
    setStudent(match ?? null);
  }, [cedula, allStudents]);

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
  const remainingUSD = planPrice > 0 ? planPrice - partialUSD : 0;

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
      return paymentsService.create({
        studentId:     student.id,
        amount:        finalAmountUSD,
        totalAmount:   planPrice || undefined,
        paymentType:   tab === 'full' ? 'FULL' : 'PARTIAL',
        paidAt,
        periodStart:   paidAt,
        periodEnd:     calcPeriodEnd(paidAt),
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
    if (showBs && !bcvRate) { setError('Ingresá la tasa BCV para continuar'); return; }
    if (tab === 'partial') {
      if (!amount || Number(amount) <= 0) { setError('El monto debe ser mayor a 0'); return; }
      if (planPrice > 0 && partialUSD >= planPrice) {
        setError(showBs
          ? `Equivale a $${partialUSD.toFixed(2)} USD, debe ser menor a $${planPrice} USD`
          : `El monto parcial debe ser menor a $${planPrice} USD`
        );
        return;
      }
    }
    mutation.mutate();
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white';
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };

  return (
    <>
      <style>{`
        @keyframes qpm-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @media (max-width: 520px) {
          .qpm-overlay { padding: 0 !important; align-items: flex-end !important; }
          .qpm-card    { border-radius: 20px 20px 0 0 !important; max-width: 100% !important; }
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
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Buscá al alumno por cédula</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f4f6f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

            {/* Cédula */}
            <div>
              <label style={lbl}>Cédula del alumno *</label>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF', pointerEvents: 'none' }} />
                <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="V-12345678" className={inp} style={{ paddingLeft: 36 }} required />
              </div>
              {cedula && (
                <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 10, background: student ? '#f0fdf4' : '#fef2f2', border: `1px solid ${student ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User style={{ width: 13, height: 13, color: student ? '#16a34a' : '#dc2626', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: student ? '#15803d' : '#dc2626' }}>
                    {student ? `${student.firstName} ${student.lastName} · ${student.plan?.name}${planPrice ? ` · $${planPrice} USD` : ''}` : 'Alumno no encontrado'}
                  </span>
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
                  <input type="number" min="0.01" step="0.01" required value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={showBs ? (completeBs ? `Máx: ${Number(completeBs).toLocaleString('es-VE')} Bs` : 'Ej: 1800') : `Máx: $${planPrice}`}
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
                Período: {paidAt} → {calcPeriodEnd(paidAt)}
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
