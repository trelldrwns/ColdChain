"use client";
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from "socket.io-client";

export default function DashboardChart() {
  const [data, setData] = useState([
    { time: '00:00', active: 4, excursions: 0 },
    { time: '04:00', active: 6, excursions: 1 },
    { time: '08:00', active: 10, excursions: 1 },
    { time: '12:00', active: 15, excursions: 2 },
    { time: '16:00', active: 12, excursions: 0 },
    { time: '20:00', active: 8, excursions: 0 },
  ]);

  useEffect(() => {
    const socket = io(`\${process.env.NEXT_PUBLIC_API_URL || `\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}`, { withCredentials: true });
    
    socket.on("telemetry_update", (payload) => {
      setData(prev => {
        const newData = [...prev];
        const lastPoint = { ...newData[newData.length - 1] };
        
        // Slightly fluctuate 'active' to make it look alive
        if (Math.random() > 0.5) {
          lastPoint.active = Math.max(0, lastPoint.active + (Math.random() > 0.5 ? 1 : -1));
        }

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
