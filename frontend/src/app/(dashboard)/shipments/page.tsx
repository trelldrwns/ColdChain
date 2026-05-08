"use client";
import { useState, useEffect } from "react";
import StatusPill from "@/components/StatusPill";
import { Map, X, Download } from 'lucide-react';
import NewShipmentModal from "@/components/NewShipmentModal";
import TelemetryChart from "@/components/TelemetryChart";
import toast from 'react-hot-toast';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [carriers, setCarriers] = useState<any[]>([]);

  const fetchShipments = () => {
    setIsLoadingList(true);
    fetch(`/api/v1/shipments`, {credentials: 'include'})
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setShipments(data);
        setIsLoadingList(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingList(false);
      });
  };

  useEffect(() => {
    fetchShipments();
    fetch('/api/v1/carriers/performance', {credentials: 'include'})
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setCarriers(data); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedId) {
      setIsLoadingDetails(true);
      fetch(`/api/v1/shipments/${selectedId}`, {credentials: 'include'})
        .then(res => res.json())
        .then(data => {
          setDetailData(data);
          setIsLoadingDetails(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingDetails(false);
        });
    } else {
      setDetailData(null);
    }
  }, [selectedId]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const updatePromise = fetch(`/api/v1/shipments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus })
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update status');
      }
      fetchShipments(); // refresh list
      setDetailData((prev: any) => ({ 
        ...prev, 
        status: newStatus,
        events: newStatus === 'in_transit' ? [] : prev.events 
      })); // update detail panel and clear logs
    });

    toast.promise(updatePromise, {
      loading: 'Updating status...',
      success: `Shipment marked as ${newStatus.replace('_', ' ')}`,
      error: (err) => `Error: ${err.message}`
    });
  };

  const handleUpdateCarrier = (id: string, newCarrierId: string) => {
    const updatePromise = fetch(`/api/v1/shipments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ carrier_id: newCarrierId })
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update carrier');
      }
      fetchShipments(); // refresh list
      // Refresh detail data
      const carrier = carriers.find(c => c.id === newCarrierId);
      setDetailData((prev: any) => ({ ...prev, carrier_id: newCarrierId, carrier_name: carrier?.name || "Unassigned" }));
    });

    toast.promise(updatePromise, {
      loading: 'Assigning carrier...',
      success: 'Carrier assigned successfully',
      error: (err) => `Error: ${err.message}`
    });
  };

  const handleDeleteShipment = (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this trip? This action cannot be undone.")) return;
    
    const deletePromise = fetch(`/api/v1/shipments/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete record');
      }
      setSelectedId(null);
      fetchShipments();
    });

    toast.promise(deletePromise, {
      loading: 'Deleting record...',
      success: 'Trip permanently deleted',
      error: (err) => `Error: ${err.message}`
    });
  };

  const handleDownloadReport = (id: string) => {
    window.open(`/print/${id}`, '_blank');
  };

  return (
    <div className="relative h-full flex flex-col font-ui">
      <div className="flex items-center justify-between mb-6 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">Shipment Tracking</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-accent text-surface rounded-[6px] text-sm font-medium hover:bg-accent-dark transition-colors"
        >
          New Shipment
        </button>
      </div>
      
      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Card Grid */}
        <div className={`flex-1 overflow-auto transition-all duration-300 ${selectedId ? 'pr-[420px]' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
            {isLoadingList ? (
              <div className="col-span-full flex flex-col items-center justify-center space-y-3 py-20">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm text-text-muted">Loading shipments...</div>
              </div>
            ) : shipments.length === 0 ? (
              <div className="col-span-full py-10 text-center text-text-muted text-sm border border-dashed border-border rounded-[14px]">
                No shipments found.
              </div>
            ) : shipments.map(s => (
              <div 
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`bg-surface border rounded-[14px] p-4 cursor-pointer shipment-card transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_rgba(0,0,0,0.05)] ${
                  selectedId === s.id 
                    ? 'border-accent shadow-[0_0_0_2px_var(--accent-light)]' 
                    : 'border-border hover:border-strong'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="font-data text-sm text-text-muted">{s.tracking_no}</span>
                  <StatusPill status={s.status} />
                </div>
                
                {/* Temporary placeholder for live temp */}
                <div className="mb-4">
                  <div className="font-data text-xl text-text-primary">--.-°C</div>
                  <div className="text-sm mt-1">2h left</div>
                </div>

                <div className="text-xs text-text-muted truncate">
                  {s.origin} → {s.destination}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Frosted Detail Panel */}
        <div 
          className={`absolute top-0 right-0 h-full w-[400px] rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.10)] transform transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] z-20 flex flex-col bg-[rgba(255,255,255,0.72)] backdrop-blur-[18px] backdrop-saturate-[160%] border-l border-[rgba(255,255,255,0.55)] ${selectedId ? 'translate-x-0' : 'translate-x-[110%]'}`}
        >
          {detailData && (
            <>
              <div className="p-6 border-b border-[rgba(255,255,255,0.55)] flex justify-between items-center">
                <h2 className="font-semibold text-lg">Details</h2>
                <button onClick={() => setSelectedId(null)} className="text-text-muted hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {isLoadingDetails ? (
                <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-sm text-text-muted font-medium animate-pulse">Fetching latest telemetry...</div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto p-6 space-y-6">
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Tracking ID</div>
                    <div className="font-data text-text-primary">{detailData.tracking_no}</div>
                  </div>
                
                <div className="flex space-x-6">
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Status</div>
                    <StatusPill status={detailData.status} />
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Carrier</div>
                    {detailData.status === 'pending' ? (
                      <select 
                        value={detailData.carrier_id || ""}
                        onChange={(e) => handleUpdateCarrier(detailData.id, e.target.value)}
                        className="bg-white border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full"
                      >
                        <option value="">Select Carrier</option>
                        {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : (
                      <div className="text-sm font-medium">{detailData.carrier_name || "No Carrier Assigned"}</div>
                    )}
                  </div>
                </div>

                <div className="bg-muted rounded-[10px] h-[180px] flex flex-col items-center justify-center text-text-muted text-sm border border-border">
                  <Map className="w-6 h-6 mb-2 opacity-50" />
                  Map Placeholder
                </div>

                <div>
                  <h3 className="font-medium text-sm border-b border-[rgba(255,255,255,0.55)] pb-2 mb-3">Products</h3>
                  <div className="space-y-2">
                    {detailData.products?.map((p: any) => (
                      <div key={p.id} className="text-sm flex justify-between">
                        <span>{p.name} <span className="text-text-muted">({p.sku})</span></span>
                        <span className="font-data text-text-secondary">x{p.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm border-b border-[rgba(255,255,255,0.55)] pb-2 mb-3">Attached Sensors</h3>
                  <div className="space-y-2">
                    {detailData.sensors?.map((s: any) => (
                      <div key={s.id} className="text-sm flex justify-between items-center">
                        <span className="font-data">{s.serial_no}</span>
                        <span className={`w-2 h-2 rounded-full ${s.active ? 'bg-ok' : 'bg-danger'}`}></span>
                      </div>
                    ))}
                    {detailData.sensors?.length === 0 && <div className="text-sm text-text-muted">No sensors attached</div>}
                  </div>
                </div>

                {detailData.events?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm border-b border-[rgba(255,255,255,0.55)] pb-2 mb-3">Incident Logs</h3>
                    <div className="space-y-3">
                      {detailData.events.map((e: any) => (
                        <div key={e._id} className="text-xs p-3 bg-danger/10 border border-danger/20 rounded-[8px]">
                          <div className="flex justify-between font-medium mb-1 text-danger">
                            <span className="uppercase tracking-wide">{e.event_type.replace('_', ' ')}</span>
                            <span className="font-data">{new Date(e.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-text-secondary">
                            Sensor <span className="font-data text-text-primary">{e.sensor_serial}</span> recorded abnormal temperature: <span className="font-data font-medium text-text-primary">{e.temperature}°C</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailData.status === 'in_transit' && (
                  <div>
                    <h3 className="font-medium text-sm border-b border-[rgba(255,255,255,0.55)] pb-2 mb-1">Temperature History</h3>
                    <TelemetryChart 
                      shipmentId={detailData.id} 
                      minTemp={detailData.products?.[0]?.min_temp_c} 
                      maxTemp={detailData.products?.[0]?.max_temp_c} 
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-[rgba(255,255,255,0.55)]">
                  <button 
                    onClick={() => handleDownloadReport(detailData.id)}
                    className="w-full py-3 bg-surface text-text-primary rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-white transition-colors border border-border shadow-sm"
                  >
                    <Download className="w-4 h-4 text-accent" />
                    Download GDP Report (PDF)
                  </button>
                </div>

                {detailData.status === 'pending' && (
                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => handleUpdateStatus(detailData.id, 'in_transit')}
                      className="flex-1 py-3 bg-accent text-white font-medium text-sm rounded-xl hover:bg-accent-dark transition-colors"
                    >
                      Accept & Dispatch
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(detailData.id, 'cancelled')}
                      className="flex-1 py-3 bg-surface border border-danger text-danger font-medium text-sm rounded-xl hover:bg-danger hover:text-white transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {detailData.status === 'in_transit' && (
                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => handleUpdateStatus(detailData.id, 'delivered')}
                      className="flex-1 py-3 bg-surface border border-ok text-[#15803D] font-medium text-sm rounded-xl hover:bg-ok hover:text-white transition-colors"
                    >
                      Mark Delivered
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(detailData.id, 'flagged')}
                      className="flex-1 py-3 bg-surface border border-danger text-danger font-medium text-sm rounded-xl hover:bg-danger hover:text-white transition-colors"
                    >
                      Flag Anomaly
                    </button>
                  </div>
                )}

                {detailData.status === 'flagged' && (
                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => handleUpdateStatus(detailData.id, 'in_transit')}
                      className="flex-1 py-3 bg-surface border border-ok text-[#15803D] font-medium text-sm rounded-xl hover:bg-ok hover:text-white transition-colors"
                    >
                      Resolve & Unflag
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(detailData.id, 'cancelled')}
                      className="flex-1 py-3 bg-surface border border-danger text-danger font-medium text-sm rounded-xl hover:bg-danger hover:text-white transition-colors"
                    >
                      Halt Trip
                    </button>
                  </div>
                )}

                {(detailData.status === 'cancelled' || detailData.status === 'delivered') && (
                  <div className="pt-4 flex flex-col gap-3">
                    {detailData.status === 'cancelled' && (
                      <button 
                        onClick={() => handleUpdateStatus(detailData.id, 'pending')}
                        className="w-full py-3 bg-accent text-white font-medium text-sm rounded-xl hover:bg-accent-dark transition-colors"
                      >
                        Reinitialize Trip
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteShipment(detailData.id)}
                      className="w-full py-3 bg-surface border border-danger text-danger font-medium text-sm rounded-xl hover:bg-danger hover:text-white transition-colors"
                    >
                      Delete Record
                    </button>
                  </div>
                )}
              </div>
              )}
            </>
          )}
        </div>
      </div>

      <NewShipmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchShipments} 
      />
    </div>
  );
}
