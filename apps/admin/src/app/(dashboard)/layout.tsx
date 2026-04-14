import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/context/sidebar.context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--surface-page)' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Header />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 16px',
          }}
            className="md:p-6"
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
