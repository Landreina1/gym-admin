'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { studentsService } from '@/services/students.service';
import { plansService } from '@/services/plans.service';
import type { Student, StudentGoal } from '@/types';
import { Toast } from '@/components/ui/Toast';

interface StudentFormProps { student?: Student }

const GOAL_OPTIONS: { value: StudentGoal; label: string }[] = [
  { value: 'LOSE_WEIGHT', label: 'Bajar de peso' },
  { value: 'GAIN_WEIGHT', label: 'Subir de peso' },
  { value: 'MAINTAIN', label: 'Mantener' },
];

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6">
      <h2 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children, full }: { label: string; required?: boolean; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  );
}

export function StudentForm({ student }: StudentFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!student;

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    firstName:      student?.firstName ?? '',
    lastName:       student?.lastName ?? '',
    email:          student?.email ?? '',
    phone:          student?.phone ?? '',
    birthDate:      student?.birthDate ? student.birthDate.slice(0, 10) : '',
    joinDate:       student?.joinDate ? student.joinDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    billingDay:     student?.billingDay ?? 1,
    height:         student?.height ?? '',
    initialWeight:  student?.initialWeight ?? '',
    goal:           (student?.goal ?? 'MAINTAIN') as StudentGoal,
    monthlyGoalKg:  student?.monthlyGoalKg ?? '',
    status:         student?.status ?? 'ACTIVE',
    notes:          student?.notes ?? '',
    planId:         student?.planId ?? '',
    // Salud
    allergies:      (student as any)?.allergies ?? '',
    isCeliac:       (student as any)?.isCeliac ?? false,
    trackHeight:    (student as any)?.trackHeight ?? false,
    // Medidas
    waist:          (student as any)?.waist ?? '',
    abdomen:        (student as any)?.abdomen ?? '',
    arms:           (student as any)?.arms ?? '',
    legs:           (student as any)?.legs ?? '',
    glutes:         (student as any)?.glutes ?? '',
  });

  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: plansService.getAll });

  const set = (field: string, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        billingDay:    Number(form.billingDay),
        height:        form.height        ? Number(form.height)        : undefined,
        initialWeight: form.initialWeight ? Number(form.initialWeight) : undefined,
        monthlyGoalKg: form.monthlyGoalKg ? Number(form.monthlyGoalKg) : undefined,
        waist:         form.waist         ? Number(form.waist)         : undefined,
        abdomen:       form.abdomen       ? Number(form.abdomen)       : undefined,
        arms:          form.arms          ? Number(form.arms)          : undefined,
        legs:          form.legs          ? Number(form.legs)          : undefined,
        glutes:        form.glutes        ? Number(form.glutes)        : undefined,
        birthDate:     form.birthDate  || undefined,
        joinDate:      form.joinDate   || undefined,
        email:         form.email      || undefined,
        phone:         form.phone      || undefined,
        notes:         form.notes      || undefined,
        allergies:     form.allergies  || undefined,
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

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4 max-w-2xl">

        {/* Datos personales */}
        <Section title="Datos personales">
          <Field label="Nombre" required>
            <input type="text" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Apellido" required>
            <input type="text" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Teléfono">
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Fecha de nacimiento">
            <input type="date" lang="es" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Estado">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </Field>
        </Section>

        {/* Plan y cobro */}
        <Section title="Plan y cobro">
          <Field label="Plan" required>
            <select required value={form.planId} onChange={(e) => set('planId', e.target.value)} className={inputClass}>
              <option value="">Seleccioná un plan</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>)}
            </select>
          </Field>
          <Field label="Día de cobro (1-31)" required>
            <input type="number" required min={1} max={31} value={form.billingDay} onChange={(e) => set('billingDay', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Fecha de ingreso" required>
            <input type="date" lang="es" required value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} className={inputClass} />
          </Field>
        </Section>

        {/* Físico y metas */}
        <Section title="Físico y metas">
          <Field label="Altura (cm)">
            <input type="number" value={form.height} onChange={(e) => set('height', e.target.value)} className={inputClass} placeholder="Ej: 175" />
          </Field>
          <Field label="">
            <label className="flex items-center gap-3 cursor-pointer mt-1">
              <div
                onClick={() => set('trackHeight', !form.trackHeight)}
                className={`relative w-10 h-5 rounded-full transition-colors ${(form as any).trackHeight ? 'bg-brand-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(form as any).trackHeight ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Registrar estatura en el tiempo</span>
            </label>
          </Field>
          {!isEditing && (
            <Field label="Peso inicial (kg)">
              <input type="number" step="0.1" value={form.initialWeight} onChange={(e) => set('initialWeight', e.target.value)} className={inputClass} placeholder="Ej: 70.5" />
            </Field>
          )}
          <Field label="Meta" required>
            <select required value={form.goal} onChange={(e) => set('goal', e.target.value)} className={inputClass}>
              {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Meta mensual (kg)">
            <input type="number" step="0.1" value={form.monthlyGoalKg} onChange={(e) => set('monthlyGoalKg', e.target.value)} className={inputClass} placeholder="Ej: 2" />
          </Field>
        </Section>

        {/* Medidas corporales */}
        <Section title="Medidas corporales (cm)">
          <Field label="Cintura">
            <input type="number" step="0.1" value={form.waist} onChange={(e) => set('waist', e.target.value)} className={inputClass} placeholder="cm" />
          </Field>
          <Field label="Abdomen">
            <input type="number" step="0.1" value={form.abdomen} onChange={(e) => set('abdomen', e.target.value)} className={inputClass} placeholder="cm" />
          </Field>
          <Field label="Brazos">
            <input type="number" step="0.1" value={form.arms} onChange={(e) => set('arms', e.target.value)} className={inputClass} placeholder="cm" />
          </Field>
          <Field label="Piernas">
            <input type="number" step="0.1" value={form.legs} onChange={(e) => set('legs', e.target.value)} className={inputClass} placeholder="cm" />
          </Field>
          <Field label="Glúteos">
            <input type="number" step="0.1" value={form.glutes} onChange={(e) => set('glutes', e.target.value)} className={inputClass} placeholder="cm" />
          </Field>
        </Section>

        {/* Salud */}
        <Section title="Salud">
          <Field label="Alergias" full>
            <input type="text" value={form.allergies} onChange={(e) => set('allergies', e.target.value)} className={inputClass} placeholder="Ej: maní, lactosa, gluten..." />
          </Field>
          <Field label="" full>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set('isCeliac', !form.isCeliac)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isCeliac ? 'bg-brand-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isCeliac ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Es celíaco/a</span>
            </label>
          </Field>
        </Section>

        {/* Notas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">Notas</h2>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3}
            className={inputClass + ' resize-none'} placeholder="Observaciones sobre el alumno..." />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 sm:flex-none px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="flex-1 sm:flex-none px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear alumno'}
          </button>
        </div>
      </form>
    </>
  );
}
