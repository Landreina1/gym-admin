'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, CreditCard, X, ArrowRight } from 'lucide-react';
import { RegisterPaymentModal } from './RegisterPaymentModal';
import { PendingDecisionModal } from './PendingDecisionModal';

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  plan: { name: string; price: number | string };
  paymentStatus?: string;
  pendingBalance?: number | null;
  currentPeriodEnd?: string | null;
}

interface Props {
  student: StudentInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type DecisionMode = 'complete' | 'abono';

function addOneMonth(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + 1);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ── Blocked modal: current period is fully paid and we're still in it ──────────
function PaidUpModal({
  student,
  currentPeriodEnd,
  nextPeriodEnd,
  onAdvance,
  onClose,
}: {
  student: StudentInfo;
  currentPeriodEnd: string;
  nextPeriodEnd: string;
  onAdvance: () => void;
  onClose: () => void;
}) {
  const planPrice = Number(student.plan.price);
  return (
    <>
      <style>{`
        @keyframes pum-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @media (max-width: 520px) {
          .pum-overlay { padding: 0 !important; align-items: flex-end !important; }
          .pum-card    { border-radius: 20px 20px 0 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="pum-overlay" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="pum-card" style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'pum-in 0.2s cubic-bezier(0.22,1,0.36,1) both', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

          {/* Body */}
          <div style={{ padding: '28px 24px 8px', textAlign: 'center' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '5px 14px', marginBottom: 20 }}>
              <CheckCircle style={{ width: 14, height: 14, color: '#16a34a' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>Mensualidad al día</span>
            </div>

            <p style={{ fontSize: 14, color: '#374151', margin: '0 0 20px', lineHeight: 1.6 }}>
              La mensualidad de <strong>{student.firstName}</strong> está pagada hasta el{' '}
              <strong style={{ color: '#1e293b' }}>{fmtDate(currentPeriodEnd)}</strong>.
            </p>

            {/* Next period card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 20px', marginBottom: 20 }}>
              <Calendar style={{ width: 16, height: 16, color: '#64748b', flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Próximo cobro</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{fmtDate(nextPeriodEnd)}</p>
              </div>
              <ArrowRight style={{ width: 14, height: 14, color: '#cbd5e1' }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Período hasta</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{fmtDate(addOneMonth(nextPeriodEnd))}</p>
              </div>
            </div>

            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 24px' }}>
              ¿El alumno quiere adelantar el pago del próximo mes?
            </p>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, padding: '0 24px 24px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
              Cerrar
            </button>
            <button onClick={onAdvance} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#E53935', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(229,57,53,0.28)' }}>
              Adelantar pago
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main flow ──────────────────────────────────────────────────────────────────
export function PaymentFlowModal({ student, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'decision' | 'payment'>('decision');
  const [decisionMode, setDecisionMode] = useState<DecisionMode | null>(null);
  const [advanceMode, setAdvanceMode] = useState(false);

  useEffect(() => {
    setStep('decision');
    setDecisionMode(null);
    setAdvanceMode(false);
  }, [student?.id]);

  if (!student) return null;

  const today = new Date().toISOString().slice(0, 10);

  const hasPending =
    student.paymentStatus === 'PARTIAL' &&
    (student.pendingBalance ?? 0) > 0 &&
    !!student.currentPeriodEnd;

  const isPaidUp = student.paymentStatus === 'UP_TO_DATE' && !!student.currentPeriodEnd;
  // True when we're still within the paid period (today hasn't reached the period end yet)
  const isWithinPaidPeriod = isPaidUp && student.currentPeriodEnd! > today;
  const suggestedNextPeriodEnd = isPaidUp ? addOneMonth(student.currentPeriodEnd!) : undefined;

  // ── PARTIAL flow ──
  if (hasPending) {
    if (step === 'decision') {
      return (
        <PendingDecisionModal
          studentName={`${student.firstName} ${student.lastName}`}
          studentId={student.id}
          currentPeriodEnd={student.currentPeriodEnd!}
          pendingBalance={student.pendingBalance!}
          planPrice={Number(student.plan.price)}
          onComplete={() => { setDecisionMode('complete'); setStep('payment'); }}
          onAbono={() => { setDecisionMode('abono'); setStep('payment'); }}
          onClose={onClose}
        />
      );
    }
    return (
      <RegisterPaymentModal
        student={student}
        pendingMode={{
          mode: decisionMode!,
          pendingBalance: student.pendingBalance!,
          periodEnd: student.currentPeriodEnd!,
        }}
        onBack={() => { setStep('decision'); setDecisionMode(null); }}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  // ── UP_TO_DATE + still within paid period → block & offer advance ──
  if (isWithinPaidPeriod && !advanceMode) {
    return (
      <PaidUpModal
        student={student}
        currentPeriodEnd={student.currentPeriodEnd!}
        nextPeriodEnd={suggestedNextPeriodEnd!}
        onAdvance={() => setAdvanceMode(true)}
        onClose={onClose}
      />
    );
  }

  // ── Normal / advance payment ──
  return (
    <RegisterPaymentModal
      student={student}
      onClose={onClose}
      onSuccess={onSuccess}
      suggestedNextPeriodEnd={suggestedNextPeriodEnd}
      currentPeriodEnd={student.currentPeriodEnd ?? undefined}
    />
  );
}
