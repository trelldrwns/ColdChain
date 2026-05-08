"use client";
import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { io } from "socket.io-client";

export default function TimelinePage() {
  const [timelines, setTimelines] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/shipments?status=in_transit', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const liveTimelines = data
            .filter((s: any) => s.sensor_serial) // only those with a sensor
            .map((s: any) => ({
              id: s.sensor_serial,
              shipment: s.tracking_no,
              statuses: [{ type: 'ok', width: 2 }]
            }));
          setTimelines(liveTimelines);
        }
      })
      .catch(console.error);

    const socket = io(``, { withCredentials: true });
    
    socket.on("telemetry_update", (data) => {
      setTimelines(prev => prev.map(sensor => {
        if (sensor.id === data.serial_no) {
          const newStatuses = [...sensor.statuses];
          const lastStatus = newStatuses[newStatuses.length - 1];
          
          let eventType = 'ok';
          if (data.event === 'soft_excursion') eventType = 'warn';
          if (data.event === 'hard_excursion') eventType = 'danger';

          const totalWidth = newStatuses.reduce((acc, s) => acc + s.width, 0);
          
          if (totalWidth >= 100) {
            // Reset if it fills the entire bar
            return { ...sensor, statuses: [{ type: eventType, width: 2 }] };
          }

          if (lastStatus && lastStatus.type === eventType) {
            // Grow the bar visually by 2% per tick to make it fast and noticeable
            lastStatus.width += 2;
          } else {
            newStatuses.push({ type: eventType, width: 2 });
          }
          return { ...sensor, statuses: newStatuses };
        }
        return sensor;
      }));
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <div className="font-ui max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">Temperature Timeline</h1>
      </div>
      
      <div className="space-y-4">
        {timelines.map(sensor => (
          <div key={sensor.id} className="bg-surface rounded-[14px] p-6 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-data font-medium text-text-primary mr-3">{sensor.id}</span>
                <span className="text-sm text-text-secondary">Shipment: {sensor.shipment}</span>
              </div>
              <Activity className="w-4 h-4 text-text-muted" />
            </div>
            
            <div className="relative h-8 bg-muted rounded-[4px] overflow-hidden flex">
              {sensor.statuses.map((s: any, i: number) => {
                let bgColor = 'bg-[#22C55E] opacity-70'; // ok
                if (s.type === 'warn') bgColor = 'bg-[#F59E0B] opacity-100';
                if (s.type === 'danger') bgColor = 'bg-[#E84444] opacity-100';
                return (
                  <div key={i} className={`h-full ${bgColor} transition-all duration-300 ease-linear`} style={{ width: `${s.width}%` }}></div>
                );
              })}
              
              {/* Overlay Grid lines for hours */}
              <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                {[1,2,3,4,5,6].map((i: number) => <div key={i} className="w-px h-full bg-black/50 border-r border-dashed"></div>)}
              </div>
            </div>
            
            <div className="flex justify-between mt-2 font-data text-xs text-text-muted">
              <span>00:00</span>
              <span>24:00</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
