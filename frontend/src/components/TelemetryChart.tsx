"use client";
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function TelemetryChart({ shipmentId, minTemp, maxTemp }: { shipmentId: string, minTemp?: number, maxTemp?: number }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shipmentId) return;
    setLoading(true);
    fetch(`\${process.env.NEXT_PUBLIC_API_URL || `\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/v1/telemetry/history/${shipmentId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(result => {
        if (Array.isArray(result)) {
          // Format time
          const formatted = result.map(r => ({
            ...r,
            displayTime: new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setData(formatted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shipmentId]);

  if (loading) {
    return (
      <div className="h-[200px] flex items-center justify-center border border-border rounded-xl bg-surface">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center border border-border rounded-xl bg-surface text-sm text-text-muted">
        No historical telemetry available
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="displayTime" 
            tick={{ fontSize: 10, fill: '#8C8C8C' }} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#8C8C8C' }} 
            tickLine={false} 
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(val) => `${val}°C`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontFamily: 'inherit' }}
            formatter={(value: number) => [`${value.toFixed(2)} °C`, 'Temp']}
          />
          
          {minTemp !== undefined && (
            <ReferenceLine y={minTemp} stroke="#991B1B" strokeDasharray="3 3" opacity={0.5} />
          )}
          {maxTemp !== undefined && (
            <ReferenceLine y={maxTemp} stroke="#991B1B" strokeDasharray="3 3" opacity={0.5} />
          )}

          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#0D9488" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4, fill: '#0D9488', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
