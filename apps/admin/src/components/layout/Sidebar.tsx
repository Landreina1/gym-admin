'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard,
  Settings, Dumbbell, PackageOpen, X, Salad,
} from 'lucide-react';
import { useSidebar } from '@/context/sidebar.context';

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/students',  label: 'Alumnos', icon: Users },
  { href: '/payments',  label: 'Pagos',   icon: CreditCard },
  { href: '/planes',    label: 'Planes',  icon: PackageOpen },
  { href: '/dietas',    label: 'Dietas',  icon: Salad },
];

function NavItem({ href, label, icon: Icon, isActive, onClick }: {
  href: string; label: string; icon: any; isActive: boolean; onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s',
        background: isActive ? 'var(--sidebar-active)' : 'transparent',
        color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'var(--sidebar-hover)';
          (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.85)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sidebar-text)';
        }
      }}
    >
      {isActive && (
        <span style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%',
          width: 3, borderRadius: 99,
          background: 'var(--sidebar-active-text)',
        }} />
      )}
      <Icon style={{
        width: 16, height: 16, flexShrink: 0,
        color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
      }} />
      {label}
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside style={{
      width: 240,
      background: 'var(--sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative',
    }}>
      {/* Subtle top gradient glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 200,
        background: 'radial-gradient(ellipse at 60% 0%, rgba(220,38,38,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid var(--sidebar-border)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, overflow: 'hidden',
            border: '1px solid rgba(220,38,38,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff',
          }}>
            <img src="/gym-cuba.jpg" alt="Gym El Cuba" style={{ width: 36, height: 36, objectFit: 'cover' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Gym El Cuba</p>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.2 }}>Admin Panel</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'none',
            padding: 6, borderRadius: 8, background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--sidebar-text)',
          }}
          className="mobile-close-btn"
        >
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: '12px 12px', overflowY: 'auto',
        position: 'relative', zIndex: 1,
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '4px 12px 8px', margin: 0,
        }}>
          Menú principal
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ href, label, icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              isActive={isActive(href)}
              onClick={onClose}
            />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--sidebar-border)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <NavItem
          href="/settings"
          label="Configuración"
          icon={Settings}
          isActive={isActive('/settings')}
          onClick={onClose}
        />
      </div>
    </aside>
  );
}

export function Sidebar() {
  const { open, close } = useSidebar();

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .mobile-close-btn { display: flex !important; }
        }
      `}</style>

      {/* Desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <SidebarContent onClose={() => {}} />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={close}
          />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <SidebarContent onClose={close} />
          </div>
        </div>
      )}
    </>
  );
}
