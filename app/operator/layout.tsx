import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SVOS | Operator Command Center',
  description: 'Mission-critical arena management and crowd safety intelligence.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-white selection:text-black">
      <header className="border-b border-white/20 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-4 h-4 bg-[#ff0000] animate-pulse"></div>
          <h1 className="text-lg font-bold tracking-[0.2em] uppercase">SVOS Command</h1>
        </div>

        <div className="flex items-center space-x-6 text-xs tracking-widest opacity-80">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>SYSTEM_NOMINAL</span>
          </div>
          <div>OPS: AD1_LIMA</div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-white/20 p-6 hidden lg:flex flex-col space-y-6">
          <nav className="flex flex-col space-y-4 text-xs tracking-widest opacity-60">
            <a
              href="/operator"
              className="text-white opacity-100 uppercase underline underline-offset-4"
            >
              Live Matrix
            </a>
            <a href="#" className="hover:opacity-100 transition-opacity uppercase">
              Incidents
            </a>
            <a href="#" className="hover:opacity-100 transition-opacity uppercase">
              Manual Nudges
            </a>
            <a href="#" className="hover:opacity-100 transition-opacity uppercase">
              System Logs
            </a>
          </nav>
        </aside>

        <main className="flex-1 relative overflow-auto p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
