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
  const [carriers, setCarriers] = useState<any[]>([]);
  
  const [selectedProducts, setSelectedProducts] = useState<{id: string, quantity: string}[]>([{ id: "", quantity: "1" }]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState("");

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

      // Fetch carriers
      fetch(`/api/v1/carriers/performance`, { credentials: "include" })
        .then(res => res.json())
        .then(data => { if(Array.isArray(data)) setCarriers(data); })
        .catch(console.error);
    }
  }, [isOpen]);

  const addProductRow = () => {
    setSelectedProducts([...selectedProducts, { id: "", quantity: "1" }]);
  };

  const updateProductRow = (index: number, field: "id" | "quantity", value: string) => {
    const newArr = [...selectedProducts];
    newArr[index][field] = value;
    setSelectedProducts(newArr);
  };

  const removeProductRow = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      tracking_no: trackingNo,
      origin,
      destination,
      products: selectedProducts.filter(p => p.id !== "").map(p => ({ id: p.id, quantity: parseInt(p.quantity) || 1 })),
      sensor_id: selectedSensor || null,
      carrier_id: selectedCarrier || null
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
      // Reset form
      setSelectedProducts([{ id: "", quantity: "1" }]);
      setSelectedSensor("");
      setSelectedCarrier("");
      setOrigin("");
      setDestination("");
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
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
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
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Payload Details</h3>
              <button type="button" onClick={addProductRow} className="text-xs text-accent font-medium hover:underline">+ Add Medicine</button>
            </div>
            
            <div className="space-y-3">
              {selectedProducts.map((sp, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <select value={sp.id} onChange={e => updateProductRow(idx, "id", e.target.value)} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none">
                      <option value="">Select a Product (Optional)</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div className="w-20">
                    <input type="number" min="1" value={sp.quantity} onChange={e => updateProductRow(idx, "quantity", e.target.value)} placeholder="Qty" className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none" />
                  </div>
                  {selectedProducts.length > 1 && (
                    <button type="button" onClick={() => removeProductRow(idx)} className="text-text-muted hover:text-danger p-1">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2"><RadioTower className="w-4 h-4 text-accent" /> Sensor</h3>
              <select value={selectedSensor} onChange={e => setSelectedSensor(e.target.value)} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none font-data">
                <option value="">No Sensor</option>
                {sensors.map(s => <option key={s.id} value={s.id}>{s.serial_no} ({s.battery_pct}%)</option>)}
              </select>
            </div>
            <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2"><Truck className="w-4 h-4 text-accent" /> Carrier</h3>
              <select value={selectedCarrier} onChange={e => setSelectedCarrier(e.target.value)} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-accent outline-none font-data">
                <option value="">No Carrier</option>
                {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
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
