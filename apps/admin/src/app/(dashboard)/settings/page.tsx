'use client';

import { useQuery } from '@tanstack/react-query';
import { User, ShieldCheck, Lock, Clock } from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
  });

  const name = data?.name ?? '—';
  const username = data?.username ?? '—';
  const roleLabel = data?.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador';

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex flex-col gap-2">
        <div className="ec-eyebrow">Tu cuenta</div>
        <h1 className="ec-h1 !text-[30px] md:!text-[40px]">Configuración</h1>
      </div>

      {/* Cuenta (solo lectura) */}
      <div className="ec-card" style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid #f6f3ef' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fdeeed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User style={{ width: 16, height: 16, color: '#E53935' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em' }}>Perfil</p>
            <p style={{ margin: 0, fontSize: 12.5, color: '#a39a8e' }}>Datos de tu cuenta de acceso</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row label="Nombre" value={name} />
          <Row label="Usuario" value={username} mono />
          <Row label="Rol" value={roleLabel} badge />
        </div>
      </div>

      {/* Próximamente */}
      <div style={{ background: '#fff', border: '1px dashed #e2dcd4', borderRadius: 22, padding: '26px 30px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f0ece6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Clock style={{ width: 20, height: 20, color: '#6b6258' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Editar usuario y contraseña</p>
            <span className="ec-badge" style={{ background: '#f0ece6', color: '#6b6258' }}>Próximamente</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#a39a8e', lineHeight: 1.5 }}>
            La edición de usuario y el cambio de contraseña estarán disponibles pronto.
            Si necesitás cambiarlos ahora, contactá al administrador del sistema.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#a39a8e', paddingLeft: 4 }}>
        <ShieldCheck style={{ width: 14, height: 14 }} />
        Tu sesión es privada y segura.
      </div>
    </div>
  );
}

function Row({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 16px', background: '#faf9f7', border: '1px solid #f0ece6', borderRadius: 14 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b6258', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {badge ? (
        <span className="ec-badge" style={{ background: '#fdeeed', color: '#c2554f' }}>{value}</span>
      ) : (
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit' }}>{value}</span>
      )}
    </div>
  );
}
