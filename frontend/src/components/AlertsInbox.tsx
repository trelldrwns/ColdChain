"use client";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { io } from "socket.io-client";

export default function AlertsInbox() {
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchAlerts = () => {
    fetch(`/api/v1/alerts`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAlerts(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchAlerts();

    const socket = io(``, { withCredentials: true });
    
    socket.on("telemetry_update", (data) => {
      // If we get an excursion, add it to the top of the alerts list!
      if (data.event === "hard_excursion" || data.event === "soft_excursion") {
        setAlerts(prev => [
          {
            _id: Math.random().toString(), // temp ID until refresh
            sensor_serial: data.serial_no,
            shipment_id: data.shipment_id,
            event_type: data.event,
            temperature: data.temperature,
            timestamp: data.timestamp || new Date().toISOString()
          },
          ...prev
        ]);
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleResolve = async (id: string) => {
    // Optimistic UI update
    setAlerts(prev => prev.filter(a => a._id !== id));
    try {
      await fetch(`/api/v1/alerts/${id}/resolve`, {
        method: "PATCH",
        credentials: "include"
      });
    } catch (err) {
      console.error(err);
      fetchAlerts(); // Revert on failure
    }
  };

  return (
    <div className="bg-surface rounded-[14px] p-6 border border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-sm text-text-primary flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger" />
          Alert Management Inbox
        </h3>
        <span className="bg-danger-light text-danger text-xs font-bold px-2 py-1 rounded-full">
          {alerts.length} Pending
        </span>
      </div>

      <div className="flex-1 overflow-auto space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center text-text-muted text-sm py-8 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 opacity-20" />
            <p>All clear! No pending excursions.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert._id} className="flex items-center justify-between p-3 rounded-lg border border-danger/20 bg-danger/5 hover:bg-danger/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-data font-medium text-sm text-text-primary">{alert.sensor_serial}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded text-[#991B1B] bg-[#FEE2E2] uppercase tracking-wide">
                      {alert.event_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary mt-1 flex items-center gap-2">
                    <span>Temp: <span className="font-data font-bold text-danger">{alert.temperature.toFixed(2)}°C</span></span>
                    <span>•</span>
                    <span>Shipment: {alert.shipment_id.split('-')[0]}...</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleResolve(alert._id)}
                className="text-xs font-medium text-text-secondary hover:text-[#15803D] hover:bg-ok-light px-3 py-1.5 rounded-md transition-colors"
              >
                Resolve
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
