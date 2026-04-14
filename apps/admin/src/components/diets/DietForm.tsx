'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Clock, ChevronDown, ChevronUp, Check, ArrowLeft } from 'lucide-react';
import { dietService, type DietTemplate, type Meal } from '@/services/diet.service';
import { Toast } from '@/components/ui/Toast';

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
const EMPTY_MEAL: Meal = { name: '', time: '', foods: '', calories: '', notes: '' };
const MEAL_SUGGESTIONS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Pre-entreno', 'Post-entreno', 'Colación'];

/* ─── Meal row ───────────────────────────────────────────── */
function MealRow({ meal, index, onChange, onRemove }: {
  meal: Meal; index: number;
  onChange: (i: number, m: Meal) => void;
  onRemove: (i: number) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 bg-brand-100 text-brand-600 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">{index + 1}</span>
          <span className="text-sm font-medium text-gray-800">{meal.name || 'Nueva comida'}</span>
          {meal.time && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />{meal.time}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
            <input
              value={meal.name ?? ''}
              onChange={(e) => onChange(index, { ...meal, name: e.target.value })}
              list={`meal-suggestions-${index}`}
              className={inputCls}
              placeholder="Ej: Desayuno"
            />
            <datalist id={`meal-suggestions-${index}`}>
              {MEAL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Horario</label>
            <input
              type="time"
              value={meal.time ?? ''}
              onChange={(e) => onChange(index, { ...meal, time: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Alimentos *</label>
            <textarea
              value={meal.foods ?? ''}
              onChange={(e) => onChange(index, { ...meal, foods: e.target.value })}
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="Ej: 2 huevos, 1 taza de avena, 1 banana..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Calorías aprox.</label>
            <input
              value={meal.calories ?? ''}
              onChange={(e) => onChange(index, { ...meal, calories: e.target.value })}
              className={inputCls}
              placeholder="Ej: 450 kcal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
            <input
              value={meal.notes ?? ''}
              onChange={(e) => onChange(index, { ...meal, notes: e.target.value })}
              className={inputCls}
              placeholder="Sin azúcar, etc."
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main form ──────────────────────────────────────────── */
interface DietFormProps { diet?: DietTemplate }

export function DietForm({ diet }: DietFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!diet;

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [name, setName] = useState(diet?.name ?? '');
  const [description, setDescription] = useState(diet?.description ?? '');
  const [meals, setMeals] = useState<Meal[]>(() => {
    if (!diet?.meals?.length) return [{ ...EMPTY_MEAL, name: 'Desayuno' }];
    return (diet.meals as Meal[]).map((m) => ({
      name:     m.name     ?? '',
      time:     m.time     ?? '',
      foods:    m.foods    ?? '',
      calories: m.calories ?? '',
      notes:    m.notes    ?? '',
    }));
  });

  function updateMeal(i: number, m: Meal) {
    setMeals((prev) => prev.map((x, idx) => (idx === i ? m : x)));
  }
  function removeMeal(i: number) {
    setMeals((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addMeal() {
    setMeals((prev) => [...prev, { ...EMPTY_MEAL }]);
  }

  const mutation = useMutation({
    mutationFn: () => {
      const data = { name, description, meals };
      if (isEditing) return dietService.updateTemplate(diet.id, data);
      return dietService.createTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-templates'] });
      setToast({
        message: isEditing ? 'Dieta actualizada correctamente' : 'Dieta creada correctamente',
        type: 'success',
      });
      setTimeout(() => router.push('/dietas'), 1200);
    },
    onError: (e: Error) => setToast({ message: e.message, type: 'error' }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || meals.length === 0) return;
    mutation.mutate();
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

        {/* Info general */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Información general</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la dieta *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
                placeholder="Ej: Dieta de volumen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
                placeholder="Objetivos, notas generales..."
              />
            </div>
          </div>
        </div>

        {/* Comidas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Comidas <span className="text-gray-400 font-normal">({meals.length})</span>
            </h2>
            <button
              type="button"
              onClick={addMeal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar comida
            </button>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No hay comidas. Agregá al menos una.
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((m, i) => (
                <MealRow key={i} meal={m} index={i} onChange={updateMeal} onRemove={removeMeal} />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 sm:flex-none px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !name.trim() || meals.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? (
              'Guardando...'
            ) : (
              <><Check className="w-4 h-4" /> {isEditing ? 'Guardar cambios' : 'Crear dieta'}</>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
