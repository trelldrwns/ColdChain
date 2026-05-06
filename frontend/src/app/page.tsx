"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Box, Snowflake, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const [trackingId, setTrackingId] = useState("");
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      router.push(`/track/${trackingId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-ui text-text-primary selection:bg-accent selection:text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Snowflake className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-text-primary">
            Cold<span className="text-accent">Chain</span>
          </span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="px-5 py-2 text-sm font-medium text-text-primary bg-muted hover:bg-border rounded-[8px] transition-colors"
        >
          Partner Login
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="text-center z-10 max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise GDP Compliant Cold Chain</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-text-primary mb-6 leading-[1.1]">
            Trust in every <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#3B82F6]">
              temperature drop.
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Real-time telemetry and immutable tracking for the world's most sensitive medical and biological payloads.
          </p>
        </div>

        {/* Tracking Search Component */}
        <div className="w-full max-w-xl z-10 bg-white p-2 pl-6 rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-border flex items-center transition-shadow focus-within:shadow-[0_8px_40px_rgba(14,165,176,0.15)] focus-within:border-accent">
          <Box className="text-text-muted w-5 h-5 mr-3 shrink-0" />
          <form onSubmit={handleTrack} className="flex-1 flex items-center">
            <input
              type="text"
              placeholder="Enter Tracking Number (e.g. TRK-4158)..."
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="flex-1 py-4 bg-transparent outline-none text-text-primary font-data placeholder:font-ui placeholder:text-text-muted"
              required
            />
            <button
              type="submit"
              className="ml-4 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-[10px] font-medium transition-colors flex items-center gap-2 group"
            >
              Track 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer / Trust Indicators */}
      <footer className="border-t border-border mt-auto bg-white/50">
        <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">© 2026 ColdChain Monitor. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-text-secondary">
            <span className="hover:text-accent cursor-pointer transition-colors">GDP Certified</span>
            <span className="hover:text-accent cursor-pointer transition-colors">FDA Title 21 CFR Part 11</span>
            <span className="hover:text-accent cursor-pointer transition-colors">ISO 9001</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
