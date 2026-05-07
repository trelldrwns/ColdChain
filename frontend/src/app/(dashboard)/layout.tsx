"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Thermometer, User, Activity, Settings, Box, Truck, ExternalLink } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden bg-page font-ui text-base">
      {/* Sidebar: 60px icon-only by default. Dark navy */}
      <aside className="group w-[60px] hover:w-[220px] transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] bg-sidebar-bg text-sidebar-text flex flex-col z-20 shrink-0 overflow-hidden">
        <div className="h-[56px] flex items-center px-4 border-b border-[#1A2C42]/50">
          <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center font-bold text-surface">
            CC
          </div>
          <span className="ml-4 text-surface font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            ColdChain
          </span>
        </div>
        <nav className="flex-1 py-4 flex flex-col space-y-1">
          <Link href="/dashboard" className={`flex items-center px-4 py-3 hover:bg-sidebar-active hover:text-surface transition-all group/link ${isActive('/dashboard') ? 'bg-sidebar-active text-surface shadow-[inset_4px_0_0_var(--accent)]' : ''}`}>
            <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${isActive('/dashboard') ? 'text-accent' : ''}`} strokeWidth={2} />
            <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium text-sm">Dashboard</span>
          </Link>
          <Link href="/shipments" className={`flex items-center px-4 py-3 hover:bg-sidebar-active hover:text-surface transition-all group/link ${isActive('/shipments') ? 'bg-sidebar-active text-surface shadow-[inset_4px_0_0_var(--accent)]' : ''}`}>
            <Package className={`w-5 h-5 flex-shrink-0 ${isActive('/shipments') ? 'text-accent' : ''}`} strokeWidth={2} />
            <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium text-sm">Shipments</span>
          </Link>
          <Link href="/sensors" className={`flex items-center px-4 py-3 hover:bg-sidebar-active hover:text-surface transition-all group/link ${isActive('/sensors') ? 'bg-sidebar-active text-surface shadow-[inset_4px_0_0_var(--accent)]' : ''}`}>
            <Thermometer className={`w-5 h-5 flex-shrink-0 ${isActive('/sensors') ? 'text-accent' : ''}`} strokeWidth={2} />
            <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium text-sm">Sensors</span>
          </Link>
          <Link href="/timeline" className={`flex items-center px-4 py-3 hover:bg-sidebar-active hover:text-surface transition-all group/link ${isActive('/timeline') ? 'bg-sidebar-active text-surface shadow-[inset_4px_0_0_var(--accent)]' : ''}`}>
            <Activity className={`w-5 h-5 flex-shrink-0 ${isActive('/timeline') ? 'text-accent' : ''}`} strokeWidth={2} />
            <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium text-sm">Timeline</span>
          </Link>
          <Link href="/carriers" className={`flex items-center px-4 py-3 hover:bg-sidebar-active hover:text-surface transition-all group/link ${isActive('/carriers') ? 'bg-sidebar-active text-surface shadow-[inset_4px_0_0_var(--accent)]' : ''}`}>
            <Truck className={`w-5 h-5 flex-shrink-0 ${isActive('/carriers') ? 'text-accent' : ''}`} strokeWidth={2} />
            <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium text-sm">Carriers</span>
          </Link>
          <Link href="/products" className={`flex items-center px-4 py-3 hover:bg-sidebar-active hover:text-surface transition-all group/link ${isActive('/products') ? 'bg-sidebar-active text-surface shadow-[inset_4px_0_0_var(--accent)]' : ''}`}>
            <Box className={`w-5 h-5 flex-shrink-0 ${isActive('/products') ? 'text-accent' : ''}`} strokeWidth={2} />
            <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium text-sm">Products</span>
          </Link>
          <Link href="/settings" className={`flex items-center px-4 py-3 hover:bg-sidebar-active hover:text-surface transition-all group/link ${isActive('/settings') ? 'bg-sidebar-active text-surface shadow-[inset_4px_0_0_var(--accent)]' : ''}`}>
            <Settings className={`w-5 h-5 flex-shrink-0 ${isActive('/settings') ? 'text-accent' : ''}`} strokeWidth={2} />
            <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium text-sm">Audit & Settings</span>
          </Link>
        </nav>
        
        {/* Bottom Sidebar Action */}
        <div className="p-2 mb-2 border-t border-[#1A2C42]/50">
          <Link href="/" className="flex items-center px-2 py-3 hover:bg-sidebar-active hover:text-surface transition-all group/link rounded-lg text-text-secondary">
            <ExternalLink className="w-5 h-5 flex-shrink-0 ml-0.5" strokeWidth={2} />
            <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium text-sm">Public Portal</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar: white, no shadow */}
        <header className="h-[56px] bg-surface border-b border-border flex items-center justify-between px-6 z-10 shrink-0">
          <div className="font-semibold text-lg text-text-primary tracking-tight">Overview</div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-text-primary">Admin User</span>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-text-secondary">
              <User className="w-4 h-4" />
            </div>
            <button 
              onClick={() => {
                fetch('/auth/logout').then(() => window.location.href = '/login');
              }}
              className="ml-4 text-xs font-medium text-danger hover:underline"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-page">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" toastOptions={{ className: 'font-ui text-sm rounded-xl' }} />
    </div>
  );
}
