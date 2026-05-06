"use client";
import { PackageOpen, AlertTriangle, RadioTower, Clock } from 'lucide-react';
import DashboardChart from '@/components/DashboardChart';
import AlertsInbox from '@/components/AlertsInbox';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeShipments: 0,
    excursionsToday: 0,
    sensorsOnline: 0,
    pendingShipments: 0
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/stats`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto font-ui">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Active Shipments */}
        <div className="bg-accent-light rounded-[14px] p-[20px_24px]">
          <div className="flex justify-between items-start mb-2">
            <PackageOpen className="w-5 h-5 text-accent-dark" strokeWidth={2} />
            <span className="bg-white/50 text-[#15803D] text-[11px] font-medium px-2 py-0.5 rounded-full">Live</span>
          </div>
          <div className="font-data text-[40px] leading-none text-accent-dark mb-2 tracking-tight">{stats.activeShipments}</div>
          <div className="text-sm text-text-secondary">Active Shipments</div>
        </div>

        {/* Excursions */}
        <div className="bg-danger-light rounded-[14px] p-[20px_24px]">
          <div className="flex justify-between items-start mb-2">
            <AlertTriangle className="w-5 h-5 text-danger" strokeWidth={2} />
            {stats.excursionsToday > 0 && <span className="bg-white/50 text-danger text-[11px] font-medium px-2 py-0.5 rounded-full animate-pulse">Action Req</span>}
          </div>
          <div className="font-data text-[40px] leading-none text-[#991B1B] mb-2 tracking-tight">{stats.excursionsToday}</div>
          <div className="text-sm text-text-secondary">Excursions Today</div>
        </div>

        {/* Sensors Online */}
        <div className="bg-ok-light rounded-[14px] p-[20px_24px]">
          <div className="flex justify-between items-start mb-2">
            <RadioTower className="w-5 h-5 text-[#15803D]" strokeWidth={2} />
            <span className="bg-white/50 text-[#15803D] text-[11px] font-medium px-2 py-0.5 rounded-full">Live</span>
          </div>
          <div className="font-data text-[40px] leading-none text-[#14532D] mb-2 tracking-tight">{stats.sensorsOnline}</div>
          <div className="text-sm text-text-secondary">Sensors Online</div>
        </div>

        {/* Awaiting Dispatch */}
        <div className="bg-warn-light rounded-[14px] p-[20px_24px]">
          <div className="flex justify-between items-start mb-2">
            <Clock className="w-5 h-5 text-[#B45309]" strokeWidth={2} />
          </div>
          <div className="font-data text-[40px] leading-none text-[#78350F] mb-2 tracking-tight">{stats.pendingShipments}</div>
          <div className="text-sm text-text-secondary">Awaiting Dispatch</div>
        </div>

      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <div className="bg-surface rounded-[14px] p-6 border border-border lg:col-span-2">
          <h3 className="font-medium text-sm text-text-primary mb-6">Volume & Excursions Overview</h3>
          <DashboardChart />
        </div>

        <div className="lg:col-span-1 h-full">
          <AlertsInbox />
        </div>
      </div>
    </div>
  );
}
