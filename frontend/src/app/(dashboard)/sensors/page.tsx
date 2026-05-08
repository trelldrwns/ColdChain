"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import NewSensorModal from "@/components/NewSensorModal";
import toast from "react-hot-toast";
import { AlertTriangle, Trash } from "lucide-react";

export default function SensorsPage() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSensors = () => {
    setIsLoading(true);
    fetch(`/api/v1/sensors`, {credentials: 'include'})
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setSensors(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const fetchShipments = () => {
    fetch(`/api/v1/shipments`, {credentials: 'include'})
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setShipments(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSensors();
    fetchShipments();

    const socket = io(``, { withCredentials: true });
    
    socket.on("telemetry_update", (data) => {
      setSensors(prev => prev.map(s => {
        if (s.serial_no === data.serial_no) {
          // Add a temporary highlight flag and update live values
          return { ...s, battery_pct: data.battery_pct, current_temp: data.temperature, _liveUpdate: true };
        }
        return s;
      }));

      // Remove highlight after 500ms
      setTimeout(() => {
        setSensors(prev => prev.map(s => s.serial_no === data.serial_no ? { ...s, _liveUpdate: false } : s));
      }, 500);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleCalibrate = (id: string) => {
    fetch(`/api/v1/sensors/${id}/calibrate`, {
      method: 'PATCH',
      credentials: 'include'
    }).then(() => fetchSensors()).catch(console.error);
  };

  const handleDeleteSensor = async (id: string) => {
    if (!window.confirm("Are you sure you want to decommission and delete this sensor?")) return;
    try {
      const res = await fetch(`/api/v1/sensors/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Sensor decommissioned successfully");
        fetchSensors();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete sensor");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  };

  const handleUpdateSensor = (id: string, payload: any) => {
    fetch(`/api/v1/sensors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    }).then(() => fetchSensors()).catch(console.error);
  };

  return (
    <div className="font-ui">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Sensor Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const activeSensor = sensors.find(s => s.shipment_id && s.active);
              if (!activeSensor) {
                toast.error("Assign an active sensor to a shipment first!");
                return;
              }
              toast.loading("Inducing thermal shock...", { id: 'chaos' });
              fetch(`/api/v1/telemetry/ingest`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Hardware-Token": "cc-hw-sk-9942a1" },
                body: JSON.stringify({
                  serial_no: activeSensor.serial_no,
                  temperature: 15.5,
                  battery_pct: activeSensor.battery_pct
                })
              }).then(() => toast.success("Hard Excursion triggered!", { id: 'chaos' }))
                .catch(() => toast.error("Simulation failed", { id: 'chaos' }));
            }}
            className="px-4 py-2 bg-surface border border-danger text-danger rounded-[10px] text-sm font-medium hover:bg-danger hover:text-white transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Trigger Chaos
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-accent text-surface rounded-[10px] text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            Register Sensor
          </button>
        </div>
      </div>
      
      <div className="bg-surface rounded-[14px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_rgba(0,0,0,0.05)] border border-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-xs text-text-muted uppercase tracking-[0.05em]">
              <th className="px-6 py-3 font-medium">Serial No</th>
              <th className="px-6 py-3 font-medium">Model</th>
              <th className="px-6 py-3 font-medium">Assignment</th>
              <th className="px-6 py-3 font-medium">Live Temp</th>
              <th className="px-6 py-3 font-medium">Battery</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Last Calibrated</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="[&>*:nth-child(even)]:bg-muted/30 [&>*:nth-child(odd)]:bg-surface">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-sm text-text-muted">Loading sensors...</div>
                  </div>
                </td>
              </tr>
            ) : sensors.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-text-muted text-sm border-b border-border">
                  No sensors found.
                </td>
              </tr>
            ) : (
              sensors.map((s) => (
                <tr key={s.id} className="hover:bg-accent-light transition-colors duration-[120ms] h-[54px] border-b border-border text-sm">
                  <td className="px-6 font-data text-text-primary">{s.serial_no}</td>
                  <td className="px-6 text-text-secondary">{s.model || 'Unknown'}</td>
                  <td className="px-6">
                    {s.shipment_id ? (
                      <div className="flex items-center gap-2">
                        <span className="font-data text-xs text-accent-dark tracking-wide bg-accent/10 px-2 py-1 rounded">
                          {shipments.find(sh => sh.id === s.shipment_id)?.tracking_no || 'Assigned'}
                        </span>
                        <button 
                          onClick={() => handleUpdateSensor(s.id, { shipment_id: null })}
                          className="text-xs text-danger hover:underline"
                        >
                          Unassign
                        </button>
                      </div>
                    ) : (
                      <select 
                        onChange={(e) => {
                          if (e.target.value) handleUpdateSensor(s.id, { shipment_id: e.target.value });
                        }}
                        value=""
                        className="bg-surface border border-border rounded text-xs px-2 py-1 outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="">Assign...</option>
                        {shipments.filter(sh => sh.status === 'pending' || sh.status === 'in_transit').map(sh => (
                          <option key={sh.id} value={sh.id}>{sh.tracking_no}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-6">
                    <span className={`font-data font-medium transition-colors duration-300 ${s._liveUpdate ? 'text-accent' : 'text-text-primary'}`}>
                      {s.current_temp !== undefined ? `${s.current_temp.toFixed(2)}°C` : '--'}
                    </span>
                  </td>
                  <td className="px-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${s.battery_pct > 20 ? 'bg-ok' : 'bg-danger'}`} 
                          style={{ width: `${s.battery_pct}%` }}
                        ></div>
                      </div>
                      <span className="font-data text-xs text-text-muted">{s.battery_pct}%</span>
                    </div>
                  </td>
                  <td className="px-6 cursor-pointer" onClick={() => handleUpdateSensor(s.id, { active: !s.active })}>
                    <span className={`px-2 py-[2px] rounded-full text-[11px] font-medium tracking-wide uppercase ${s.active ? 'bg-ok-light text-[#15803D]' : 'bg-danger-light text-[#991B1B]'}`}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 font-data text-xs text-text-muted">
                    {s.last_calibrated_at ? new Date(s.last_calibrated_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleCalibrate(s.id)}
                        className="text-accent hover:text-accent-dark font-medium text-xs uppercase tracking-wide transition-colors"
                      >
                        Calibrate
                      </button>
                      <button onClick={() => handleDeleteSensor(s.id)} className="text-text-muted hover:text-danger transition-colors p-1 rounded-md hover:bg-danger/10">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NewSensorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSensors}
      />
    </div>
  );
}
