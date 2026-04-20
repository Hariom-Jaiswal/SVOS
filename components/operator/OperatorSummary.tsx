import React from 'react';

interface OperatorSummaryProps {
  totalZones: number;
  criticalZones: number;
  avgRisk: number;
}

/**
 * Summary card for the operator command center.
 *
 * DESIGN DECISION: PREDICTION RELIABILITY
 * This high-level view consolidates fragmented telemetry into a single
 * "Venue Health Index", allowing staff to prioritize global safety decisions.
 */
export function OperatorSummary({ totalZones, criticalZones, avgRisk }: OperatorSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 border-t border-b border-white/10 py-8">
      <div className="px-4">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-2">
          Venue Health Index
        </p>
        <div className="text-4xl font-light tracking-tighter">
          {Math.round(100 - avgRisk)}
          <span className="text-xl opacity-30">%</span>
        </div>
      </div>

      <div className="px-4 border-l border-white/10">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-2">
          Critical Alerts
        </p>
        <div
          className={`text-4xl font-light tracking-tighter ${criticalZones > 0 ? 'text-[#ff0000]' : 'text-white'}`}
        >
          {criticalZones}
        </div>
      </div>

      <div className="px-4 border-l border-white/10">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-2">
          Monitoring Nodes
        </p>
        <div className="text-4xl font-light tracking-tighter">{totalZones}</div>
      </div>
    </div>
  );
}
