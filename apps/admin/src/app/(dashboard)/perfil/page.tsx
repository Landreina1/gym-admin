'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  User, Shield, Sliders, Camera, Check,
  Eye, EyeOff, AlertCircle, Loader2, ArrowLeft,
  Mail, Calendar, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminUser { id: string; name: string; email: string; role: string; createdAt?: string }

/* ─── Avatar ──────────────────────────────────────────── */
function AvatarDisplay({ name, src, size = 80 }: { name: string; src?: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold select-none"
      style={{ width: size, height: size, fontSize: size * 0.3 }}>
      {initials}
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────── */
function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={cn('fixed bottom-6 right-4 left-4 sm:left-auto sm:w-80 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium',
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
    )}>
      {type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg}
    </div>
  );
}

const inputCls = 'w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400 transition-shadow';

type Tab = 'info' | 'seguridad' | 'preferencias';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'info',         label: 'Información',  icon: User },
  { id: 'seguridad',    label: 'Seguridad',    icon: Shield },
  { id: 'preferencias', label: 'Preferencias', icon: Sliders },
];

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'info');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [user, setUser] = useState<AdminUser>({ id: '', name: '', email: '', role: 'ADMIN' });
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('gym_user');
    if (raw) { try { setUser(JSON.parse(raw)); } catch {} }
    const av = localStorage.getItem('gym_avatar');
    if (av) setAvatarSrc(av);
  }, []);

  function showToast(msg: string, type: 'success' | 'error') { setToast({ msg, type }); }

  const roleLabel = user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador';

  return (
    <div className="max-w-5xl space-y-4 md:space-y-6">

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Mi perfil</h1>
          <p className="text-sm text-gray-400 hidden md:block">Administrá tu cuenta y preferencias</p>
        </div>
      </div>

      {/* 2-column layout: stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 md:gap-6 items-start">

        {/* ── LEFT: Profile card ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            {/* Avatar */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <AvatarDisplay name={user.name || 'A'} src={avatarSrc} size={88} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center shadow-md hover:bg-brand-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const src = ev.target?.result as string;
                      setAvatarSrc(src);
                      localStorage.setItem('gym_avatar', src);
                      showToast('Foto actualizada', 'success');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>

              <p className="text-lg font-bold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-400 mt-0.5 truncate max-w-full">{user.email}</p>

              <span className="inline-flex items-center mt-2 px-2.5 py-1 bg-brand-50 text-brand-600 text-xs font-semibold rounded-full">
                {roleLabel}
              </span>

              <button
                onClick={() => fileRef.current?.click()}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Camera className="w-4 h-4" /> Cambiar foto
              </button>
            </div>

            {/* Meta info */}
            <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <span className="truncate">{user.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <Clock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <span>Último acceso: hoy</span>
              </div>
              {user.createdAt && (
                <div className="flex items-center gap-2.5 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span>Desde: {new Date(user.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Tab content ── */}
        <div className="space-y-4">

          {/* Tab nav */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn('flex items-center gap-2 px-4 md:px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
                    tab === id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700',
                  )}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
            <div className="p-4 md:p-6">
              {tab === 'info' && <InfoTab user={user} onSuccess={(u) => { setUser(u); localStorage.setItem('gym_user', JSON.stringify(u)); showToast('Perfil actualizado', 'success'); }} onError={(m) => showToast(m, 'error')} />}
              {tab === 'seguridad' && <SecurityTab onSuccess={() => showToast('Contraseña actualizada', 'success')} onError={(m) => showToast(m, 'error')} />}
              {tab === 'preferencias' && <PreferencesTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense>
      <PerfilContent />
    </Suspense>
  );
}

/* ─── Info Tab ────────────────────────────────────────── */
function InfoTab({ user, onSuccess, onError }: { user: AdminUser; onSuccess: (u: AdminUser) => void; onError: (m: string) => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  useEffect(() => { setName(user.name); setEmail(user.email); }, [user.name, user.email]);

  const mutation = useMutation({
    mutationFn: () => api.patch('/auth/me', { name, email }).then((r) => r.data),
    onSuccess: (data) => onSuccess({ ...user, name: data.name, email: data.email }),
    onError: (e: Error) => onError(e.message),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="Tu nombre" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
      </div>
      <button type="submit" disabled={mutation.isPending}
        className="flex items-center gap-2 px-5 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors w-full sm:w-auto justify-center">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}

/* ─── Security Tab ────────────────────────────────────── */
function SecurityTab({ onSuccess, onError }: { onSuccess: () => void; onError: (m: string) => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.patch('/auth/me/password', { currentPassword: current, newPassword: next }).then((r) => r.data),
    onSuccess: () => { setCurrent(''); setNext(''); setConfirm(''); onSuccess(); },
    onError: (e: Error) => onError(e.message),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (next !== confirm) { onError('Las contraseñas no coinciden'); return; } mutation.mutate(); }} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña actual</label>
        <div className="relative">
          <input type={showC ? 'text' : 'password'} value={current} onChange={(e) => setCurrent(e.target.value)} required className={inputCls + ' pr-11'} placeholder="••••••••" />
          <button type="button" onClick={() => setShowC(!showC)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
            {showC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
          <div className="relative">
            <input type={showN ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} required className={inputCls + ' pr-11'} placeholder="Mínimo 6 caracteres" />
            <button type="button" onClick={() => setShowN(!showN)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              {showN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {next && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={cn('h-1 flex-1 rounded-full',
                    next.length >= i*3 ? i<=1 ? 'bg-red-400' : i<=2 ? 'bg-orange-400' : i<=3 ? 'bg-yellow-400' : 'bg-emerald-500' : 'bg-gray-100',
                  )} />
                ))}
              </div>
              <p className="text-xs text-gray-400">{next.length < 6 ? 'Muy corta' : next.length < 9 ? 'Débil' : next.length < 12 ? 'Moderada' : 'Fuerte'}</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            className={cn(inputCls, confirm && next && confirm !== next && 'border-red-300 focus:ring-red-400')} placeholder="Repetí la nueva contraseña" />
          {confirm && next && confirm !== next && <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>}
        </div>
      </div>
      <button type="submit" disabled={mutation.isPending || (!!confirm && next !== confirm)}
        className="flex items-center gap-2 px-5 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors w-full sm:w-auto justify-center">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        {mutation.isPending ? 'Actualizando...' : 'Actualizar contraseña'}
      </button>
    </form>
  );
}

/* ─── Preferences Tab ─────────────────────────────────── */
function PreferencesTab() {
  const [theme, setTheme] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('gym_theme') ?? 'light' : 'light');
  const [lang, setLang] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('gym_lang') ?? 'es' : 'es');
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem('gym_theme', theme);
    localStorage.setItem('gym_lang', lang);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Apariencia</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Claro', bg: 'bg-white' },
            { value: 'dark', label: 'Oscuro', bg: 'bg-gray-900' },
            { value: 'system', label: 'Sistema', bg: 'bg-gradient-to-br from-white to-gray-900' },
          ].map(({ value, label, bg }) => (
            <button key={value} onClick={() => setTheme(value)}
              className={cn('relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                theme === value ? 'border-brand-500 ring-2 ring-brand-100' : 'border-gray-200 hover:border-gray-300',
              )}>
              <div className={cn('w-full h-10 rounded-lg border border-gray-200', bg)} />
              <span className="text-xs font-medium text-gray-700">{label}</span>
              {theme === value && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Modo oscuro disponible próximamente</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Idioma</p>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className={inputCls}>
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="pt">Português</option>
        </select>
      </div>
      <button onClick={save}
        className="flex items-center gap-2 px-5 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors w-full sm:w-auto justify-center">
        {saved ? <Check className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
        {saved ? '¡Guardado!' : 'Guardar preferencias'}
      </button>
    </div>
  );
}
