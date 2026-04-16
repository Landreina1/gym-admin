'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, Salad, Clock, ChevronDown, ChevronUp, BookOpen, X,
} from 'lucide-react';
import { dietService, type DietTemplate, type Meal } from '@/services/diet.service';
import { Toast } from '@/components/ui/Toast';

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

const EMPTY_MEAL: Meal = { name: '', time: '', foods: '', calories: '', notes: '' };
const MEAL_SUGGESTIONS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Pre-entreno', 'Post-entreno', 'Colación'];

/* ─── Meal editor row ────────────────────────────────────── */
function MealRow({ meal, index, onChange, onRemove }: {
  meal: Meal; index: number;
  onChange: (i: number, m: Meal) => void;
  onRemove: (i: number) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 bg-brand-100 text-brand-600 text-xs font-bold rounded-full flex items-center justify-center">{index + 1}</span>
          <span className="text-sm font-medium text-gray-800">{meal.name || 'Nueva comida'}</span>
          {meal.time && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{meal.time}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(index); }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
            <div className="relative">
              <input value={meal.name ?? ''} onChange={(e) => onChange(index, { ...meal, name: e.target.value })}
                list={`meal-suggestions-${index}`} className={inputCls} placeholder="Ej: Desayuno" />
              <datalist id={`meal-suggestions-${index}`}>
                {MEAL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Horario</label>
            <input type="time" value={meal.time ?? ''} onChange={(e) => onChange(index, { ...meal, time: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Alimentos *</label>
            <textarea value={meal.foods ?? ''} onChange={(e) => onChange(index, { ...meal, foods: e.target.value })}
              rows={2} className={inputCls + ' resize-none'} placeholder="Ej: 2 huevos, 1 taza de avena, 1 banana..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Calorías aprox.</label>
            <input value={meal.calories ?? ''} onChange={(e) => onChange(index, { ...meal, calories: e.target.value })}
              className={inputCls} placeholder="Ej: 450 kcal" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
            <input value={meal.notes ?? ''} onChange={(e) => onChange(index, { ...meal, notes: e.target.value })}
              className={inputCls} placeholder="Sin azúcar, etc." />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Diet modal ─────────────────────────────────────────── */
function DietModal({ diet, onClose, onSave }: {
  diet: DietTemplate | null;
  onClose: () => void;
  onSave: (data: { name: string; description: string; meals: Meal[] }) => void;
}) {
  const [name, setName] = useState(diet?.name ?? '');
  const [description, setDescription] = useState(diet?.description ?? '');
  const [meals, setMeals] = useState<Meal[]>(() => {
    if (!diet?.meals?.length) return [{ ...EMPTY_MEAL, name: 'Desayuno' }];
    return diet.meals.map((m) => ({
      name:     m.name     ?? '',
      time:     m.time     ?? '',
      foods:    m.foods    ?? '',
      calories: m.calories ?? '',
      notes:    m.notes    ?? '',
    }));
  });

  function updateMeal(i: number, m: Meal) { setMeals((prev) => prev.map((x, idx) => idx === i ? m : x)); }
  function removeMeal(i: number) { setMeals((prev) => prev.filter((_, idx) => idx !== i)); }
  function addMeal() { setMeals((prev) => [...prev, { ...EMPTY_MEAL }]); }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{diet ? 'Editar dieta' : 'Nueva dieta'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la dieta *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="Ej: Dieta de volumen" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Objetivos, notas generales..." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">Comidas ({meals.length})</p>
              <button type="button" onClick={addMeal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700">
                <Plus className="w-3.5 h-3.5" /> Agregar comida
              </button>
            </div>
            <div className="space-y-3">
              {meals.map((m, i) => (
                <MealRow key={i} meal={m} index={i} onChange={updateMeal} onRemove={removeMeal} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">Cancelar</button>
          <button
            onClick={() => { if (name && meals.length > 0) onSave({ name, description, meals }); }}
            disabled={!name || meals.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Guardar dieta
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Meal icon by name ──────────────────────────────────── */
function mealEmoji(name: string): string {
  const n = (name ?? '').toLowerCase();
  if (n.includes('desayuno')) return '🌅';
  if (n.includes('almuerzo')) return '🍽️';
  if (n.includes('cena')) return '🌙';
  if (n.includes('merienda') || n.includes('colación')) return '🍎';
  if (n.includes('pre')) return '⚡';
  if (n.includes('post')) return '💪';
  return '🥗';
}

function parseFoods(foods: string): string[] {
  return (foods ?? '')
    .split(/[,\n]+/)
    .map((f) => f.trim())
    .filter(Boolean);
}

/* ─── Single meal block ──────────────────────────────────── */
function MealBlock({ meal, index }: { meal: Meal; index: number }) {
  const items = parseFoods(meal.foods);
  const displayName = meal.name || `Comida ${index + 1}`;
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none flex-shrink-0">{mealEmoji(meal.name)}</span>
          <span className="text-sm font-bold text-gray-900 truncate">{displayName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-gray-400" />
            {meal.time || 'Sin horario'}
          </span>
          {meal.calories && (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {meal.calories}
            </span>
          )}
        </div>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1 pl-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
              <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400 pl-1 italic">Sin alimentos cargados</p>
      )}
      {meal.notes && (
        <p className="text-xs text-gray-400 italic mt-1.5 pl-3">{meal.notes}</p>
      )}
    </div>
  );
}

/* ─── Template card ──────────────────────────────────────── */
const VISIBLE_DEFAULT = 2;

function TemplateCard({ diet, onEdit, onDelete }: { diet: DietTemplate; onEdit: () => void; onDelete: () => void }) {
  const [showAll, setShowAll] = useState(false);
  const visibleMeals = showAll ? diet.meals : diet.meals.slice(0, VISIBLE_DEFAULT);
  const hidden = diet.meals.length - VISIBLE_DEFAULT;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
              🥗
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 leading-snug">{diet.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                {diet.description
                  ? <>{diet.description} · <span className="font-medium text-gray-500">{diet.meals.length} comidas</span></>
                  : <span className="font-medium text-gray-500">{diet.meals.length} comida{diet.meals.length !== 1 ? 's' : ''}</span>
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meal name pills summary */}
        <div className="flex flex-wrap gap-1.5">
          {diet.meals.map((meal, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              <span className="text-xs leading-none">{mealEmoji(meal.name)}</span>
              {meal.name || `Comida ${i + 1}`}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-5" />

      {/* Meals */}
      <div className="p-4 space-y-2.5 flex-1">
        {visibleMeals.map((meal, i) => (
          <MealBlock key={i} meal={meal} index={i} />
        ))}
      </div>

      {/* Show more / less */}
      {diet.meals.length > VISIBLE_DEFAULT && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
          >
            {showAll
              ? <><ChevronUp className="w-3.5 h-3.5" /> Ocultar comidas</>
              : <><ChevronDown className="w-3.5 h-3.5" /> Ver {hidden} comida{hidden !== 1 ? 's' : ''} más</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function DietasPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['diet-templates'],
    queryFn: dietService.getTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dietService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-templates'] });
      setToast({ message: 'Dieta eliminada', type: 'success' });
    },
    onError: (e: Error) => setToast({ message: e.message, type: 'error' }),
  });

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dietas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Dietas para asignar a alumnos</p>
        </div>
        <button
          onClick={() => router.push('/dietas/nueva')}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Nueva dieta
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-gray-700 font-medium">No hay dietas creadas aún</p>
          <p className="text-sm text-gray-400 mt-1">Creá tu primera dieta para asignarla a alumnos</p>
          <button
            onClick={() => router.push('/dietas/nueva')}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 mx-auto"
          >
            <Plus className="w-4 h-4" /> Crear dieta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              diet={t}
              onEdit={() => router.push(`/dietas/${t.id}/editar`)}
              onDelete={() => { if (confirm(`¿Eliminar la dieta "${t.name}"?`)) deleteMutation.mutate(t.id); }}
            />
          ))}
        </div>
      )}

      {/* FAB mobile */}
      <button
        onClick={() => router.push('/dietas/nueva')}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-600/40 flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
