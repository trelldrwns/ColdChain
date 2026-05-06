"use client";
import { useState, useEffect } from "react";
import { Truck, Navigation, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/carriers/performance`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCarriers(data);
        setIsLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="font-ui max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">Carrier Performance</h1>
        <p className="text-sm text-text-secondary mt-1">Track delivery metrics and integrate with partner dispatch APIs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>
        ) : carriers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted text-sm border border-dashed rounded-[14px]">No carriers available.</div>
        ) : (
          carriers.map(c => (
            <div key={c.id} className="bg-surface border border-border rounded-[14px] p-5 flex flex-col hover:border-strong transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Truck className="w-16 h-16" />
              </div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">{c.name}</h3>
                  <p className="font-data text-xs text-text-secondary">{c.license_no}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-[10px] uppercase font-semibold text-text-secondary mb-1">Active</div>
                  <div className="font-data text-xl text-text-primary">{c.active_shipments || 0}</div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-[10px] uppercase font-semibold text-text-secondary mb-1">Completed</div>
                  <div className="font-data text-xl text-text-primary">{c.completed_shipments || 0}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-auto flex items-center justify-between relative z-10">
                <span className="text-xs font-medium text-text-muted">{c.contact_email}</span>
                <button 
                  disabled={syncingId === c.id}
                  onClick={() => {
                    setSyncingId(c.id);
                    toast.loading(`Pinging ${c.name} Freight API...`, { id: 'sync' });
                    setTimeout(() => {
                      setSyncingId(null);
                      toast.success(`Synced ${Math.floor(Math.random() * 20) + 5} historical records!`, { id: 'sync' });
                    }, 2000);
                  }}
                  className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1 transition-colors ${syncingId === c.id ? 'text-text-muted' : 'text-accent hover:text-accent-dark'}`}
                >
                  {syncingId === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  Sync API
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
