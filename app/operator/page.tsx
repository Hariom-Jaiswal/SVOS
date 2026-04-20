'use client';

import { useState } from 'react';
// Mock live data payload for the operator dashboard
const MOCK_ZONES = [
  { id: 'Z_NTH', name: 'North Gate', score: 88, trend: 'WORSENING', status: 'CRITICAL' },
  { id: 'Z_FDC', name: 'Food Court Main', score: 55, trend: 'STABLE', status: 'MEDIUM' },
  { id: 'Z_WST', name: 'West Wing Corridor', score: 12, trend: 'IMPROVING', status: 'LOW' },
];

export default function OperatorPage() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'nudges'>('metrics');

  return (
    <div className="h-full flex flex-col space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-white/20 pb-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">ZONE MATRICES</h2>
          <p className="text-sm opacity-60 mt-1 uppercase tracking-widest">
            Real-time spatial heuristics
          </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {MOCK_ZONES.map((zone) => (
          <div
            key={zone.id}
            className="border border-white/20 bg-[#111] p-6 hover:border-white/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold tracking-widest uppercase">{zone.name}</h3>
              <span
                className={`text-xs font-black uppercase px-2 py-1 ${zone.status === 'CRITICAL' ? 'bg-[#ff0000] text-white' : 'bg-white/10 text-white/80'}`}
              >
                {zone.status}
              </span>
            </div>

            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Risk Index</p>
                <div className="text-5xl font-light">
                  {zone.score}
                  <span className="text-2xl opacity-50">/100</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">
                  Vector Trend
                </p>
                <div
                  className={`text-sm font-bold tracking-widest ${zone.trend === 'WORSENING' ? 'text-[#ff0000]' : 'text-white'}`}
                >
                  {zone.trend === 'WORSENING' ? '↑' : zone.trend === 'IMPROVING' ? '↓' : '→'}{' '}
                  {zone.trend}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
