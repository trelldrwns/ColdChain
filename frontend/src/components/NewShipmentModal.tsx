"use client";
import { useState, useEffect } from "react";
import { X, Package, RadioTower } from "lucide-react";
import toast from "react-hot-toast";

export default function NewShipmentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [trackingNo, setTrackingNo] = useState(`TRK-${Math.floor(1000 + Math.random() * 9000)}`);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [selectedSensor, setSelectedSensor] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTrackingNo(`TRK-${Math.floor(1000 + Math.random() * 9000)}`);
      // Fetch available products
      fetch(`/api/v1/products`, { credentials: "include" })
        .then(res => res.json())
        .then(data => { if(Array.isArray(data)) setProducts(data); })
        .catch(console.error);

      // Fetch unassigned sensors
      fetch(`/api/v1/sensors?unassigned=true`, { credentials: "include" })
        .then(res => res.json())
        .then(data => { if(Array.isArray(data)) setSensors(data); })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      tracking_no: trackingNo,
      origin,
      destination,
      products: selectedProduct ? [{ id: selectedProduct, quantity: parseInt(quantity) }] : [],
      sensor_id: selectedSensor || null
    };

    try {
      const res = await fetch(`/api/v1/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create shipment");
      toast.success(`Shipment ${trackingNo} created successfully!`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create shipment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-ui">
      <div className="bg-surface w-full max-w-lg rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold">New Shipment</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Tracking Number</label>
              <input type="text" value={trackingNo} readOnly className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-text-primary font-data text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Origin</label>
              <input required type="text" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Berlin" className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Destination</label>
              <input required type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Paris" className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none" />
            </div>
          </div>

          <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Payload Details</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none">
                  <option value="">Select a Product (Optional)</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty" className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none" />
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2"><RadioTower className="w-4 h-4 text-accent" /> Sensor Assignment</h3>
            <select value={selectedSensor} onChange={e => setSelectedSensor(e.target.value)} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none font-data">
              <option value="">No Sensor Attached</option>
              {sensors.map(s => <option key={s.id} value={s.id}>{s.serial_no} (Bat: {s.battery_pct}%)</option>)}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50">
              {loading ? "Creating..." : "Create Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
