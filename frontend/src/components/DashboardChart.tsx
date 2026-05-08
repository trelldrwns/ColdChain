"use client";
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from "socket.io-client";

export default function DashboardChart({ stats }: { stats?: any }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Generate recent hours for X-axis dynamically
    const generateInitialData = () => {
      const now = new Date();
      const initial = [];
      const activeCount = stats?.activeShipments || 0;

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
        initial.push({
          time: `${d.getHours().toString().padStart(2, '0')}:00`,
          active: activeCount,
          excursions: 0
        });
      }
      return initial;
    };
    
    setData(generateInitialData());
  }, [stats]);

  useEffect(() => {
    const socket = io(``, { withCredentials: true });
    
    socket.on("telemetry_update", (payload) => {
      setData(prev => {
        if (!prev || prev.length === 0) return prev;
        const newData = [...prev];
        const lastPoint = { ...newData[newData.length - 1] };
        
        // We no longer randomly fluctuate active since it's driven by real stats/events


        // Add excursion if happened
        if (payload.event === 'hard_excursion' || payload.event === 'soft_excursion') {
          lastPoint.excursions += 1;
        }

        newData[newData.length - 1] = lastPoint;
        return newData;
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0EA5B0" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#0EA5B0" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorExc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E84444" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#E84444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
        <XAxis 
          dataKey="time" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#9EA8B5', fontFamily: 'DM Mono' }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#9EA8B5', fontFamily: 'DM Mono' }}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}
          labelStyle={{ fontFamily: 'DM Mono', color: '#5C6470', marginBottom: '4px' }}
        />
        <Area type="monotone" dataKey="active" stroke="#0EA5B0" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
        <Area type="monotone" dataKey="excursions" stroke="#E84444" strokeWidth={2} fillOpacity={1} fill="url(#colorExc)" />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
