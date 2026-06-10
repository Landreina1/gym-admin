'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  ArrowUp, ArrowDown, Minus, MoreVertical,
  Eye, Pencil, Scale, CreditCard, ChevronRight,
  Trash2, UserX, UserCheck,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Student } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { weightService } from '@/services/weight.service';
import { studentsService } from '@/services/students.service';
import { PaymentFlowModal } from '@/components/payments/PaymentFlowModal';

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

/* ─── Weight delta ────────────────────────────────────────── */
function WeightBadge({ diff, goal }: { diff: number; goal: string }) {
  const isDown = diff < 0;
  const isUp = diff > 0;
  const isGood = (goal === 'LOSE_WEIGHT' && isDown) || (goal === 'GAIN_WEIGHT' && isUp) || (goal === 'MAINTAIN' && !isDown && !isUp);
  const isBad  = (goal === 'LOSE_WEIGHT' && isUp)   || (goal === 'GAIN_WEIGHT' && isDown);
  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full',
      isGood ? 'bg-green-50 text-green-600' : isBad ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400',
    )}>
      {isDown ? <ArrowDown className="w-3 h-3" /> : isUp ? <ArrowUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {Math.abs(diff)}
    </span>
  );
}

function WeightCell({ records, goal }: { records?: { weight: number; recordedAt: string }[]; goal: string }) {
  if (!records || records.length === 0) return <span className="text-gray-300 text-sm">—</span>;
  const sorted = [...records].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const current = sorted[sorted.length - 1];
  const prev    = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const diff    = prev ? +(current.weight - prev.weight).toFixed(1) : null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-gray-800">{current.weight} kg</span>
      {diff !== null && <WeightBadge diff={diff} goal={goal} />}
    </div>
  );
}

/* ─── Desktop action dropdown (portal) ───────────────────── */
function ActionDropdown({ student, onWeight, onPayment, onDelete, onSuspend }: {
  student: Student; onWeight: () => void; onPayment: () => void;
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
      <button onClick={() => { setOpen(false); onWeight(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50">
        <Scale className="w-4 h-4 text-gray-400" /> Registrar peso
      </button>
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
function StudentCard({ student, onWeight, onPayment, onDelete, onSuspend }: {
  student: Student; onWeight: () => void; onPayment: () => void;
  onDelete: () => void; onSuspend: () => void;
}) {
  const records = student.weightRecords ?? [];
  const sorted = [...records].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/students/${student.id}`} className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
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

      {/* Weight + due date row */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-2.5">
        <div className="flex items-center gap-1">
          <Scale className="w-3.5 h-3.5 text-gray-400" />
          <WeightCell records={sorted} goal={student.goal} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Vence:</span>
          <span className="font-medium text-gray-700">{student.nextDueDate ? formatDate(student.nextDueDate) : '—'}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={onWeight}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <Scale className="w-3.5 h-3.5" /> Peso
        </button>
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
  const today = new Date().toISOString().slice(0, 10);

  const [weightStudent, setWeightStudent] = useState<Student | null>(null);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [weightForm, setWeightForm] = useState({ weight: '', recordedAt: today, notes: '' });

  const weightMutation = useMutation({
    mutationFn: () => weightService.create({ studentId: weightStudent!.id, weight: Number(weightForm.weight), recordedAt: weightForm.recordedAt, notes: weightForm.notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setWeightStudent(null);
      setWeightForm({ weight: '', recordedAt: today, notes: '' });
      setToast({ message: 'Peso registrado correctamente', type: 'success' });
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

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

  function openWeight(s: Student) { setWeightForm({ weight: '', recordedAt: today, notes: '' }); setWeightStudent(s); }
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

      {/* ── Weight modal ── */}
      <Modal isOpen={!!weightStudent} onClose={() => setWeightStudent(null)} title={`Registrar peso — ${weightStudent?.firstName} ${weightStudent?.lastName}`}>
        <form onSubmit={(e) => { e.preventDefault(); weightMutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Peso (kg) *</label>
            <input type="number" step="0.1" required autoFocus value={weightForm.weight} onChange={(e) => setWeightForm((f) => ({ ...f, weight: e.target.value }))} className={inputClass} placeholder="Ej: 72.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha *</label>
            <input type="date" lang="es" required value={weightForm.recordedAt} onChange={(e) => setWeightForm((f) => ({ ...f, recordedAt: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <input type="text" value={weightForm.notes} onChange={(e) => setWeightForm((f) => ({ ...f, notes: e.target.value }))} className={inputClass} placeholder="Opcional" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setWeightStudent(null)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={weightMutation.isPending} className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50">{weightMutation.isPending ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
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
            onWeight={() => openWeight(s)}
            onPayment={() => openPayment(s)}
            onDelete={() => setDeleteStudent(s)}
            onSuspend={() => handleSuspend(s)}
          />
        ))}
      </div>

      {/* ── Desktop: table ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {['Alumno', 'Plan', 'Peso inicial', 'Peso anterior', 'Peso actual', 'Estado', 'Pago', 'Vencimiento', ''].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => {
                const records = student.weightRecords ?? [];
                const sorted = [...records].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
                const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
                return (
                  <tr key={student.id} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      <Link href={`/students/${student.id}`} className="block">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 leading-tight">{student.firstName} {student.lastName}</p>
                        {student.email && <p className="text-xs text-gray-400 mt-0.5">{student.email}</p>}
                      </Link>
                    </td>
                    <td className="px-5 py-4"><span className="text-sm text-gray-600">{student.plan?.name ?? '—'}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-gray-500">{student.initialWeight ? `${student.initialWeight} kg` : '—'}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-gray-500">{prev ? `${prev.weight} kg` : '—'}</span></td>
                    <td className="px-5 py-4"><WeightCell records={sorted} goal={student.goal} /></td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', student.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', student.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400')} />
                        {student.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {student.paymentStatus === 'PARTIAL' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pago parcial
                        </span>
                      ) : (
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', student.isOverdue ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700')}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', student.isOverdue ? 'bg-red-500' : 'bg-emerald-500')} />
                          {student.isOverdue ? 'En mora' : 'Al día'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4"><span className="text-sm text-gray-500">{student.nextDueDate ? formatDate(student.nextDueDate) : '—'}</span></td>
                    <td className="px-3 py-4">
                      <ActionDropdown student={student} onWeight={() => openWeight(student)} onPayment={() => openPayment(student)} onDelete={() => setDeleteStudent(student)} onSuspend={() => handleSuspend(student)} />
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
