'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';

interface AdminUser { id: string; name: string; email: string; role: string }

const NAV = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/students',  label: 'Alumnos' },
  { href: '/payments',  label: 'Pagos' },
  { href: '/planes',    label: 'Planes' },
  // Dietas oculto hasta futuro
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('gym_user');
    if (raw) { try { setUser(JSON.parse(raw)); } catch {} }
  }, [pathname]);

  useEffect(() => {
    function syncUser() {
      const raw = localStorage.getItem('gym_user');
      if (raw) { try { setUser(JSON.parse(raw)); } catch {} }
    }
    window.addEventListener('gym-user-updated', syncUser);
    return () => window.removeEventListener('gym-user-updated', syncUser);
  }, []);

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
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="ec-hdr">
      <style>{`
        .ec-hdr {
          background: var(--surface-page);
          border-bottom: 1px solid var(--border-default);
          height: 68px;
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
        }
        .ec-hdr-left { display: flex; align-items: center; gap: 40px; min-width: 0; }
        .ec-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .ec-brand .ec-logo { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #eae6e0; flex-shrink: 0; }
        .ec-brand .name { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; color: #1a1a1a; white-space: nowrap; }
        .ec-nav { display: flex; align-items: center; gap: 4px; min-width: 0; }
        .ec-nav a {
          padding: 8px 16px; border-radius: 99px; color: #6b6258;
          font-size: 13.5px; font-weight: 500; text-decoration: none;
          transition: background .15s, color .15s; white-space: nowrap;
        }
        .ec-nav a:hover { background: #f0ece6; color: #1a1a1a; }
        .ec-nav a.active { background: #1a1a1a; color: #fff; font-weight: 600; }
        .ec-avatar {
          width: 38px; height: 38px; background: #E53935; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; border-radius: 50%; border: none; cursor: pointer;
        }
        @media (max-width: 880px) {
          .ec-hdr { padding: 0 16px; gap: 12px; }
          .ec-hdr-left { gap: 14px; flex: 1 1 auto; }
          .ec-nav { overflow-x: auto; }
          .ec-nav::-webkit-scrollbar { display: none; }
          .ec-brand .name { display: none; }
        }
      `}</style>

      <div className="ec-hdr-left">
        <Link href="/dashboard" className="ec-brand">
          <img src="/logo.png" alt="Gym El Cuba" className="ec-logo" />
          <span className="name">Gym El Cuba</span>
        </Link>
        <nav className="ec-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Avatar + dropdown */}
      <div style={{ position: 'relative', flexShrink: 0 }} ref={ref}>
        <button className="ec-avatar" onClick={() => setOpen(!open)} aria-label="Cuenta">
          {initials}
        </button>

        {open && (
          <div style={{
            position: 'absolute', right: 0, marginTop: 10, width: 264,
            background: '#fff', borderRadius: 18, border: '1px solid #eae6e0',
            boxShadow: '0 12px 32px rgba(26,26,26,0.12)', padding: 8, zIndex: 50,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E53935', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#a39a8e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
                <span style={{ display: 'inline-block', marginTop: 3, padding: '2px 8px', background: '#fdeeed', color: '#c2554f', fontSize: 11, fontWeight: 600, borderRadius: 99 }}>{roleLabel}</span>
              </div>
            </div>

            <div style={{ height: 1, background: '#f0ece6', margin: '6px 8px' }} />

            <Link href="/settings" onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', color: '#1a1a1a' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#faf9f7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <Settings style={{ width: 17, height: 17, color: '#6b6258' }} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Configuración</span>
            </Link>

            <button onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left', color: '#E53935' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fdeeed')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <LogOut style={{ width: 17, height: 17 }} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
