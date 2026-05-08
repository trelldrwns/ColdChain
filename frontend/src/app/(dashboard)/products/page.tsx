"use client";
import { useState, useEffect } from "react";
import { Plus, Box, Trash } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New product form
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [minTemp, setMinTemp] = useState("2");
  const [maxTemp, setMaxTemp] = useState("8");
  const [isAdding, setIsAdding] = useState(false);

  const fetchProducts = () => {
    setIsLoading(true);
    fetch(`/api/v1/products`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        setIsLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, sku, description, min_temp_c: Number(minTemp), max_temp_c: Number(maxTemp) })
      });
      if (res.ok) {
        setIsAdding(false);
        setName(""); setSku(""); setDescription(""); setMinTemp("2"); setMaxTemp("8");
        fetchProducts();
      } else {
        alert("Failed to add product");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/v1/products/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete product");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  };

  return (
    <div className="font-ui max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">Product Catalog</h1>
          <p className="text-sm text-text-secondary mt-1">Manage payload types and strict safety temperature boundaries.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors flex items-center gap-2"
        >
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Product</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddProduct} className="bg-surface border border-border rounded-[14px] p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Product Name</label>
              <input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. mRNA Vaccine" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-accent text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">SKU</label>
              <input required value={sku} onChange={e=>setSku(e.target.value.toUpperCase())} placeholder="e.g. MRNA-100" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-accent font-data text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
            <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional description" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-accent text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block text-xs font-medium text-danger mb-1">Min Safe Temperature (°C)</label>
              <input required type="number" value={minTemp} onChange={e=>setMinTemp(e.target.value)} className="w-full px-3 py-2 border border-danger/30 bg-danger/5 rounded-lg outline-none focus:ring-2 focus:ring-danger text-sm font-data" />
            </div>
            <div>
              <label className="block text-xs font-medium text-danger mb-1">Max Safe Temperature (°C)</label>
              <input required type="number" value={maxTemp} onChange={e=>setMaxTemp(e.target.value)} className="w-full px-3 py-2 border border-danger/30 bg-danger/5 rounded-lg outline-none focus:ring-2 focus:ring-danger text-sm font-data" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-6 py-2 bg-text-primary text-white text-sm font-medium rounded-lg">Save Product</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted text-sm border border-dashed rounded-[14px]">No products in catalog.</div>
        ) : (
          products.map(p => (
            <div key={p.id} className="bg-surface border border-border rounded-[14px] p-5 flex flex-col justify-between hover:border-strong transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Box className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary text-sm">{p.name}</h3>
                    <p className="font-data text-xs text-text-secondary">{p.sku}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="text-xs text-text-muted line-clamp-2 mb-4 h-8">{p.description || "No description provided."}</p>
                <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-text-muted uppercase font-semibold">Min Temp</div>
                    <div className="font-data text-sm font-medium text-text-primary">{p.min_temp_c}°C</div>
                  </div>
                  <div className="w-px h-6 bg-border"></div>
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-text-muted uppercase font-semibold">Max Temp</div>
                    <div className="font-data text-sm font-medium text-text-primary">{p.max_temp_c}°C</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
