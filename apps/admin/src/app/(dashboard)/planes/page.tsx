'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, PackageOpen, CheckCircle2 } from 'lucide-react';
import { plansService } from '@/services/plans.service';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import type { Plan } from '@/types';

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {plans.length} plan{plans.length !== 1 ? 'es' : ''} activo{plans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const bullets = getBullets(plan.description);
            return (
              <div
                key={plan.id}
                className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-base font-semibold text-gray-900">{plan.name}</h2>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Activo
                  </span>
                </div>

                <p className="text-2xl font-bold text-brand-600">
                  ${Number(plan.price).toLocaleString('es-AR')}
                  <span className="text-sm font-normal text-gray-400"> / mes</span>
                </p>

                {bullets.length > 0 && (
                  <ul className="space-y-1">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-brand-500 mt-0.5">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar el plan "${plan.name}"?`)) deleteMutation.mutate(plan.id);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-100 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
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
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditPlan(null); }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : editPlan ? 'Guardar cambios' : 'Crear plan'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
