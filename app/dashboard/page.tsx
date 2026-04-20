'use client';

import { useState } from 'react';
import { AIChat } from '@/components/dashboard/AIChat';
import { NudgeBanner } from '@/components/dashboard/NudgeBanner';
import type { Nudge } from '@/lib/engines/nudgeEngine';

export default function DashboardPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [activeNudge, setActiveNudge] = useState<Nudge | null>({
    type: 'ROUTE_SUGGESTION',
    message: 'Food Court Gate B has high congestion. Route via Gate D recommended.',
    priority: 'HIGH',
    expiresAt: 9999999999999,
    actionLabel: 'View Route',
  });

  return (
    <>
      {/* Map Area placeholder */}
      <div className="flex-1 relative bg-[#e5e5e5] h-full flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <h2 className="font-bold text-black uppercase tracking-widest opacity-50">
            Google Maps Instance
          </h2>
          <p className="text-xs text-black opacity-40 mt-2">Requires real coordinate injection</p>
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute right-4 bottom-4 flex flex-col gap-2">
          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              className="bg-black text-white w-14 h-14 shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
              aria-label="Open AI Assistant"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* AI Chat Over/Side Panel */}
      {chatOpen && (
        <div className="absolute inset-0 md:relative md:w-96 md:h-full z-30 shadow-2xl transition-all h-full bg-white border-l border-border">
          <AIChat onClose={() => setChatOpen(false)} />
        </div>
      )}

      {/* Notification Layer */}
      {activeNudge && (
        <NudgeBanner
          nudge={activeNudge}
          onDismiss={() => setActiveNudge(null)}
          onAccept={() => setActiveNudge(null)}
        />
      )}
    </>
  );
}
