"use client";
import { useState, useEffect } from "react";
import { ShieldAlert, Clock, User } from "lucide-react";

export default function SettingsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`\${process.env.NEXT_PUBLIC_API_URL || `\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/v1/audit`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        setIsLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="font-ui max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">Audit & Compliance Logs</h1>
        <p className="text-sm text-text-secondary mt-1">Immutable record of administrative actions for GDP compliance and accountability.</p>
      </div>

      <div className="bg-surface border border-border rounded-[14px] overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">No audit logs found.</div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map(log => (
              <div key={log.id} className="p-4 flex gap-4 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                  {log.action.includes('UPDATE') ? <ShieldAlert className="w-4 h-4 text-accent" /> : <Clock className="w-4 h-4 text-text-secondary" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-text-primary">
                      <span className="bg-muted px-1.5 py-0.5 rounded text-xs text-text-secondary mr-2 uppercase tracking-wide">
                        {log.action.replace('_', ' ')}
                      </span>
                      {log.entity_type}: <span className="font-data">{log.entity_id.split('-')[0]}...</span>
                    </p>
                    <span className="font-data text-xs text-text-muted whitespace-nowrap ml-4">
                      {new Date(log.ts).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary flex items-center gap-2 mb-2">
                    <User className="w-3 h-3" />
                    <span>{log.user_name} ({log.user_email})</span>
                  </div>
                  <div className="bg-muted/50 rounded border border-border p-2">
                    <pre className="text-[10px] text-text-secondary font-data overflow-x-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
