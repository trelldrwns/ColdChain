"use client";
import { useState } from "react";
import { X, RadioTower } from "lucide-react";
import toast from "react-hot-toast";

export default function NewSensorModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [serialNo, setSerialNo] = useState("");
  const [model, setModel] = useState("TempSense-X1");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/sensors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ serial_no: serialNo, model })
      });
      if (!res.ok) throw new Error("Failed to register sensor");
      toast.success(`Sensor ${serialNo} registered successfully!`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to register hardware node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-ui">
      <div className="bg-surface w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold flex items-center gap-2"><RadioTower className="w-5 h-5 text-accent" /> Register Sensor</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Serial Number</label>
            <input 
              required 
              type="text" 
              value={serialNo} 
              onChange={e => setSerialNo(e.target.value.toUpperCase())} 
              placeholder="e.g. SN-A1B2C" 
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none font-data" 
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Model</label>
            <select 
              value={model} 
              onChange={e => setModel(e.target.value)} 
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none"
            >
              <option value="TempSense-X1">TempSense-X1 (Standard)</option>
              <option value="CryoTracker-Pro">CryoTracker-Pro (Deep Freeze)</option>
              <option value="Humidity-Plus">Humidity-Plus (Biologics)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading || !serialNo} className="px-5 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50">
              {loading ? "Registering..." : "Register Sensor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
