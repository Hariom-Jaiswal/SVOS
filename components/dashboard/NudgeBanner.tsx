import React from 'react';
import type { Nudge } from '@/lib/engines/nudgeEngine';

interface NudgeBannerProps {
  nudge: Nudge;
  onAccept: () => void;
  onDismiss: () => void;
}

export function NudgeBanner({ nudge, onAccept, onDismiss }: NudgeBannerProps) {
  // Using pure minimalist Uber-like colors (Black, White, Gray, Red)
  const colorMap = {
    URGENT: 'bg-[#ff0000] text-white',
    HIGH: 'bg-black text-white border-2 border-[#ff0000]',
    MEDIUM: 'bg-[#1f1f1f] text-white',
    LOW: 'bg-[#f6f6f6] text-black border border-border',
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`fixed bottom-4 left-4 right-4 rounded-none p-5 shadow-2xl z-50 transition-all transform duration-300 ease-in-out ${colorMap[nudge.priority]}`}
    >
      <p className="font-bold text-sm tracking-wide">{nudge.message}</p>

      <div className="flex gap-4 mt-4 items-center">
        {nudge.actionLabel && (
          <button
            onClick={onAccept}
            className="bg-white text-black px-6 py-2 font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            {nudge.actionLabel}
          </button>
        )}
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className={`text-xs uppercase tracking-widest font-semibold opacity-70 hover:opacity-100 transition-opacity focus:outline-none underline underline-offset-4 ${
            nudge.priority === 'URGENT' ? 'text-white' : ''
          }`}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
