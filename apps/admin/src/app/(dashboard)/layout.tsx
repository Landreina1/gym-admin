import { Header } from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className="ec-page">
        {children}
      </main>
      <style>{`
        .ec-page {
          flex: 1;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 44px 40px 64px;
        }
        @media (max-width: 880px) {
          .ec-page { padding: 28px 16px 48px; }
        }
      `}</style>
    </div>
  );
}
