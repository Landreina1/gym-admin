'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, ChevronDown, X, SlidersHorizontal, Download } from 'lucide-react';
import { studentsService } from '@/services/students.service';
import { plansService } from '@/services/plans.service';
import { StudentTable } from '@/components/students/StudentTable';
import { cn } from '@/lib/utils';
import { exportPdf } from '@/lib/export';
import Link from 'next/link';


export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await studentsService.getAll({ search, status, planId, limit: 9999 });
      const n = new Date();
      const dateStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      exportPdf({
        title: 'Registro General de Alumnos',
        filename: `Alumnos_Gym_El_Cuba_${dateStr}.pdf`,
        headers: ['Nombre', 'Apellido', 'Cédula', 'Email', 'Teléfono', 'Plan', 'Mensualidad', 'Estado', 'Día cobro', 'Ingreso'],
        rows: res.data.map((s) => [
          s.firstName,
          s.lastName,
          (s as any).cedula || '—',
          s.email || '—',
          s.phone || '—',
          s.plan?.name || '—',
          s.plan?.price ? `$${s.plan.price} USD` : '—',
          s.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
          `Día ${s.billingDay}`,
          s.joinDate ? s.joinDate.slice(0, 10) : '—',
        ]),
      });
    } finally {
      setExporting(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['students', { search, status, planId, page }],
    queryFn: () => studentsService.getAll({ search, status, planId, page, limit: 20 }),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: plansService.getAll,
  });

  const hasFilters = search || status || planId;

  function clearFilters() { setSearch(''); setStatus(''); setPlanId(''); setPage(1); }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="flex flex-col gap-2">
          <div className="ec-eyebrow">Gestión de alumnos</div>
          <h1 className="ec-h1 !text-[30px] md:!text-[40px]">Alumnos</h1>
        </div>
        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={handleExport} disabled={exporting} className="ec-btn-ghost disabled:opacity-50">
            <Download className="w-4 h-4" />
            {exporting ? 'Generando...' : 'Exportar PDF'}
          </button>
          <Link href="/students/new" className="ec-btn-primary">
            <Plus className="w-4 h-4" />
            Nuevo alumno
          </Link>
        </div>
      </div>

      {/* Desktop filter bar */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-[18px] top-1/2 -translate-y-1/2 w-4 h-4 text-[#a39a8e] pointer-events-none" />
          <input
            type="text" placeholder="Buscar alumno…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="ec-field w-full pl-[46px]"
          />
        </div>
        <div className="relative">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={cn('ec-select', status && '!border-[#E53935] !text-[#c2554f]')}>
            <option value="">Estado: todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a39a8e]" />
        </div>
        <div className="relative">
          <select value={planId} onChange={(e) => { setPlanId(e.target.value); setPage(1); }} className={cn('ec-select', planId && '!border-[#E53935] !text-[#c2554f]')}>
            <option value="">Plan: todos</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a39a8e]" />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 h-[48px] text-sm text-[#6b6258] hover:text-[#1a1a1a] hover:bg-[#f0ece6] rounded-full transition-colors">
            <X className="w-3.5 h-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Mobile search + filter toggle */}
      <div className="md:hidden space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-[18px] top-1/2 -translate-y-1/2 w-4 h-4 text-[#a39a8e] pointer-events-none" />
            <input
              type="text" placeholder="Buscar alumno…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="ec-field w-full pl-[46px]"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn('flex items-center gap-1.5 px-4 rounded-full text-sm font-medium transition-colors border',
              filtersOpen || hasFilters
                ? 'border-[#E53935] bg-[#fdeeed] text-[#c2554f]'
                : 'border-[#eae6e0] bg-white text-[#6b6258]',
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasFilters ? 'Filtros' : 'Filtros'}
          </button>
        </div>

        {/* Collapsible mobile filters */}
        {filtersOpen && (
          <div className="bg-white border border-[#eae6e0] rounded-[22px] p-4 space-y-3 overflow-hidden">
            <div className="relative w-full">
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="ec-select w-full">
                <option value="">Todos los estados</option>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a39a8e]" />
            </div>
            <div className="relative w-full">
              <select value={planId} onChange={(e) => { setPlanId(e.target.value); setPage(1); }} className="ec-select w-full">
                <option value="">Todos los planes</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a39a8e]" />
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-[#E53935] hover:bg-[#fdeeed] rounded-full transition-colors border border-[#f3ddda]">
                <X className="w-3.5 h-3.5" /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active filter chips (desktop) */}
      {hasFilters && (
        <div className="hidden md:flex flex-wrap gap-2">
          {search && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
              "{search}"
              <button onClick={() => { setSearch(''); setPage(1); }}><X className="w-3 h-3" /></button>
            </span>
          )}
          {status && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
              {status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              <button onClick={() => { setStatus(''); setPage(1); }}><X className="w-3 h-3" /></button>
            </span>
          )}
          {planId && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
              {plans.find((p) => p.id === planId)?.name ?? 'Plan'}
              <button onClick={() => { setPlanId(''); setPage(1); }}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Table / Cards */}
      <StudentTable students={data?.data ?? []} isLoading={isLoading} />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-gray-400 hidden sm:block">Página {data.page} de {data.totalPages}</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex-1 sm:flex-none px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              ← Anterior
            </button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
              className="flex-1 sm:flex-none px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* FAB — mobile only */}
      <Link
        href="/students/new"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-600/40 flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all z-40"
        aria-label="Nuevo alumno"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
