"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, MapPin, Truck, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

export default function PublicTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const trackingNo = id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/v1/track/${trackingNo}`)
      .then(res => {
        if (!res.ok) throw new Error("Tracking number not found");
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [trackingNo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-ui">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-ui text-text-primary">
      <header className="border-b border-border bg-white px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-text-secondary hover:text-accent font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </button>
        <div className="font-bold tracking-tight">
          Cold<span className="text-accent">Chain</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {error ? (
          <div className="text-center py-20 bg-white rounded-[16px] border border-border shadow-sm">
            <Box className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Shipment Not Found</h2>
            <p className="text-text-secondary">We couldn't locate tracking number <span className="font-data">{trackingNo}</span></p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header Card */}
            <div className="bg-white rounded-[20px] p-8 border border-border shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-1">Tracking Info</h1>
                  <p className="font-data text-text-secondary text-lg">{data.tracking_no}</p>
                </div>
                <div className={`px-4 py-2 rounded-full inline-flex items-center gap-2 font-medium border ${data.compliant ? 'bg-ok-light border-[#bbf7d0] text-[#166534]' : 'bg-danger-light border-[#fecaca] text-[#991b1b]'}`}>
                  {data.compliant ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  {data.compliant ? 'GDP Compliant' : 'Excursion Recorded'}
                </div>
              </div>

              {/* Progress Bar Mock */}
              <div className="relative pt-4 pb-8">
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div className={`h-full ${data.status === 'delivered' ? 'w-full' : 'w-1/2'} bg-accent`}></div>
                </div>
                <div className="flex justify-between mt-3 text-sm font-medium">
                  <span className="text-accent">Dispatched</span>
                  <span className={data.status === 'delivered' ? 'text-accent' : 'text-text-muted'}>Delivered</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wide font-medium">Origin</div>
                      <div className="font-medium text-text-primary mt-0.5">{data.origin}</div>
                    </div>
                  </div>
                  <div className="w-0.5 h-6 bg-border ml-4 my-1"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wide font-medium">Destination</div>
                      <div className="font-medium text-text-primary mt-0.5">{data.destination}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-xl p-5 border border-border">
                  <div className="flex items-center gap-2 text-text-secondary mb-3">
                    <Truck className="w-4 h-4" />
                    <span className="font-medium text-sm">Carrier Information</span>
                  </div>
                  <div className="font-medium">{data.carrier}</div>
                  <div className="text-sm text-text-muted mt-1">Dispatched: {new Date(data.dispatch_date).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Live Tracker Map */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Live Tracker</h3>
                  <span className="flex items-center gap-2 text-xs font-medium text-[#15803D] bg-ok-light px-2 py-1 rounded">
                    <span className="w-2 h-2 rounded-full bg-ok animate-pulse"></span>
                    GPS Active
                  </span>
                </div>
                <div className="w-full h-[350px] rounded-xl overflow-hidden border border-border bg-muted shadow-inner relative z-0">
                  <LiveMap origin={data.origin} destination={data.destination} isDelivered={data.status === 'delivered'} />
                </div>
              </div>

            </div>

            {/* Quality Guarantee Disclaimer */}
            <div className="text-center text-sm text-text-muted p-4">
              {data.compliant 
                ? "This shipment has maintained strict temperature boundaries throughout its journey in accordance with ISO 9001 and Good Distribution Practice (GDP)."
                : "A temperature excursion was recorded during transit. Our quality assurance team has been notified. Please contact support for more details before accepting payload."}
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
