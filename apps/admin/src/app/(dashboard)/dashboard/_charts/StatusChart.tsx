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
      <div style={{
        height: 192, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Sin datos aún</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px 16px' }}>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%" cy="50%"
            outerRadius={62}
            innerRadius={38}
            paddingAngle={3}
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
              if (percent < 0.08) return null;
              const r = innerRadius + (outerRadius - innerRadius) * 0.55;
              const x = cx + r * Math.cos(-(midAngle * Math.PI) / 180);
              const y = cy + r * Math.sin(-(midAngle * Math.PI) / 180);
              return (
                <text x={x} y={y} fill="white" textAnchor="middle"
                  dominantBaseline="central" fontSize={10} fontWeight={700}>
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
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

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {data.map((d) => (
          <div key={d.status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: d.color }} />
            <span style={{ flex: 1, fontSize: 12, color: '#64748b' }}>{d.status}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{d.count}</span>
            {total > 0 && (
              <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 38, textAlign: 'right', flexShrink: 0 }}>
                {Math.round((d.count / total) * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
