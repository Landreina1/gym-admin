'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Eye, EyeOff, Mail, Lock, CheckCircle,
  ArrowRight, Users, CreditCard, Salad, Dumbbell,
} from 'lucide-react';

const FEATURES = [
  { icon: Users,      title: 'Alumnos',  desc: 'Seguimiento y métricas en tiempo real' },
  { icon: CreditCard, title: 'Pagos',    desc: 'Control de cobros y vencimientos' },
  { icon: Salad,      title: 'Dietas',   desc: 'Planes nutricionales personalizados' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [touched,  setTouched]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!touched) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('gym_token', data.token);
      localStorage.setItem('gym_user', JSON.stringify(data.user));
      document.cookie = `gym_token=${data.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Strict`;
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch {
      setError('Email o contraseña incorrectos');
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
          background: #f4f6f9;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          display: none;
          width: 52%;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          position: relative;
          overflow: hidden;
          background-color: #0a0a0a;
        }

        /* red glow accents */
        .login-left::before {
          content: '';
          position: absolute;
          bottom: -120px; right: -120px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(229,57,53,0.22) 0%, transparent 65%);
          pointer-events: none;
        }
        .login-left::after {
          content: '';
          position: absolute;
          top: -80px; left: -80px;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(229,57,53,0.10) 0%, transparent 65%);
          pointer-events: none;
        }

        /* ── Brand badge ── */
        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 2;
        }
        .login-brand-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: #E53935;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .login-brand-name {
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .login-brand-name span { color: #E53935; }

        /* ── Hero text ── */
        .login-hero {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 0 32px;
        }
        .login-hero-title {
          font-size: 50px;
          font-weight: 800;
          color: #fff;
          line-height: 1.07;
          letter-spacing: -0.025em;
          margin-bottom: 18px;
        }
        .login-hero-title span { color: #E53935; }
        .login-hero-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.48);
          line-height: 1.6;
          max-width: 320px;
          margin-bottom: 40px;
        }

        /* ── Feature list ── */
        .login-features { display: flex; flex-direction: column; gap: 18px; }
        .login-feature  { display: flex; align-items: center; gap: 14px; }
        .login-feature-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: rgba(229,57,53,0.15);
          border: 1px solid rgba(229,57,53,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .login-feature-title {
          font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 2px;
        }
        .login-feature-desc { font-size: 12px; color: rgba(255,255,255,0.38); }

        .login-footer-left {
          font-size: 12px;
          color: rgba(255,255,255,0.18);
          position: relative;
          z-index: 2;
        }

        /* ── RIGHT PANEL ── */
        .login-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          background: #f4f6f9;
          min-height: 100vh;
        }
        .login-right-inner {
          width: 100%;
          max-width: 400px;
        }
        .login-right-title {
          font-size: 28px;
          font-weight: 700;
          color: #121212;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
          text-align: center;
        }
        .login-right-sub {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 32px;
          text-align: center;
        }

        /* ── Form ── */
        .lf-field { margin-bottom: 20px; }
        .lf-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .lf-label-row {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 8px;
        }
        .lf-forgot {
          font-size: 12px; color: #E53935; font-weight: 500;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .lf-input-wrap { position: relative; }
        .lf-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          width: 16px; height: 16px; color: #9CA3AF; pointer-events: none;
        }
        .lf-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          font-size: 14px;
          color: #121212;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .lf-input::placeholder { color: #D1D5DB; }
        .lf-input:focus {
          border-color: #E53935;
          box-shadow: 0 0 0 3px rgba(229,57,53,0.10);
        }
        .lf-input-pr { padding-right: 46px; }
        .lf-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #9CA3AF;
          display: flex; align-items: center; padding: 4px; z-index: 2;
        }
        .lf-eye:hover { color: #6B7280; }
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none; }
        input::-webkit-credentials-auto-fill-button { visibility: hidden; }

        /* ── Alerts ── */
        .lf-error {
          display: flex; align-items: center; gap: 10px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 11px 14px;
          font-size: 13px; color: #dc2626; margin-bottom: 16px;
        }
        .lf-error-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ef4444; flex-shrink: 0;
        }
        .lf-success {
          display: flex; align-items: center; gap: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 10px; padding: 11px 14px;
          font-size: 13px; color: #16a34a; margin-bottom: 16px;
        }

        /* ── Button ── */
        .lf-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 24px;
          background: #E53935; color: #fff;
          border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(229,57,53,0.30);
          transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
          margin-bottom: 20px;
        }
        .lf-btn:hover:not(:disabled) {
          background: #C62828;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(229,57,53,0.38);
        }
        .lf-btn:active:not(:disabled) { transform: translateY(0); }
        .lf-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .lf-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          display: inline-block; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Trust ── */
        .lf-trust {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: #9CA3AF;
        }
        .login-footer-right {
          text-align: center;
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 28px;
        }

        /* ── Mobile brand (shown on mobile only) ── */
        .login-mobile-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 28px; justify-content: center;
        }

        /* ── Desktop breakpoint ── */
        @media (min-width: 1024px) {
          .login-left  { display: flex; }
          .login-right { min-height: 100vh; }
          .login-mobile-brand { display: none; }
        }
      `}</style>

      <div className="login-root">

        {/* ══════ LEFT PANEL ══════ */}
        <div className="login-left">

          {/* Background photo */}
          <img
            src="/pesas.jpg"
            alt=""
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 0,
            }}
          />
          {/* Dark overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(10,2,2,0.65) 60%, rgba(30,5,5,0.60) 100%)',
          }} />

          {/* Brand */}
          <div className="login-brand" style={{ position: 'relative', zIndex: 2 }}>
            <div className="login-brand-icon">
              <Dumbbell style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <span className="login-brand-name">GYM <span>EL CUBA</span></span>
          </div>

          {/* Hero */}
          <div className="login-hero" style={{ position: 'relative', zIndex: 2 }}>
            <h1 className="login-hero-title">
              Gestioná tu<br />
              <span>gimnasio</span><br />
              sin esfuerzo.
            </h1>
            <p className="login-hero-desc">
              Todo lo que necesitás para administrar alumnos, pagos y nutrición en un solo lugar.
            </p>
            <div className="login-features">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="login-feature">
                  <div className="login-feature-icon">
                    <Icon style={{ width: 16, height: 16, color: '#E53935' }} />
                  </div>
                  <div>
                    <p className="login-feature-title">{title}</p>
                    <p className="login-feature-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="login-footer-left" style={{ position: 'relative', zIndex: 2 }}>© {new Date().getFullYear()} Gym El Cuba · v1.0</p>
        </div>

        {/* ══════ RIGHT PANEL ══════ */}
        <div className="login-right">
          <div className="login-right-inner">

            {/* Mobile brand (only visible on mobile) */}
            <div className="login-mobile-brand">
              <div className="login-brand-icon">
                <Dumbbell style={{ width: 20, height: 20, color: '#fff' }} />
              </div>
              <span className="login-brand-name" style={{ color: '#121212' }}>
                GYM <span>EL CUBA</span>
              </span>
            </div>

            <h1 className="login-right-title">Bienvenido</h1>
            <p className="login-right-sub">Accedé a tu panel de control</p>

            <form onSubmit={handleSubmit} autoComplete="off">
              {/* Email */}
              <div className="lf-field">
                <label className="lf-label">Email</label>
                <div className="lf-input-wrap">
                  <Mail className="lf-icon" />
                  <input
                    type="email" required
                    value={email} onChange={(e) => { setEmail(e.target.value); setTouched(true); }}
                    placeholder="admin@gym.com"
                    className="lf-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lf-field">
                <div className="lf-label-row">
                  <label className="lf-label" style={{ marginBottom: 0 }}>Contraseña</label>
                  <button type="button" className="lf-forgot">¿Olvidaste la contraseña?</button>
                </div>
                <div className="lf-input-wrap">
                  <Lock className="lf-icon" />
                  <input
                    type={showPass ? 'text' : 'password'} required
                    value={password} onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
                    placeholder="••••••••"
                    className="lf-input lf-input-pr"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="lf-eye">
                    {showPass
                      ? <EyeOff style={{ width: 16, height: 16 }} />
                      : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="lf-error">
                  <span className="lf-error-dot" />
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="lf-success">
                  <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  Inicio de sesión exitoso. Redirigiendo...
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading || success} className="lf-btn">
                {loading ? (
                  <><span className="lf-spinner" />Ingresando...</>
                ) : success ? (
                  <><CheckCircle style={{ width: 16, height: 16 }} />Acceso concedido</>
                ) : (
                  <>Ingresar <ArrowRight style={{ width: 16, height: 16 }} /></>
                )}
              </button>

              <p className="lf-trust">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Acceso seguro · Tus datos están protegidos
              </p>
            </form>

            <p className="login-footer-right">
              © {new Date().getFullYear()} Gym El Cuba · Panel Administrativo
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
