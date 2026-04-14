'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, RefreshCw, Pencil, X, RotateCcw } from 'lucide-react';
import { notificationsService } from '@/services/notifications.service';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { formatDate, cn } from '@/lib/utils';
import type { Notification, NotificationStatus, NotificationType } from '@/types';

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

const TYPE_LABELS: Record<NotificationType, string> = {
  PAYMENT_DUE: 'Pago por vencer',
  PAYMENT_OVERDUE: 'Pago vencido',
  HOLIDAY: 'Feriado',
  ADMIN_NOTICE: 'Aviso administrativo',
};

// Calcula el estado efectivo según la fecha programada
function getEffectiveStatus(n: Notification): NotificationStatus | 'FAILED' {
  if (n.status === 'SENT') return 'SENT';
  if (n.status === 'CANCELLED') return 'CANCELLED';
  if (n.scheduledAt && new Date(n.scheduledAt) > new Date()) return 'SCHEDULED';
  return 'PENDING';
}

type DisplayStatus = NotificationStatus | 'FAILED' | '';

const STATUS_CONFIG: Record<Exclude<DisplayStatus, ''>, { label: string; dot: string; badge: string }> = {
  SCHEDULED: { label: 'Programada',  dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  PENDING:   { label: 'Pendiente',   dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700' },
  SENT:      { label: 'Enviada',     dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  FAILED:    { label: 'Fallida',     dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelada',   dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-500' },
};

const TAB_ORDER: DisplayStatus[] = ['', 'SCHEDULED', 'PENDING', 'SENT', 'FAILED', 'CANCELLED'];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DisplayStatus>('');
  const [createModal, setCreateModal] = useState(false);
  const [editNotif, setEditNotif] = useState<Notification | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    type: 'ADMIN_NOTICE' as NotificationType,
    title: '',
    message: '',
    scheduledAt: '',
  });

  const { data: allNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getAll(),
  });

  // Filtrar por tab con lógica de estado efectivo
  const notifications = allNotifications.filter((n) => {
    if (tab === '') return true;
    return getEffectiveStatus(n) === tab;
  });

  const createMutation = useMutation({
    mutationFn: () =>
      notificationsService.create({
        type: form.type,
        title: form.title,
        message: form.message,
        scheduledAt: form.scheduledAt || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setCreateModal(false);
      setForm({ type: 'ADMIN_NOTICE', title: '', message: '', scheduledAt: '' });
      setToast({ message: 'Notificación creada', type: 'success' });
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  const generateMutation = useMutation({
    mutationFn: notificationsService.generatePaymentDue,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setToast({ message: `Se generaron ${data.generated} notificaciones`, type: 'success' });
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: NotificationStatus }) =>
      notificationsService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  function openEdit(n: Notification) {
    setForm({
      type: n.type,
      title: n.title,
      message: n.message,
      scheduledAt: n.scheduledAt ? n.scheduledAt.slice(0, 16) : '',
    });
    setEditNotif(n);
    setCreateModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  // Contar por tab
  function countFor(s: DisplayStatus) {
    if (s === '') return allNotifications.length;
    return allNotifications.filter((n) => getEffectiveStatus(n) === s).length;
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Modal
        isOpen={createModal}
        onClose={() => { setCreateModal(false); setEditNotif(null); }}
        title={editNotif ? 'Editar notificación' : 'Nueva notificación'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select required value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as NotificationType }))}
              className={inputClass}>
              {(Object.keys(TYPE_LABELS) as NotificationType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" required value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass} placeholder="Título de la notificación" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
            <textarea required value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className={inputClass + ' resize-none'} rows={3} placeholder="Contenido del mensaje" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programar para</label>
            <input type="datetime-local" value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">
              Si la fecha es futura, la notificación quedará como <strong>Programada</strong>.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setCreateModal(false); setEditNotif(null); }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
              {createMutation.isPending ? 'Guardando...' : editNotif ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
            <p className="text-sm text-gray-500 mt-1">Avisos y alertas del sistema</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', generateMutation.isPending && 'animate-spin')} />
              Generar avisos de pago
            </button>
            <button
              onClick={() => { setForm({ type: 'ADMIN_NOTICE', title: '', message: '', scheduledAt: '' }); setEditNotif(null); setCreateModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              <Plus className="w-4 h-4" />
              Nueva notificación
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TAB_ORDER.map((s) => {
            const count = countFor(s);
            const cfg = s !== '' ? STATUS_CONFIG[s] : null;
            return (
              <button
                key={s}
                onClick={() => setTab(s)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  tab === s
                    ? 'bg-brand-600 text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50',
                )}
              >
                {cfg && (
                  <span className={cn('w-2 h-2 rounded-full', tab === s ? 'bg-white' : cfg.dot)} />
                )}
                {s === '' ? 'Todas' : cfg!.label}
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  tab === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-400 text-sm py-8">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No hay notificaciones</p>
            </div>
          ) : (
            notifications.map((n) => {
              const effective = getEffectiveStatus(n);
              const cfg = STATUS_CONFIG[effective];
              return (
                <div key={n.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-400">{TYPE_LABELS[n.type]}</span>
                        <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.badge)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        <span>Creada: {formatDate(n.createdAt)}</span>
                        {n.scheduledAt && <span>Programada: {formatDate(n.scheduledAt)}</span>}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      {effective === 'SCHEDULED' && (
                        <button
                          onClick={() => openEdit(n)}
                          title="Editar"
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      )}
                      {effective === 'FAILED' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: n.id, status: 'PENDING' })}
                          title="Reintentar"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reintentar
                        </button>
                      )}
                      {(effective === 'PENDING' || effective === 'SCHEDULED') && (
                        <button
                          onClick={() => statusMutation.mutate({ id: n.id, status: 'CANCELLED' })}
                          title="Cancelar"
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
