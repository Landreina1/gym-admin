'use client';

import { useState, useEffect } from 'react';
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

export function PaymentFlowModal({ student, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'decision' | 'payment'>('decision');
  const [decisionMode, setDecisionMode] = useState<DecisionMode | null>(null);

  // Reset to decision step every time the modal opens (student changes)
  useEffect(() => {
    setStep('decision');
    setDecisionMode(null);
  }, [student?.id]);

  if (!student) return null;

  const hasPending =
    student.paymentStatus === 'PARTIAL' &&
    (student.pendingBalance ?? 0) > 0 &&
    !!student.currentPeriodEnd;

  // No pending balance — go straight to payment modal
  if (!hasPending) {
    return <RegisterPaymentModal student={student} onClose={onClose} onSuccess={onSuccess} />;
  }

  // Show decision first
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
