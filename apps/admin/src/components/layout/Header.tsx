'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bell, LogOut, ChevronDown, User, Shield,
  Sliders, Settings, Dumbbell, Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/context/sidebar.context';

interface AdminUser { id: string; name: string; email: string; role: string }

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-8 h-8 text-xs', lg: 'w-11 h-11 text-sm' }[size];
  return (
    <div className={cn('rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold flex-shrink-0', sz)}>
      {initials}
    </div>
  );
}

const MENU_SECTIONS = [
  {
    items: [
      { href: '/perfil',                label: 'Mi perfil',                  icon: User,     desc: 'Datos personales' },
      { href: '/perfil?tab=seguridad',  label: 'Seguridad',                  icon: Shield,   desc: 'Cambiar contraseña' },
      { href: '/perfil?tab=preferencias', label: 'Preferencias',             icon: Sliders,  desc: 'Idioma y tema' },
    ],
  },
  {
    items: [
      { href: '/settings', label: 'Configuración del sistema', icon: Settings, desc: 'Opciones generales' },
    ],
  },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('gym_user');
    if (raw) { try { setUser(JSON.parse(raw)); } catch {} }
  }, [pathname]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function logout() {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    document.cookie = 'gym_token=; path=/; max-age=0';
    router.push('/login');
  }

  const name = user?.name ?? 'Admin';
  const email = user?.email ?? '';
  const roleLabel = user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador';

  return (
    <header className="h-14 md:h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 z-30 flex-shrink-0">

      {/* Left: hamburger (mobile only) */}
      <button
        onClick={toggle}
        className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Menú"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="hidden md:block" />

      {/* Right */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User menu */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              'flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-colors',
              open ? 'bg-gray-100' : 'hover:bg-gray-100',
            )}
          >
            <Avatar name={name} size="sm" />
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">{name}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform hidden sm:block', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/60 py-2 z-50">

              {/* Header */}
              <div className="px-4 py-3 flex items-center gap-3">
                <Avatar name={name} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{email}</p>
                  <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-brand-50 text-brand-600 text-xs font-medium rounded-md">
                    <Dumbbell className="w-2.5 h-2.5" />
                    {roleLabel}
                  </span>
                </div>
              </div>

              <div className="mx-3 border-t border-gray-100 my-1" />

              {MENU_SECTIONS.map((section, si) => (
                <div key={si}>
                  {si > 0 && <div className="mx-3 border-t border-gray-100 my-1" />}
                  {section.items.map(({ href, label, icon: Icon, desc }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 mx-1 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-brand-50 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Icon className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}

              <div className="mx-3 border-t border-gray-100 my-1" />

              <button
                onClick={logout}
                className="flex items-center gap-3 mx-1 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors group w-[calc(100%-8px)]"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-red-600">Cerrar sesión</p>
                  <p className="text-xs text-red-400">Salir del sistema</p>
                </div>
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}
