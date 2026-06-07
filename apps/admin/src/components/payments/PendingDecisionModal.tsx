'use client';

import { AlertCircle, CheckCircle, Plus } from 'lucide-react';

interface Props {
  studentName: string;
  pendingBalance: number;
  planPrice: number;
  onComplete: () => void;
  onAbono: () => void;
  onClose: () => void;
}

export function PendingDecisionModal({ studentName, pendingBalance, planPrice, onComplete, onAbono, onClose }: Props) {
  const paidSoFar = Math.max(0, planPrice - pendingBalance);
  const pctPaid = planPrice > 0 ? Math.min(100, Math.round((paidSoFar / planPrice) * 100)) : 0;

  return (
    <>
      <style>{`
        @keyframes pdm-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @media (max-width: 520px) {
          .pdm-overlay { padding: 0 !important; align-items: flex-end !important; }
          .pdm-card    { border-radius: 20px 20px 0 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <div
        className="pdm-overlay"
        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="pdm-card"
          style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'pdm-in 0.2s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          {/* Header */}
          <div style={{ padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle style={{ width: 20, height: 20, color: '#f59e0b' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Pago pendiente detectado</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>{studentName}</p>
              </div>
            </div>

            {/* Balance info */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Saldo pendiente</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>${pendingBalance.toFixed(2)} USD</span>
              </div>
              <div style={{ background: '#fde68a', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${pctPaid}%`, height: '100%', background: '#f59e0b', borderRadius: 99, transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 11, color: '#92400e' }}>${paidSoFar.toFixed(2)} pagado ({pctPaid}%)</span>
                <span style={{ fontSize: 11, color: '#92400e' }}>${planPrice.toFixed(2)} total</span>
              </div>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#374151' }}>
              ¿Cómo deseas registrar este pago?
            </p>
          </div>

          {/* Options */}
          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={onComplete}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '2px solid #E53935', background: '#fff5f5', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff5f5')}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #fecaca' }}>
                <CheckCircle style={{ width: 18, height: 18, color: '#E53935' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#E53935' }}>Completar pago restante</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>
                  Pagar los ${pendingBalance.toFixed(2)} USD restantes y cerrar la mensualidad
                </p>
              </div>
            </button>

            <button
              onClick={onAbono}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '2px solid #f59e0b', background: '#fffbeb', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fef3c7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fffbeb')}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #fde68a' }}>
                <Plus style={{ width: 18, height: 18, color: '#f59e0b' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#d97706' }}>Registrar nuevo abono</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>
                  Registrar un abono parcial sobre la mensualidad actual
                </p>
              </div>
            </button>

            <button
              onClick={onClose}
              style={{ padding: '10px 16px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', marginTop: 2 }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
