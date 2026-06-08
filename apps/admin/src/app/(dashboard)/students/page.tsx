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

const selectClass =
  'flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none pr-8 w-full';

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
      const total = res.data.length;
      const activos = res.data.filter((s) => s.status === 'ACTIVE').length;
      exportPdf({
        title: 'Reporte de Alumnos',
        subtitle: [search && `Búsqueda: "${search}"`, status && (status === 'ACTIVE' ? 'Activos' : 'Inactivos'), planId && plans.find((p) => p.id === planId)?.name].filter(Boolean).join(' · ') || 'Todos los alumnos',
        summary: [
          { label: 'Total', value: String(total) },
          { label: 'Activos', value: String(activos), color: '#16a34a' },
          { label: 'Inactivos', value: String(total - activos), color: '#dc2626' },
        ],
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Alumnos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.total ?? 0} alumno{(data?.total ?? 0) !== 1 ? 's' : ''} en total</p>
        </div>
        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Generando...' : 'Exportar PDF'}
          </button>
          <Link
            href="/students/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo alumno
          </Link>
        </div>
      </div>

      {/* Desktop filter bar */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text" placeholder="Buscar alumno..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="relative">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={cn(selectClass, 'w-auto', status && 'border-brand-400 text-brand-700 bg-brand-50')}>
            <option value="">Estado</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>
        <div className="relative">
          <select value={planId} onChange={(e) => { setPlanId(e.target.value); setPage(1); }} className={cn(selectClass, 'w-auto', planId && 'border-brand-400 text-brand-700 bg-brand-50')}>
            <option value="">Plan</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-3.5 h-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Mobile search + filter toggle */}
      <div className="md:hidden space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text" placeholder="Buscar alumno..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn('flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors',
              filtersOpen || hasFilters
                ? 'border-brand-400 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-600',
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasFilters ? 'Filtros activos' : 'Filtros'}
          </button>
        </div>

        {/* Collapsible mobile filters */}
        {filtersOpen && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="relative">
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={cn(selectClass, status && 'border-brand-400 text-brand-700 bg-brand-50')}>
                <option value="">Todos los estados</option>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="relative">
              <select value={planId} onChange={(e) => { setPlanId(e.target.value); setPage(1); }} className={cn(selectClass, planId && 'border-brand-400 text-brand-700 bg-brand-50')}>
                <option value="">Todos los planes</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100">
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
