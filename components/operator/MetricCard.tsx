import React from 'react';

interface MetricCardProps {
  name: string;
  score: number;
  trend: string;
  status: string;
}

/**
 * MetricCard component for displaying individual zone statistics.
 *
 * DESIGN DECISION: ACCESSIBILITY
 * Uses aria-describedby to provide a summary of the zone's health to screen readers.
 */
export function MetricCard({ name, score, trend, status }: MetricCardProps) {
  const isCritical = status === 'CRITICAL';

  return (
    <div
      className="border border-white/20 bg-[#111] p-6 hover:border-white/50 transition-colors"
      role="region"
      aria-labelledby={`zone-title-${name}`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 id={`zone-title-${name}`} className="font-bold tracking-widest uppercase">
          {name}
        </h3>
        <span
          className={`text-xs font-black uppercase px-2 py-1 ${isCritical ? 'bg-[#ff0000] text-white' : 'bg-white/10 text-white/80'}`}
          aria-label={`Status: ${status}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Risk Index</p>
          <div className="text-5xl font-light">
            {score}
            <span className="text-2xl opacity-50">/100</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Vector Trend</p>
          <div
            className={`text-sm font-bold tracking-widest ${trend === 'WORSENING' ? 'text-[#ff0000]' : 'text-white'}`}
          >
            {trend === 'WORSENING' ? '↑' : trend === 'IMPROVING' ? '↓' : '→'} {trend}
          </div>
        </div>
      </div>
    </div>
  );
}
