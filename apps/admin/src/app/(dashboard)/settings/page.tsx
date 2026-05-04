'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Lock, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileReady, setProfileReady] = useState(false);

  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      if (!profileReady) {
        setProfileForm({ name: data.name, email: data.email });
        setProfileReady(true);
      }
      return data;
    },
  });

  const profileMutation = useMutation({
    mutationFn: () => api.patch('/auth/me', { name: profileForm.name, email: profileForm.email }),
    onSuccess: () => setToast({ message: 'Perfil actualizado', type: 'success' }),
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  const passMutation = useMutation({
    mutationFn: () => api.post('/auth/change-password', {
      currentPassword: passForm.currentPassword,
      newPassword: passForm.newPassword,
    }),
    onSuccess: () => {
      setToast({ message: 'Contraseña actualizada', type: 'success' });
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="ds-page-title">Configuración</h1>
          <p className="ds-page-sub">Gestión de tu cuenta</p>
        </div>

        <div className="ds-card-p">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl" style={{ background: 'var(--brand-50)' }}>
              <User className="w-5 h-5" style={{ color: 'var(--brand-600)' }} />
            </div>
            <div>
              <p className="ds-section-title">Perfil</p>
              <p className="ds-section-sub">Nombre y email de acceso</p>
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(); }} className="space-y-4">
            <div className="ds-field">
              <label className="ds-label">Nombre</label>
              <input
                className="ds-input"
                value={profileForm.name}
                onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="ds-field">
              <label className="ds-label">Email</label>
              <input
                type="email"
                className="ds-input"
                value={profileForm.email}
                onChange={(e) => setProfileForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={profileMutation.isPending} className="ds-btn-primary ds-btn-sm">
                <Save className="w-4 h-4" />
                {profileMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>

        <div className="ds-card-p">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl" style={{ background: 'var(--brand-50)' }}>
              <Lock className="w-5 h-5" style={{ color: 'var(--brand-600)' }} />
            </div>
            <div>
              <p className="ds-section-title">Contraseña</p>
              <p className="ds-section-sub">Cambia tu contraseña de acceso</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (passForm.newPassword !== passForm.confirm) {
                setToast({ message: 'Las contraseñas no coinciden', type: 'error' });
                return;
              }
              passMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="ds-field">
              <label className="ds-label">Contraseña actual</label>
              <input
                type="password"
                className="ds-input"
                value={passForm.currentPassword}
                onChange={(e) => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="ds-field">
              <label className="ds-label">Nueva contraseña</label>
              <input
                type="password"
                className="ds-input"
                value={passForm.newPassword}
                onChange={(e) => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="ds-field">
              <label className="ds-label">Confirmar nueva contraseña</label>
              <input
                type="password"
                className="ds-input"
                value={passForm.confirm}
                onChange={(e) => setPassForm(f => ({ ...f, confirm: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={passMutation.isPending} className="ds-btn-primary ds-btn-sm">
                <Lock className="w-4 h-4" />
                {passMutation.isPending ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
