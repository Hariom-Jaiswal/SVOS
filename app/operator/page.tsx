'use client';

import { useState, useMemo } from 'react';
import { MetricCard } from '@/components/operator/MetricCard';
import { OperatorSummary } from '@/components/operator/OperatorSummary';

// Mock live data payload for the operator dashboard
const MOCK_ZONES = [
  { id: 'Z_NTH', name: 'North Gate', score: 88, trend: 'WORSENING', status: 'CRITICAL' },
  { id: 'Z_FDC', name: 'Food Court Main', score: 55, trend: 'STABLE', status: 'MEDIUM' },
  { id: 'Z_WST', name: 'West Wing Corridor', score: 12, trend: 'IMPROVING', status: 'LOW' },
];

/**
 * Operator Command Center
 *
 * DESIGN DECISION: SEPARATION OF CONCERNS
 * The page acts as a "Controller" that aggregates data and orchestrates
 * the display, while cards and summaries handle their own internal rendering logic.
 */
export default function OperatorPage() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'nudges'>('metrics');

  const stats = useMemo(() => {
    const totalZones = MOCK_ZONES.length;
    const criticalZones = MOCK_ZONES.filter((z) => z.status === 'CRITICAL').length;
    const avgRisk = MOCK_ZONES.reduce((acc, z) => acc + z.score, 0) / totalZones;
    return { totalZones, criticalZones, avgRisk };
  }, []);

  return (
    <div className="h-full flex flex-col space-y-8 max-w-7xl mx-auto px-4 lg:px-0">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">OPERATIONS</h2>
          <p className="text-sm opacity-60 mt-1 uppercase tracking-widest">
            Command & Control Interface
          </p>
          <div className="flex space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                Systems: Operational
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                Intelligence: Active
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${activeTab === 'metrics' ? 'bg-white text-black border-white' : 'border-white/30 text-white/50 hover:text-white'}`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('nudges')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${activeTab === 'nudges' ? 'bg-white text-black border-white' : 'border-white/30 text-white/50 hover:text-white'}`}
          >
            Nudges
          </button>
        </div>
      </div>

      <OperatorSummary {...stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'metrics' ? (
          MOCK_ZONES.map((zone) => <MetricCard key={zone.id} {...zone} />)
        ) : (
          <div className="lg:col-span-3 py-20 border border-dashed border-white/20 text-center">
            <p className="text-xs uppercase tracking-widest opacity-40">
              No active automated nudges in the last 15 minutes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
