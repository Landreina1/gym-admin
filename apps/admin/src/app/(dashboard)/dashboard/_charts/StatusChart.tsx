'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { status: string; count: number; color: string }[];
  total: number;
}

export default function StatusChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Sin datos aún</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px 16px' }}>

      {/* Donut */}
      <div style={{ position: 'relative', flexShrink: 0, width: 120, height: 120 }}>
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%" cy="50%"
              outerRadius={54}
              innerRadius={34}
              paddingAngle={3}
              labelLine={false}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number, name: string) => [`${val} alumnos`, name]}
              contentStyle={{
                borderRadius: 12, border: '1px solid #e8edf2', fontSize: 11,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: '6px 12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Total in center */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>total</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Color bar */}
              <div style={{ width: 4, height: 32, borderRadius: 99, background: d.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 500 }}>{d.status}</p>
                <div style={{ marginTop: 4, height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: d.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', display: 'block', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{d.count}</span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
