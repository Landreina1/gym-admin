'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  MoreVertical,
  Eye, Pencil, CreditCard, ChevronRight,
  Trash2, UserX, UserCheck,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Student } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { studentsService } from '@/services/students.service';
import { PaymentFlowModal } from '@/components/payments/PaymentFlowModal';

// NOTA: la funcionalidad de "peso" (columnas, registro y gráficos) quedó
// oculta a pedido. El código de peso se puede restaurar desde el historial de git.

/* ─── Desktop action dropdown (portal) ───────────────────── */
function ActionDropdown({ student, onPayment, onDelete, onSuspend }: {
  student: Student; onPayment: () => void;
  onDelete: () => void; onSuspend: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function close() { setOpen(false); }
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 176) });
    }
    setOpen((o) => !o);
  }

  const menu = (
    <div
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 176 }}
      className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-sm"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Link href={`/students/${student.id}`} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50">
        <Eye className="w-4 h-4 text-gray-400" /> Ver detalle
      </Link>
      <Link href={`/students/${student.id}/edit`} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50">
        <Pencil className="w-4 h-4 text-gray-400" /> Editar alumno
      </Link>
      <div className="border-t border-gray-100 my-1" />
      <button onClick={() => { setOpen(false); onPayment(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-brand-600 hover:bg-brand-50 font-medium">
        <CreditCard className="w-4 h-4" /> Registrar pago
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button onClick={() => { setOpen(false); onSuspend(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-amber-600 hover:bg-amber-50">
        {student.status === 'ACTIVE'
          ? <><UserX className="w-4 h-4" /> Suspender alumno</>
          : <><UserCheck className="w-4 h-4" /> Reactivar alumno</>}
      </button>
      <button onClick={() => { setOpen(false); onDelete(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50">
        <Trash2 className="w-4 h-4" /> Eliminar alumno
      </button>
    </div>
  );

  return (
    <div>
      <button ref={btnRef} onClick={handleToggle} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && createPortal(menu, document.body)}
    </div>
  );
}

/* ─── Mobile student card ─────────────────────────────────── */
function StudentCard({ student, onPayment, onDelete, onSuspend }: {
  student: Student; onPayment: () => void;
  onDelete: () => void; onSuspend: () => void;
}) {
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  return (
    <div className="bg-white rounded-[22px] border border-[#eae6e0] p-4 space-y-3" style={{ boxShadow: '0 2px 10px rgba(26,26,26,0.03)' }}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/students/${student.id}`} className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
            style={{ background: student.isOverdue ? '#fdeeed' : '#f0ece6', color: student.isOverdue ? '#E53935' : '#6b6258' }}>
            {student.photoUrl ? <img src={student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{student.firstName} {student.lastName}</p>
            <p className="text-xs text-gray-400 truncate">{student.email || student.plan?.name || '—'}</p>
          </div>
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Plan */}
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
          {student.plan?.name ?? '—'}
        </span>
        {/* Estado */}
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          student.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500',
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', student.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400')} />
          {student.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
        </span>
        {/* Pago */}
        {student.paymentStatus === 'PARTIAL' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pago parcial
          </span>
        ) : (
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            student.isOverdue ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700',
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', student.isOverdue ? 'bg-red-500' : 'bg-emerald-500')} />
            {student.isOverdue ? 'En mora' : 'Al día'}
          </span>
        )}
      </div>

      {/* Due date row */}
      <div className="flex items-center justify-end text-xs text-gray-500 border-t border-gray-50 pt-2.5">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Vence:</span>
          <span className="font-medium text-gray-700">{student.nextDueDate ? formatDate(student.nextDueDate) : '—'}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={onPayment}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-medium hover:bg-brand-700 active:bg-brand-800 transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5" /> Pago
        </button>
        <Link
          href={`/students/${student.id}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={onSuspend}
          title={student.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
          className="flex items-center justify-center px-3 py-2.5 border border-amber-200 rounded-xl text-amber-600 hover:bg-amber-50 active:bg-amber-100 transition-colors"
        >
          {student.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onDelete}
          title="Eliminar"
          className="flex items-center justify-center px-3 py-2.5 border border-red-200 rounded-xl text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────── */
export function StudentTable({ students, isLoading }: { students: Student[]; isLoading: boolean }) {
  const queryClient = useQueryClient();

  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: () => studentsService.delete(deleteStudent!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteStudent(null);
      setToast({ message: 'Alumno eliminado correctamente', type: 'success' });
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      studentsService.update(id, { status: newStatus } as any),
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setToast({ message: newStatus === 'INACTIVE' ? 'Alumno suspendido' : 'Alumno reactivado', type: 'success' });
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  function openPayment(s: Student) { setPaymentStudent(s); }
  function handleSuspend(s: Student) { suspendMutation.mutate({ id: s.id, newStatus: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }); }

  if (isLoading) {
    return (
      <>
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        {/* Desktop skeleton */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-12 bg-gray-50 border-b border-gray-100" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-50 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-40" />
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="h-4 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <p className="text-gray-400 text-sm">No se encontraron alumnos</p>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Delete confirmation modal ── */}
      <Modal isOpen={!!deleteStudent} onClose={() => setDeleteStudent(null)} title="Eliminar alumno">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro que querés eliminar a <span className="font-semibold text-gray-900">{deleteStudent?.firstName} {deleteStudent?.lastName}</span>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setDeleteStudent(null)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>

      <PaymentFlowModal
        student={paymentStudent}
        onClose={() => setPaymentStudent(null)}
        onSuccess={() => setToast({ message: 'Pago registrado correctamente', type: 'success' })}
      />

      {/* ── Mobile: cards ── */}
      <div className="md:hidden space-y-3">
        {students.map((s) => (
          <StudentCard
            key={s.id}
            student={s}
            onPayment={() => openPayment(s)}
            onDelete={() => setDeleteStudent(s)}
            onSuspend={() => handleSuspend(s)}
          />
        ))}
      </div>

      {/* ── Desktop: table ── */}
      <div className="hidden md:block" style={{ background: '#fff', border: '1px solid #eae6e0', borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 10px rgba(26,26,26,0.03)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfbf9', borderBottom: '1px solid #f0ece6' }}>
                {['Alumno', 'Plan', 'Estado', 'Pago', 'Vencimiento', ''].map((h) => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a39a8e', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();
                const mora = student.isOverdue && student.paymentStatus !== 'PARTIAL';
                return (
                  <tr key={student.id} className="ec-trow" style={{ borderBottom: '1px solid #f6f3ef', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fcfbf9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '15px 20px' }}>
                      <Link href={`/students/${student.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, textDecoration: 'none' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, background: mora ? '#fdeeed' : '#f0ece6', color: mora ? '#E53935' : '#6b6258' }}>
                          {student.photoUrl ? <img src={student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>{student.firstName} {student.lastName}</p>
                          {student.email && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#a39a8e' }}>{student.email}</p>}
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: '15px 20px' }}><span style={{ fontSize: 13.5, color: '#6b6258' }}>{student.plan?.name ?? '—'}</span></td>
                    <td style={{ padding: '15px 20px' }}>
                      <span className="ec-badge" style={{ background: student.status === 'ACTIVE' ? '#e9f6ee' : '#f0ece6', color: student.status === 'ACTIVE' ? '#16a34a' : '#6b6258' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: student.status === 'ACTIVE' ? '#16a34a' : '#a39a8e' }} />
                        {student.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      {student.paymentStatus === 'PARTIAL' ? (
                        <span className="ec-badge" style={{ background: '#fdf4e7', color: '#b45309' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                          Pago parcial
                        </span>
                      ) : (
                        <span className="ec-badge" style={{ background: mora ? '#fdeeed' : '#e9f6ee', color: mora ? '#E53935' : '#16a34a' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: mora ? '#E53935' : '#16a34a' }} />
                          {mora ? 'En mora' : 'Al día'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px 20px' }}><span style={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: mora ? '#E53935' : '#6b6258' }}>{student.nextDueDate ? formatDate(student.nextDueDate) : '—'}</span></td>
                    <td style={{ padding: '15px 12px' }}>
                      <ActionDropdown student={student} onPayment={() => openPayment(student)} onDelete={() => setDeleteStudent(student)} onSuspend={() => handleSuspend(student)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
