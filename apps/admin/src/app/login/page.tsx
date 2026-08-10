'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Eye, EyeOff, User, Lock, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading || success) return;
    setError('');
    setLoading(true);

    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data } = await api.post('/auth/login', { username: username.trim(), password });
        localStorage.setItem('gym_token', data.token);
        localStorage.setItem('gym_user', JSON.stringify(data.user));
        // SameSite=Lax (no Strict): mantiene la sesión al navegar/volver atrás
        document.cookie = `gym_token=${data.token}; path=/; max-age=${10 * 365 * 24 * 3600}; SameSite=Lax${secure}`;
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 1000);
        return;
      } catch (err: any) {
        const status = err?.response?.status;
        // Credenciales realmente incorrectas → mensaje claro, sin reintentar
        if (status === 401 || status === 400) {
          setError('Usuario o contraseña incorrectos');
          setLoading(false);
          return;
        }
        // Servidor frío/red (Render se suspende por inactividad) → reintentar
        if (attempt < maxAttempts) {
          setError('Conectando con el servidor…');
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        setError('No pudimos conectar con el servidor (puede estar iniciando). Esperá unos segundos e intentá de nuevo.');
        setLoading(false);
      }
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .lg-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: 'Inter', system-ui, sans-serif;
          background: #faf9f7;
          background-image:
            radial-gradient(60% 50% at 50% -10%, rgba(229,57,53,0.10) 0%, transparent 60%),
            radial-gradient(50% 40% at 100% 110%, rgba(229,57,53,0.06) 0%, transparent 60%);
          position: relative;
        }
        .lg-card {
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          border: 1px solid #eae6e0;
          border-radius: 26px;
          box-shadow: 0 20px 60px rgba(26,26,26,0.08);
          padding: 38px 34px 30px;
          animation: lg-in 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes lg-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .lg-logo {
          width: 78px; height: 78px; border-radius: 50%;
          margin: 0 auto 18px;
          background: #fff;
          border: 1px solid #eae6e0;
          box-shadow: 0 6px 18px rgba(26,26,26,0.08);
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .lg-logo img { width: 100%; height: 100%; object-fit: cover; }
        .lg-label {
          display: block; font-size: 12.5px; font-weight: 600;
          color: #6b6258; margin-bottom: 7px; padding-left: 4px;
        }
        .lg-inp-wrap { position: relative; }
        .lg-inp {
          width: 100%; height: 50px;
          padding: 0 16px 0 44px;
          border: 1px solid #eae6e0; border-radius: 99px;
          font-size: 14px; color: #1a1a1a; background: #faf9f7;
          outline: none; font-family: inherit;
          transition: border-color .15s, background .15s, box-shadow .15s;
        }
        .lg-inp::placeholder { color: #a39a8e; }
        .lg-inp:focus { border-color: #E53935; background: #fff; box-shadow: 0 0 0 3px rgba(229,57,53,0.08); }
        .lg-inp-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          width: 16px; height: 16px; color: #a39a8e; pointer-events: none;
        }
        .lg-eye {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          height: 34px; padding: 0 12px; border: none; background: transparent;
          border-radius: 99px; cursor: pointer; color: #6b6258;
          font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 5px;
        }
        .lg-eye:hover { color: #1a1a1a; background: #f0ece6; }
        .lg-btn {
          width: 100%; height: 52px; margin-top: 4px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: #E53935; color: #fff; border: none; border-radius: 99px;
          font-size: 14.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          box-shadow: 0 6px 18px rgba(229,57,53,0.28);
          transition: background .15s, transform .12s, box-shadow .15s, opacity .15s;
        }
        .lg-btn:hover:not(:disabled) { background: #C62828; transform: translateY(-1px); }
        .lg-btn:disabled { background: #e8b5b3; box-shadow: none; cursor: default; }
        .lg-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; animation: lg-rot .7s linear infinite; }
        @keyframes lg-rot { to { transform: rotate(360deg); } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 40px #faf9f7 inset; }
      `}</style>

      <div className="lg-root">
        <div className="lg-card">

          {/* Logo + marca */}
          <div className="lg-logo">
            <img src="/logo.png" alt="Gym El Cuba" />
          </div>
          <h1 style={{ margin: 0, textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#1a1a1a' }}>
            Gym El Cuba
          </h1>
          <p style={{ margin: '5px 0 26px', textAlign: 'center', fontSize: 13.5, color: '#a39a8e' }}>
            Panel de administración
          </p>

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Usuario */}
            <div style={{ marginBottom: 16 }}>
              <label className="lg-label">Usuario</label>
              <div className="lg-inp-wrap">
                <User className="lg-inp-icon" />
                <input
                  className="lg-inp" type="text" autoCapitalize="none" spellCheck={false}
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="tu usuario" autoFocus
                />
              </div>
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: 20 }}>
              <label className="lg-label">Contraseña</label>
              <div className="lg-inp-wrap">
                <Lock className="lg-inp-icon" />
                <input
                  className="lg-inp" type={showPass ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" style={{ paddingRight: 78 }}
                />
                <button type="button" className="lg-eye" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                  {showPass ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  {showPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {/* Estados */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fdeeed', border: '1px solid #f3ddda', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: '#c2554f', marginBottom: 16 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E53935', flexShrink: 0 }} />
                {error}
              </div>
            )}
            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#e9f6ee', border: '1px solid #d8eede', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: '#16a34a', marginBottom: 16 }}>
                <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                Acceso concedido. Entrando…
              </div>
            )}

            <button type="submit" className="lg-btn" disabled={!canSubmit || loading || success}>
              {loading ? <><span className="lg-spin" />Ingresando…</>
                : success ? <><CheckCircle style={{ width: 16, height: 16 }} />Listo</>
                : <>Ingresar <ArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22, fontSize: 12, color: '#a39a8e' }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            Acceso seguro · Tus datos están protegidos
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 11.5, color: '#c4bcb0' }}>
          © {new Date().getFullYear()} Gym El Cuba · Sistema de gestión
        </div>
      </div>
    </>
  );
}
