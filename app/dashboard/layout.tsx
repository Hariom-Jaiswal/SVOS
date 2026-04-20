import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      <header className="border-b border-border bg-black text-white p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          {/* Stark geometric logo matching Uber style */}
          <div className="w-6 h-6 bg-white shrink-0"></div>
          <h1 className="text-xl font-extrabold uppercase tracking-widest leading-none">SVOS</h1>
        </div>

        <nav className="hidden md:flex gap-6 uppercase text-xs font-bold tracking-widest">
          <a href="/dashboard" className="opacity-100 underline decoration-2 underline-offset-4">
            Map
          </a>
          <a href="#" className="opacity-50 hover:opacity-100 transition-opacity">
            Schedule
          </a>
          <a href="#" className="opacity-50 hover:opacity-100 transition-opacity">
            Tickets
          </a>
          <a href="#" className="opacity-50 hover:opacity-100 transition-opacity">
            Profile
          </a>
        </nav>

        <button aria-label="Menu" className="md:hidden">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="6" width="18" height="2" fill="white" />
            <rect x="3" y="12" width="18" height="2" fill="white" />
            <rect x="3" y="18" width="18" height="2" fill="white" />
          </svg>
        </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">{children}</main>
    </div>
  );
}
