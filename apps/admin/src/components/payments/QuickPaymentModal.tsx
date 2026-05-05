'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Search, CreditCard, User } from 'lucide-react';
import { studentsService } from '@/services/students.service';
import { paymentsService } from '@/services/payments.service';
import type { Student } from '@/types';

const METHODS = ['Efectivo USD', 'Efectivo Bs', 'Transferencia', 'Pago Móvil', 'Otro'];

interface Props { onClose: () => void; onSuccess?: () => void }

export function QuickPaymentModal({ onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [cedula,      setCedula]      = useState('');
  const [student,     setStudent]     = useState<Student | null>(null);
  const [amount,      setAmount]      = useState('');
  const [method,      setMethod]      = useState('Efectivo USD');
  const [paidAt,      setPaidAt]      = useState(today);
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd,   setPeriodEnd]   = useState('');
  const [error,       setError]       = useState('');

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

  useEffect(() => {
    if (periodStart) {
      const d = new Date(periodStart);
      d.setMonth(d.getMonth() + 1);
      setPeriodEnd(d.toISOString().slice(0, 10));
    }
  }, [periodStart]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!student) throw new Error('Alumno no encontrado');
      return paymentsService.create({
        studentId:   student.id,
        amount:      Number(amount),
        paidAt,
        periodStart,
        periodEnd,
        paymentMethod: method,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats-dashboard'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!student) { setError('Ingresá una cédula válida para identificar al alumno'); return; }
    if (!amount || Number(amount) <= 0) { setError('El monto debe ser mayor a 0'); return; }
    mutation.mutate();
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white';

  return (
    <>
      <style>{`
        @keyframes qpm-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @media (max-width: 520px) {
          .qpm-overlay { padding: 0 !important; align-items: flex-end !important; }
          .qpm-card    { border-radius: 20px 20px 0 0 !important; max-width: 100% !important; max-height: 92vh; overflow-y: auto; }
          .qpm-dates   { grid-template-columns: 1fr 1fr !important; }
          .qpm-date-end { grid-column: span 2; }
        }
        @media (max-width: 380px) {
          .qpm-dates   { grid-template-columns: 1fr !important; }
          .qpm-date-end { grid-column: auto; }
        }
      `}</style>

      <div
        className="qpm-overlay"
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="qpm-card"
          style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            animation: 'qpm-in 0.2s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {/* Header */}
          <div
            className="qpm-header"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CreditCard style={{ width: 16, height: 16, color: '#E53935' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#121212' }}>Registrar pago</p>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Completá los datos del cobro</p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: '#f4f6f9', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#6B7280',
            }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Body */}
          <form
            className="qpm-body"
            onSubmit={handleSubmit}
            style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Cédula */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Cédula del alumno *
              </label>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="V-12345678"
                  className={inp}
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>
              {cedula && (
                <div style={{
                  marginTop: 6, padding: '8px 12px', borderRadius: 10,
                  background: student ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${student ? '#bbf7d0' : '#fecaca'}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <User style={{ width: 13, height: 13, color: student ? '#16a34a' : '#dc2626', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: student ? '#15803d' : '#dc2626' }}>
                    {student ? `${student.firstName} ${student.lastName} · ${student.plan?.name}` : 'Alumno no encontrado'}
                  </span>
                </div>
              )}
            </div>

            {/* Monto */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Monto *
              </label>
              <input
                type="number" min="0.01" step="0.01" required
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" className={inp}
              />
            </div>

            {/* Método de pago */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Método de pago *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {METHODS.map((m) => (
                  <button
                    key={m} type="button"
                    onClick={() => setMethod(m)}
                    style={{
                      padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                      border: `1.5px solid ${method === m ? '#E53935' : '#E5E7EB'}`,
                      background: method === m ? '#fef2f2' : '#fff',
                      color: method === m ? '#E53935' : '#374151',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >{m}</button>
                ))}
              </div>
            </div>

            {/* Fechas */}
            <div className="qpm-dates" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Fecha pago *
                </label>
                <input type="date" required value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Período inicio *
                </label>
                <input type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inp} />
              </div>
              <div className="qpm-date-end">
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Período fin *
                </label>
                <input type="date" required value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inp} />
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', margin: 0 }}>
                {error}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #E5E7EB',
                background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}>
                Cancelar
              </button>
              <button type="submit" disabled={mutation.isPending} style={{
                flex: 1, padding: '11px 0', borderRadius: 12, border: 'none',
                background: '#E53935', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                opacity: mutation.isPending ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(229,57,53,0.28)',
              }}>
                {mutation.isPending ? 'Registrando...' : 'Registrar pago'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
