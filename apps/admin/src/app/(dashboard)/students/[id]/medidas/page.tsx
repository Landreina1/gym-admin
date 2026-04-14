'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Save } from 'lucide-react';
import { studentsService } from '@/services/students.service';
import { bodyRecordService } from '@/services/body-record.service';
import { Toast } from '@/components/ui/Toast';

const inputCls = 'w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white';

interface FieldProps { label: string; unit: string; value: string; onChange: (v: string) => void }
function MeasureField({ label, unit, value, onChange }: FieldProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
          placeholder="—"
        />
        <span className="text-sm font-medium text-gray-400 w-8 flex-shrink-0">{unit}</span>
      </div>
    </div>
  );
}

export default function MedidasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [form, setForm] = useState({
    weight: '', height: '', waist: '', abdomen: '', arms: '', legs: '', glutes: '', notes: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: student } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsService.getOne(id),
  });

  const { data: bodyData } = useQuery({
    queryKey: ['body-records', id],
    queryFn: () => bodyRecordService.getByStudent(id),
    enabled: !!id,
  });

  const trackHeight = bodyData?.trackHeight ?? (student as any)?.trackHeight ?? false;

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: any = { studentId: id, recordedAt: date };
      if (form.weight)  payload.weight  = Number(form.weight);
      if (form.waist)   payload.waist   = Number(form.waist);
      if (form.abdomen) payload.abdomen = Number(form.abdomen);
      if (form.arms)    payload.arms    = Number(form.arms);
      if (form.legs)    payload.legs    = Number(form.legs);
      if (form.glutes)  payload.glutes  = Number(form.glutes);
      if (form.notes)   payload.notes   = form.notes;
      if (trackHeight && form.height) payload.height = Number(form.height);
      return bodyRecordService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-records', id] });
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      setToast({ message: 'Medidas registradas correctamente', type: 'success' });
      setTimeout(() => router.push(`/students/${id}`), 1200);
    },
    onError: (e: Error) => setToast({ message: e.message, type: 'error' }),
  });

  const hasAnyValue = Object.values(form).some((v) => v !== '');

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-5 max-w-lg">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Registrar medidas</h1>
            {student && (
              <p className="text-sm text-gray-400 mt-0.5">{student.firstName} {student.lastName}</p>
            )}
          </div>
        </div>

        {/* Date — prominente */}
        <div className="bg-brand-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">Fecha de la medición</span>
          </div>
          <input
            type="date" lang="es"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
          />
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-3">
          <MeasureField label="Peso" unit="kg" value={form.weight} onChange={(v) => set('weight', v)} />
          {trackHeight && (
            <MeasureField label="Estatura" unit="cm" value={form.height} onChange={(v) => set('height', v)} />
          )}
          <MeasureField label="Cintura" unit="cm" value={form.waist} onChange={(v) => set('waist', v)} />
          <MeasureField label="Abdomen" unit="cm" value={form.abdomen} onChange={(v) => set('abdomen', v)} />
          <MeasureField label="Brazos" unit="cm" value={form.arms} onChange={(v) => set('arms', v)} />
          <MeasureField label="Piernas" unit="cm" value={form.legs} onChange={(v) => set('legs', v)} />
          <MeasureField label="Glúteos" unit="cm" value={form.glutes} onChange={(v) => set('glutes', v)} />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notas</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            className={inputCls + ' resize-none'}
            placeholder="Observaciones del día..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 sm:flex-none px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !hasAnyValue}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Guardando...' : 'Guardar medidas'}
          </button>
        </div>
      </div>
    </>
  );
}
