'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Dumbbell, Eye, EyeOff, Mail, Lock,
  CheckCircle, ArrowRight, Users, CreditCard, Salad,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('gym_token', data.token);
      localStorage.setItem('gym_user', JSON.stringify(data.user));
      document.cookie = `gym_token=${data.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Strict`;
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
      setLoading(false);
    }
  }

  const formInner = (
    <>
      {/* Email */}
      <div className="lf-field">
        <label className="lf-label">Email</label>
        <div style={{ position: 'relative' }}>
          <Mail className="lf-icon" />
          <input
            type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gym.com"
            className="lf-input"
          />
        </div>
      </div>

      {/* Password */}
      <div className="lf-field">
        <div className="lf-label-row">
          <label className="lf-label">Contraseña</label>
          <button type="button" className="lf-forgot">¿Olvidaste la contraseña?</button>
        </div>
        <div style={{ position: 'relative' }}>
          <Lock className="lf-icon" />
          <input
            type={showPass ? 'text' : 'password'} required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="lf-input lf-input-pr"
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className="lf-eye">
            {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
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
          <>Ingresar<ArrowRight style={{ width: 16, height: 16 }} /></>
        )}
      </button>

      {/* Trust */}
      <p className="lf-trust">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Acceso seguro · Tus datos están protegidos
      </p>
    </>
  );

  return (
    <>
      <style>{`
        /* ─── Base ─── */
        * { box-sizing: border-box; }

        /* ─── Inputs ─── */
        .lf-field { margin-bottom: 18px; }
        .lf-label {
          display: block; font-size: 11px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;
        }
        .lf-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .lf-forgot { font-size: 12px; color: #0284c7; font-weight: 500; background: none; border: none; cursor: pointer; padding: 0; }
        .lf-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          width: 16px; height: 16px; color: #cbd5e1; pointer-events: none;
        }
        .lf-input {
          width: 100%; padding: 13px 16px 13px 42px;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          font-size: 14px; color: #1e293b; background: #f8fafc;
          outline: none; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .lf-input::placeholder { color: #cbd5e1; }
        .lf-input:focus {
          border-color: #0284c7; background: #fff;
          box-shadow: 0 0 0 3px rgba(2,132,199,0.12);
        }
        .lf-input-pr { padding-right: 44px; }
        .lf-eye {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #cbd5e1;
          display: flex; align-items: center; padding: 0;
        }
        .lf-eye:hover { color: #94a3b8; }

        /* ─── Alerts ─── */
        .lf-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 12px; padding: 12px 16px;
          font-size: 13px; color: #dc2626; margin-bottom: 16px;
        }
        .lf-error-dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; margin-top: 5px; flex-shrink: 0; }
        .lf-success {
          display: flex; align-items: center; gap: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 12px; padding: 12px 16px;
          font-size: 13px; color: #16a34a; margin-bottom: 16px;
        }

        /* ─── Button ─── */
        .lf-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 24px; background: #0284c7; color: #fff;
          border: none; border-radius: 12px; font-size: 14px; font-weight: 600;
          cursor: pointer; box-shadow: 0 4px 16px rgba(2,132,199,0.32);
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .lf-btn:hover:not(:disabled) {
          background: #0369a1; transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(2,132,199,0.42);
        }
        .lf-btn:active:not(:disabled) { transform: translateY(0); }
        .lf-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .lf-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          display: inline-block; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ─── Trust ─── */
        .lf-trust {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: #cbd5e1; margin-top: 16px; margin-bottom: 0;
        }

        /* ─── Fade-up animation ─── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lf-animate { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }

        /* ════════════════════════════════════
           MOBILE  (default < 1024px)
        ════════════════════════════════════ */
        .lf-mobile {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 100vh; padding: 24px;
          background: linear-gradient(135deg, #0a1628 0%, #0d2352 45%, #0284c7 100%);
          position: relative; overflow: hidden;
        }
        .lf-mobile::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .lf-glow-tr {
          position: absolute; top: -140px; right: -140px;
          width: 420px; height: 420px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%);
        }
        .lf-glow-bl {
          position: absolute; bottom: -160px; left: -80px;
          width: 400px; height: 400px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(14,165,233,0.16) 0%, transparent 70%);
        }
        .lf-mobile-inner {
          position: relative; z-index: 10;
          width: 100%; max-width: 420px;
        }
        .lf-mobile-brand {
          text-align: center; margin-bottom: 28px;
        }
        .lf-mobile-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 54px; height: 54px; border-radius: 16px; margin-bottom: 16px;
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
        }
        .lf-mobile-title { font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 4px; }
        .lf-mobile-sub   { font-size: 14px; color: rgba(186,230,253,0.65); margin: 0; }
        .lf-card {
          background: #fff; border-radius: 20px; padding: 28px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12);
        }
        .lf-footer-dark  { text-align: center; font-size: 12px; color: rgba(255,255,255,0.2); margin-top: 20px; }

        /* Desktop hidden by default */
        .lf-desktop { display: none; }

        /* ════════════════════════════════════
           DESKTOP  (≥ 1024px)
        ════════════════════════════════════ */
        @media (min-width: 1024px) {
          .lf-mobile  { display: none; }
          .lf-desktop {
            display: flex; min-height: 100vh; overflow: hidden; background: #fff;
          }

          /* Left branding panel */
          .lf-left {
            width: 52%; display: flex; flex-direction: column; justify-content: space-between;
            padding: 48px; position: relative; overflow: hidden;
            background: linear-gradient(135deg, #0a1628 0%, #0d2352 45%, #0284c7 100%);
          }
          .lf-left::before {
            content: ''; position: absolute; inset: 0; pointer-events: none;
            background-image:
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
            background-size: 48px 48px;
          }
          .lf-left-glow-tr {
            position: absolute; top: -160px; right: -160px;
            width: 520px; height: 520px; border-radius: 50%; pointer-events: none;
            background: radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%);
          }
          .lf-left-glow-bl {
            position: absolute; bottom: -180px; left: -100px;
            width: 480px; height: 480px; border-radius: 50%; pointer-events: none;
            background: radial-gradient(circle, rgba(14,165,233,0.14) 0%, transparent 70%);
          }
          .lf-left-badge {
            position: relative; z-index: 10;
            display: flex; align-items: center; gap: 10px;
          }
          .lf-left-badge-icon {
            width: 36px; height: 36px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
          }
          .lf-left-badge-name { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.7); }

          .lf-left-body {
            position: relative; z-index: 10; flex: 1;
            display: flex; flex-direction: column; justify-content: center; padding: 40px 0;
          }
          .lf-left-title {
            font-size: 52px; font-weight: 800; color: #fff;
            line-height: 1.08; letter-spacing: -0.02em; margin: 0 0 16px;
          }
          .lf-left-title span { color: #7dd3fc; }
          .lf-left-desc {
            font-size: 16px; color: rgba(186,230,253,0.62);
            line-height: 1.6; max-width: 300px; margin: 0 0 40px;
          }
          .lf-features { display: flex; flex-direction: column; gap: 16px; }
          .lf-feature  { display: flex; align-items: center; gap: 14px; }
          .lf-feature-icon {
            width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
            color: #7dd3fc;
          }
          .lf-feature-title { font-size: 14px; font-weight: 600; color: #fff; margin: 0 0 2px; }
          .lf-feature-desc  { font-size: 12px; color: rgba(186,230,253,0.5); margin: 0; }

          .lf-left-footer {
            position: relative; z-index: 10;
            font-size: 12px; color: rgba(255,255,255,0.18);
          }

          /* Right login panel */
          .lf-right {
            flex: 1; display: flex; align-items: center; justify-content: center;
            padding: 40px; background: #f8fafc;
          }
          .lf-right-inner { width: 100%; max-width: 420px; }
          .lf-right-heading { margin-bottom: 28px; }
          .lf-right-title { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
          .lf-right-sub   { font-size: 14px; color: #94a3b8; margin: 0; }
          .lf-card-desktop {
            background: #fff; border-radius: 20px; padding: 28px;
            border: 1px solid #e8edf2;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          }
          .lf-footer-light { text-align: center; font-size: 12px; color: #cbd5e1; margin-top: 20px; }
        }
      `}</style>

      {/* ══════ MOBILE ══════ */}
      <div className="lf-mobile">
        <div className="lf-glow-tr" />
        <div className="lf-glow-bl" />
        <div className="lf-inner lf-animate" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420 }}>
          <div className="lf-mobile-brand">
            <div className="lf-mobile-icon">
              <Dumbbell style={{ width: 26, height: 26, color: '#fff' }} />
            </div>
            <h1 className="lf-mobile-title">Bienvenido 👋</h1>
            <p className="lf-mobile-sub">Accedé a tu panel de control</p>
          </div>
          <form className="lf-card" onSubmit={handleSubmit}>
            {formInner}
          </form>
          <p className="lf-footer-dark">© {new Date().getFullYear()} Gym El Cuba · Panel Administrativo</p>
        </div>
      </div>

      {/* ══════ DESKTOP ══════ */}
      <div className="lf-desktop">

        {/* Left branding */}
        <div className="lf-left">
          <div className="lf-left-glow-tr" />
          <div className="lf-left-glow-bl" />

          <div className="lf-left-badge">
            <div className="lf-left-badge-icon">
              <Dumbbell style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <span className="lf-left-badge-name">Gym El Cuba</span>
          </div>

          <div className="lf-left-body">
            <h2 className="lf-left-title">
              Gestioná tu<br />
              <span>gimnasio</span><br />
              sin esfuerzo.
            </h2>
            <p className="lf-left-desc">
              Todo lo que necesitás para administrar alumnos, pagos y nutrición en un solo lugar.
            </p>
            <div className="lf-features">
              {[
                { icon: <Users style={{ width: 16, height: 16 }} />, title: 'Alumnos', desc: 'Seguimiento y métricas en tiempo real' },
                { icon: <CreditCard style={{ width: 16, height: 16 }} />, title: 'Pagos', desc: 'Control de cobros y vencimientos' },
                { icon: <Salad style={{ width: 16, height: 16 }} />, title: 'Dietas', desc: 'Planes nutricionales personalizados' },
              ].map((f) => (
                <div key={f.title} className="lf-feature">
                  <div className="lf-feature-icon">{f.icon}</div>
                  <div>
                    <p className="lf-feature-title">{f.title}</p>
                    <p className="lf-feature-desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="lf-left-footer">© {new Date().getFullYear()} Gym El Cuba · v1.0</p>
        </div>

        {/* Right form */}
        <div className="lf-right">
          <div className="lf-right-inner lf-animate">
            <div className="lf-right-heading">
              <h1 className="lf-right-title">Bienvenido 👋</h1>
              <p className="lf-right-sub">Accedé a tu panel de control</p>
            </div>
            <form className="lf-card-desktop" onSubmit={handleSubmit}>
              {formInner}
            </form>
            <p className="lf-footer-light">© {new Date().getFullYear()} Gym El Cuba · Panel Administrativo</p>
          </div>
        </div>

      </div>
    </>
  );
}
