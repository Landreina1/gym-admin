'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, PackageOpen, CheckCircle2 } from 'lucide-react';
import { plansService } from '@/services/plans.service';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import type { Plan } from '@/types';

const inputClass =
  'w-full px-4 py-3 bg-[#faf9f7] border border-[#eae6e0] rounded-2xl text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#E53935] focus:bg-white';

const emptyForm = { name: '', price: '', description: '' };

export default function PlanesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [successMsg, setSuccessMsg] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: plansService.getAll,
  });

  function showSuccessAndClose(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
      setShowModal(false);
      setEditPlan(null);
      setForm(emptyForm);
    }, 1800);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      plansService.create({
        name: form.name,
        price: Number(form.price),
        durationDays: 30,
        description: form.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showSuccessAndClose('Plan creado con éxito ✅');
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      plansService.update(editPlan!.id, {
        name: form.name,
        price: Number(form.price),
        description: form.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showSuccessAndClose('Plan editado con éxito ✅');
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => plansService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setToast({ message: 'Plan eliminado', type: 'success' });
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  function openCreate() {
    setForm(emptyForm);
    setEditPlan(null);
    setSuccessMsg('');
    setShowModal(true);
  }

  function openEdit(plan: Plan) {
    setForm({ name: plan.name, price: String(plan.price), description: plan.description ?? '' });
    setEditPlan(plan);
    setSuccessMsg('');
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editPlan) updateMutation.mutate();
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Parsear descripción como bullet points
  function getBullets(description?: string) {
    if (!description) return [];
    return description.split('\n').map((l) => l.trim()).filter(Boolean);
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="flex flex-col gap-2">
          <div className="ec-eyebrow">{plans.length} plan{plans.length !== 1 ? 'es' : ''} activo{plans.length !== 1 ? 's' : ''}</div>
          <h1 className="ec-h1 !text-[30px] md:!text-[40px]">Planes</h1>
        </div>
        <button onClick={openCreate} className="ec-btn-primary">
          <Plus className="w-4 h-4" />
          Crear plan
        </button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <PackageOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">No hay planes creados todavía</p>
          <button onClick={openCreate} className="mt-4 text-sm text-brand-600 hover:underline">
            Crear el primer plan
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16, alignItems: 'stretch' }}>
          {plans.map((plan) => {
            const bullets = getBullets(plan.description);
            const dark = true;
            return (
              <div key={plan.id} style={{
                background: dark ? '#1a1a1a' : '#fff',
                border: dark ? '1px solid #1a1a1a' : '1px solid #eae6e0',
                borderRadius: 22, padding: 30, display: 'flex', flexDirection: 'column', gap: 22,
                boxShadow: '0 2px 10px rgba(26,26,26,0.03)', color: dark ? '#fff' : '#1a1a1a',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                  <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>{plan.name}</div>
                  <span className="ec-badge" style={{ background: dark ? 'rgba(74,222,128,0.16)' : '#e9f6ee', color: dark ? '#4ade80' : '#16a34a' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dark ? '#4ade80' : '#16a34a' }} />Activo
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: dark ? '#ff8a87' : '#E53935' }}>${Number(plan.price).toLocaleString('es-AR')}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 500, color: dark ? 'rgba(255,255,255,0.55)' : '#a39a8e' }}>/ mes</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {bullets.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: dark ? 'rgba(255,255,255,0.12)' : '#fdeeed', color: dark ? '#fff' : '#E53935' }}>✓</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{b}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => openEdit(plan)} style={{ flex: 1, height: 44, background: 'transparent', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, border: dark ? '1px solid rgba(255,255,255,0.25)' : '1px solid #e2dcd4', color: dark ? '#fff' : '#1a1a1a', transition: 'border-color .15s' }}>Editar plan</button>
                  <button onClick={() => { if (confirm(`¿Eliminar el plan "${plan.name}"?`)) deleteMutation.mutate(plan.id); }}
                    style={{ width: 44, height: 44, background: 'transparent', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: dark ? '1px solid rgba(255,255,255,0.25)' : '1px solid #e2dcd4', color: dark ? 'rgba(255,255,255,0.55)' : '#a39a8e' }}>
                    <Trash2 className="w-[15px] h-[15px]" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Card crear (punteada) */}
          <button type="button" onClick={openCreate}
            style={{ background: 'transparent', border: '2px dashed #e2dcd4', borderRadius: 22, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer', minHeight: 320, fontFamily: 'inherit', transition: 'border-color .15s, background .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E53935'; e.currentTarget.style.background = '#fdfbfa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2dcd4'; e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0ece6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#6b6258' }}>＋</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Crear nuevo plan</div>
              <div style={{ fontSize: 13, color: '#a39a8e' }}>Definí precio y beneficios</div>
            </div>
          </button>
        </div>
      )}

      {/* Modal crear / editar */}
      <Modal
        isOpen={showModal}
        onClose={() => { if (!isPending && !successMsg) { setShowModal(false); setEditPlan(null); } }}
        title={editPlan ? 'Editar plan' : 'Crear nuevo plan'}
      >
        {successMsg ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="text-base font-semibold text-gray-800 text-center">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del plan *</label>
              <input
                type="text"
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="Ej: Plan Mensual"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={form.price}
                onChange={(e) => { const v = e.target.value; if (/^\d*[.,]?\d*$/.test(v)) setForm((f) => ({ ...f, price: v.replace(',', '.') })); }}
                className={inputClass}
                placeholder="Ej: 15000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Qué incluye? <span className="text-gray-400 font-normal">(un ítem por línea)</span>
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputClass + ' resize-none'}
                placeholder={'Acceso a sala de pesas\nClases grupales\nVestuario'}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setEditPlan(null); }} className="ec-btn-ghost flex-1">
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className="ec-btn-primary flex-1" style={{ flex: 1.4 }}>
                {isPending ? 'Guardando...' : editPlan ? 'Guardar cambios' : 'Crear plan'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
