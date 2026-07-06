'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { User, CreditCard, CheckCircle2, Info, DollarSign } from 'lucide-react';
import { studentsService } from '@/services/students.service';
import { plansService } from '@/services/plans.service';
import type { Student, StudentGoal } from '@/types';
import { Toast } from '@/components/ui/Toast';

interface StudentFormProps { student?: Student }

const INPUT = [
  'w-full h-[50px] px-5 border border-[#eae6e0] rounded-full text-sm text-[#1a1a1a] bg-[#faf9f7]',
  'placeholder:text-[#a39a8e] outline-none transition-colors',
  'focus:border-[#E53935] focus:bg-white',
].join(' ');

const SELECT = INPUT + ' appearance-none cursor-pointer pr-10';

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#6b6258', paddingLeft: 18, marginBottom: 7 }}>
      {children}
      {required && <span style={{ color: '#E53935', marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #eae6e0', boxShadow: '0 2px 10px rgba(26,26,26,0.03)', padding: '26px 30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid #f6f3ef' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fdeeed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} aria-pressed={checked}
      style={{ width: 44, height: 24, borderRadius: 99, border: 'none', padding: 2, cursor: 'pointer', flexShrink: 0,
        background: checked ? '#EF4444' : '#E5E7EB', transition: 'background 0.2s ease' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transition: 'transform 0.2s ease',
        transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function StudentForm({ student }: StudentFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!student;

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const localToday = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  };

  const [form, setForm] = useState({
    firstName:     student?.firstName ?? '',
    lastName:      student?.lastName ?? '',
    cedula:        (student as any)?.cedula ?? '',
    email:         student?.email ?? '',
    phone:         student?.phone ?? '',
    birthDate:     student?.birthDate ? student.birthDate.slice(0, 10) : '',
    joinDate:      student?.joinDate ? student.joinDate.slice(0, 10) : localToday(),
    billingDay:    student?.billingDay ?? 1,
    status:        student?.status ?? 'ACTIVE',
    notes:         student?.notes ?? '',
    planId:        student?.planId ?? '',
    allergies:     (student as any)?.allergies ?? '',
    isCeliac:      (student as any)?.isCeliac ?? false,
    // kept for API compatibility
    goal:          (student?.goal ?? 'MAINTAIN') as StudentGoal,
    height:        student?.height ?? '',
    initialWeight: student?.initialWeight ?? '',
    monthlyGoalKg: student?.monthlyGoalKg ?? '',
    waist:         (student as any)?.waist ?? '',
    abdomen:       (student as any)?.abdomen ?? '',
    arms:          (student as any)?.arms ?? '',
    legs:          (student as any)?.legs ?? '',
    glutes:        (student as any)?.glutes ?? '',
    trackHeight:   (student as any)?.trackHeight ?? false,
  });

  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: plansService.getAll });
  const selectedPlan = plans.find((p) => p.id === form.planId);

  const set = (field: string, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        firstName:     form.firstName,
        lastName:      form.lastName,
        cedula:        form.cedula,
        email:         form.email      || undefined,
        phone:         form.phone      || undefined,
        birthDate:     form.birthDate  || undefined,
        joinDate:      form.joinDate   || undefined,
        billingDay:    Number(form.billingDay),
        status:        form.status,
        planId:        form.planId,
        goal:          form.goal,
        notes:         form.notes      || undefined,
        height:        form.height        ? Number(form.height)        : undefined,
        initialWeight: form.initialWeight ? Number(form.initialWeight) : undefined,
        monthlyGoalKg: form.monthlyGoalKg ? Number(form.monthlyGoalKg) : undefined,
      };
      if (isEditing) return studentsService.update(student.id, payload);
      return studentsService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (isEditing) queryClient.invalidateQueries({ queryKey: ['student', student.id] });
      setToast({ message: isEditing ? 'Alumno actualizado correctamente' : 'Alumno creado correctamente', type: 'success' });
      setTimeout(() => router.push('/students'), 1500);
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  const tips = [
    'Los campos marcados con * son obligatorios.',
    'Puedes completar la fecha de nacimiento más adelante.',
    'El historial de pagos comenzará a registrarse desde que empieces a usar el sistema.',
    'La información puede editarse posteriormente.',
  ];

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, alignItems: 'start' }}
          className="lg:grid-cols-[1fr_288px]">

          {/* ── LEFT: form cards ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* DATOS PERSONALES */}
            <Card icon={<User style={{ width: 16, height: 16, color: '#EF4444' }} />} title="Datos Personales">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Nombre</Label>
                  <input required type="text" value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    className={INPUT} placeholder="Juan" />
                </div>
                <div>
                  <Label required>Apellido</Label>
                  <input required type="text" value={form.lastName}
                    onChange={(e) => set('lastName', e.target.value)}
                    className={INPUT} placeholder="Pérez" />
                </div>
                <div>
                  <Label required>Cédula</Label>
                  <input required type="text" value={form.cedula}
                    onChange={(e) => set('cedula', e.target.value)}
                    className={INPUT} placeholder="V-12345678" />
                </div>
                <div>
                  <Label required>Teléfono</Label>
                  <input required type="tel" value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    className={INPUT} placeholder="0412-1234567" />
                </div>
                <div>
                  <Label>Correo electrónico</Label>
                  <input type="email" value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className={INPUT} placeholder="ejemplo@email.com" />
                </div>
                <div>
                  <Label>Fecha de nacimiento</Label>
                  <input type="date" lang="es" value={form.birthDate}
                    onChange={(e) => set('birthDate', e.target.value)}
                    className={INPUT} />
                </div>
              </div>
            </Card>

            {/* PLAN Y COBRO */}
            <Card icon={<CreditCard style={{ width: 16, height: 16, color: '#EF4444' }} />} title="Plan y Cobro">
              <div className="grid sm:grid-cols-2 gap-4">

                {/* Plan selector — full width */}
                <div className="sm:col-span-2">
                  <Label required>Plan</Label>
                  <SelectWrapper>
                    <select required value={form.planId}
                      onChange={(e) => set('planId', e.target.value)}
                      className={SELECT}>
                      <option value="">Selecciona un plan...</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </SelectWrapper>

                  {/* Dynamic price display */}
                  {selectedPlan && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
                      <DollarSign style={{ width: 13, height: 13, color: '#16a34a', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>${selectedPlan.price} USD / mes</span>
                      {selectedPlan.description && (
                        <span style={{ fontSize: 11, color: '#4B7A5A', marginLeft: 2 }}>· {selectedPlan.description}</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label required>Fecha de ingreso</Label>
                  <input required type="date" lang="es" value={form.joinDate}
                    onChange={(e) => set('joinDate', e.target.value)}
                    className={INPUT} />
                </div>

                <div>
                  <Label required>Día de cobro (1–31)</Label>
                  <input required type="number" min={1} max={31} value={form.billingDay}
                    onChange={(e) => set('billingDay', e.target.value)}
                    className={INPUT} placeholder="Ej: 5" />
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 7, lineHeight: 1.4 }}>
                    Indica qué día del mes debe realizarse el pago.
                  </p>
                </div>
              </div>
            </Card>

            {/* INFORMACIÓN ADICIONAL — comentado para futuro uso
            <Card icon={<ClipboardList style={{ width: 16, height: 16, color: '#EF4444' }} />} title="Información Adicional">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <Label>Alergias</Label>
                  <input type="text" value={form.allergies}
                    onChange={(e) => set('allergies', e.target.value)}
                    className={INPUT} placeholder="Ej: maní, lactosa, gluten..." />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>Es celíaco/a</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '3px 0 0' }}>Intolerancia al gluten</p>
                  </div>
                  <Toggle checked={form.isCeliac} onChange={() => set('isCeliac', !form.isCeliac)} />
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <textarea value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    rows={3} className={INPUT + ' resize-none'}
                    placeholder="Observaciones sobre el alumno..." />
                </div>
              </div>
            </Card>
            */}

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 4, paddingBottom: 16 }}>
              <button type="button" onClick={() => router.back()}
                style={{ flex: 1, height: 52, borderRadius: 99, border: '1px solid #e2dcd4', background: '#fff', fontSize: 14, fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                Cancelar
              </button>
              <button type="submit" disabled={mutation.isPending}
                style={{ flex: 1.4, height: 52, borderRadius: 99, border: 'none', fontSize: 14, fontWeight: 700, color: '#fff', cursor: mutation.isPending ? 'not-allowed' : 'pointer', background: mutation.isPending ? '#e8b5b3' : '#E53935', boxShadow: mutation.isPending ? 'none' : '0 6px 18px rgba(229,57,53,0.25)', transition: 'background 0.15s' }}>
                {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar alumno'}
              </button>
            </div>
          </div>

          {/* ── RIGHT: help card (sticky) ─────────────────────── */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Info style={{ width: 14, height: 14, color: '#3B82F6' }} />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>Información importante</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 style={{ width: 14, height: 14, color: '#10B981', marginTop: 1, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.55, margin: 0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </form>
    </>
  );
}
