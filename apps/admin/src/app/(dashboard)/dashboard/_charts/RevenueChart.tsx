'use client';

import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

interface Props {
  data: { label: string; total: number }[];
  height?: number;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return n === 0 ? '$0' : `$${n}`;
}

export default function RevenueChart({ data, height = 192 }: Props) {
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div style={{
        height, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Sin ingresos registrados</p>
        <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0 }}>Los pagos aparecerán aquí</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0284c7" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#0284c7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
          tickLine={false} axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false} axisLine={false}
          tickFormatter={fmt} width={44}
        />
        <Tooltip
          formatter={(val: number) => [fmt(val), 'Ingresos']}
          contentStyle={{
            borderRadius: 12, border: '1px solid #e8edf2', fontSize: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: '8px 14px',
          }}
          cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
        />
        <Area
          type="monotone" dataKey="total"
          stroke="#0284c7" strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={{ r: 3, fill: '#0284c7', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
