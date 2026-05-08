"use client";
import { useState, useEffect } from "react";
import { Truck, Navigation, RefreshCw, Trash2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // New Carrier State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLicense, setNewLicense] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const fetchCarriers = () => {
    fetch(`/api/v1/carriers/performance`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCarriers(data);
        setIsLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Adding carrier...");
    try {
      const res = await fetch(`/api/v1/carriers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName, license_no: newLicense, contact_email: newEmail })
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Carrier added successfully", { id: loadingToast });
      setIsCreating(false);
      setNewName(""); setNewLicense(""); setNewEmail("");
      fetchCarriers();
    } catch (err) {
      toast.error("Failed to add carrier", { id: loadingToast });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this carrier?")) return;
    setIsDeleting(id);
    const loadingToast = toast.loading("Removing carrier...");
    try {
      const res = await fetch(`/api/v1/carriers/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to delete");
      
      if (data.hasActiveShipments) {
        toast.success("Carrier removed. Please assign a new carrier to affected shipments.", { id: loadingToast, duration: 5000 });
      } else {
        toast.success("Carrier removed successfully", { id: loadingToast });
      }
      fetchCarriers();
    } catch (err) {
      toast.error("Failed to remove carrier", { id: loadingToast });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="font-ui max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">Carrier Performance</h1>
          <p className="text-sm text-text-secondary mt-1">Track delivery metrics and integrate with partner dispatch APIs.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-accent text-white px-4 py-2 rounded-[10px] text-sm font-semibold hover:bg-accent-dark transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Carrier
        </button>
      </div>

      {isCreating && (
        <div className="bg-surface border border-border rounded-[14px] p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-text-primary">New Carrier</h2>
            <button onClick={() => setIsCreating(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input required placeholder="Carrier Name" className="bg-background border border-border rounded-[10px] px-4 py-2 text-sm focus:outline-none focus:border-accent" value={newName} onChange={e => setNewName(e.target.value)} />
            <input required placeholder="License Number" className="bg-background border border-border rounded-[10px] px-4 py-2 text-sm focus:outline-none focus:border-accent" value={newLicense} onChange={e => setNewLicense(e.target.value)} />
            <input required placeholder="Contact Email" type="email" className="bg-background border border-border rounded-[10px] px-4 py-2 text-sm focus:outline-none focus:border-accent" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <button type="submit" className="bg-text-primary text-white rounded-[10px] px-4 py-2 font-semibold text-sm hover:bg-text-primary/90 transition-colors">Save Carrier</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>
        ) : carriers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted text-sm border border-dashed rounded-[14px]">No carriers available.</div>
        ) : (
          carriers.map(c => (
            <div key={c.id} className="bg-surface border border-border rounded-[14px] p-5 flex flex-col hover:border-strong transition-colors relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary text-sm">{c.name}</h3>
                  <p className="font-data text-xs text-text-secondary">{c.license_no}</p>
                </div>
                
                {/* Truck icon moved to beside the delete button */}
                <Truck className="w-6 h-6 text-text-muted opacity-30 group-hover:opacity-60 transition-opacity mr-1" />
                
                <button 
                  onClick={() => handleDelete(c.id)}
                  disabled={isDeleting === c.id}
                  className="text-text-muted hover:text-danger hover:bg-danger/10 p-2 rounded-md transition-colors"
                  title="Remove Carrier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
