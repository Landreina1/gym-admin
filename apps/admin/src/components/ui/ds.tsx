/**
 * Design System — Gym Admin
 * Componentes base reutilizables en todo el sistema.
 */
import React from 'react';
import { cn } from '@/lib/utils';

// ─── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({
  title, subtitle, actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="ds-page-header">
      <div>
        <h1 className="ds-page-title">{title}</h1>
        {subtitle && <p className="ds-page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({
  icon, label, value, sub, iconBg = 'bg-brand-50',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  iconBg?: string;
}) {
  return (
    <div className="ds-stat">
      <div className={cn('ds-stat-icon', iconBg)}>{icon}</div>
      <div className="min-w-0">
        <p className="ds-stat-label">{label}</p>
        <p className="ds-stat-value">{value}</p>
        {sub && <p className="ds-stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

// ─── SectionCard ───────────────────────────────────────────────────────────────
export function SectionCard({
  title, subtitle, actions, children, className,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('ds-card', className)}>
      {(title || actions) && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between gap-3">
            {title && (
              <div>
                <p className="ds-section-title">{title}</p>
                {subtitle && <p className="ds-section-sub">{subtitle}</p>}
              </div>
            )}
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'gray' | 'purple';

const BADGE_COLORS: Record<BadgeVariant, string> = {
  green:  'ds-badge-green',
  red:    'ds-badge-red',
  amber:  'ds-badge-amber',
  blue:   'ds-badge-blue',
  gray:   'ds-badge-gray',
  purple: 'ds-badge-purple',
};

export function Badge({
  children, variant = 'gray', dot,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}) {
  return (
    <span className={cn('ds-badge', BADGE_COLORS[variant])}>
      {dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%', display: 'inline-block',
          background: 'currentColor', flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}

// ─── Buttons ───────────────────────────────────────────────────────────────────
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  as?: 'button';
};

function Spinner() {
  return (
    <span className="ds-spinner" style={{ width: 14, height: 14 }} />
  );
}

export function PrimaryBtn({ children, loading, disabled, size = 'md', className, ...props }: BtnProps) {
  const sizeClass = { sm: 'ds-btn-sm', md: '', lg: 'ds-btn-lg' }[size];
  return (
    <button {...props} disabled={disabled || loading} className={cn('ds-btn-primary', sizeClass, className)}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function SecondaryBtn({ children, loading, disabled, size = 'md', className, ...props }: BtnProps) {
  const sizeClass = { sm: 'ds-btn-sm', md: '', lg: 'ds-btn-lg' }[size];
  return (
    <button {...props} disabled={disabled || loading} className={cn('ds-btn-secondary', sizeClass, className)}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function GhostBtn({ children, loading, disabled, size = 'md', className, ...props }: BtnProps) {
  const sizeClass = { sm: 'ds-btn-sm', md: '', lg: 'ds-btn-lg' }[size];
  return (
    <button {...props} disabled={disabled || loading} className={cn('ds-btn-ghost', sizeClass, className)}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function DangerBtn({ children, loading, disabled, size = 'md', className, ...props }: BtnProps) {
  const sizeClass = { sm: 'ds-btn-sm', md: '', lg: 'ds-btn-lg' }[size];
  return (
    <button {...props} disabled={disabled || loading} className={cn('ds-btn-danger', sizeClass, className)}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────
export function Input({
  label, iconLeft, iconRight, className, id, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="ds-field">
      {label && <label htmlFor={inputId} className="ds-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        {iconLeft && (
          <span style={{
            position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-disabled)', pointerEvents: 'none',
            display: 'flex', alignItems: 'center',
          }}>
            {iconLeft}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          className={cn('ds-input', iconLeft && 'ds-input-icon-left', iconRight && 'ds-input-icon-right', className)}
        />
        {iconRight && (
          <span style={{
            position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-disabled)',
            display: 'flex', alignItems: 'center',
          }}>
            {iconRight}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────
export function Tabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: { key: T; label: string; icon?: React.ReactNode; badge?: number }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="ds-tabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn('ds-tab', active === t.key && 'ds-tab-active')}
        >
          {t.icon}
          {t.label}
          {t.badge != null && t.badge > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
              background: active === t.key ? 'var(--brand-600)' : '#e2e8f0',
              color: active === t.key ? '#fff' : 'var(--text-secondary)',
            }}>
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon, title, description, action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="ds-empty">
      {icon && <div className="ds-empty-icon">{icon}</div>}
      <p className="ds-empty-title">{title}</p>
      {description && <p className="ds-empty-desc">{description}</p>}
      {action}
    </div>
  );
}

// ─── ChartCard ─────────────────────────────────────────────────────────────────
export function ChartCard({
  title, subtitle, actions, children, className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('ds-chart-card', className)}>
      <div className="ds-chart-header">
        <div>
          <p className="ds-section-title">{title}</p>
          {subtitle && <p className="ds-section-sub">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

// ─── ModalFooter ───────────────────────────────────────────────────────────────
export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="ds-modal-footer">{children}</div>;
}
