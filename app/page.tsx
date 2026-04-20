import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-white shrink-0" />
          <span className="font-extrabold tracking-[0.3em] uppercase text-sm">SVOS</span>
        </div>
        <nav className="flex gap-6 text-xs tracking-widest uppercase opacity-60">
          <a href="#how" className="hover:opacity-100 transition-opacity">
            How it works
          </a>
          <a href="#stack" className="hover:opacity-100 transition-opacity">
            Stack
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-start justify-center px-8 md:px-24 py-24 max-w-5xl">
        <div className="uppercase text-xs tracking-[0.4em] text-white/40 mb-6">
          Google Solution Challenge 2025
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-8">
          Smart Venue
          <br />
          <span className="text-white/30">Operating System</span>
        </h1>

        <p className="text-white/60 text-lg max-w-xl mb-12 leading-relaxed">
          AI-powered crowd intelligence, predictive routing, and real-time coordination for
          large-scale sporting events — eliminating bottlenecks before they happen.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="group flex items-center justify-center gap-3 bg-white text-black px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-white/90 transition-colors"
          >
            Attendee Dashboard
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
          <Link
            href="/operator"
            className="flex items-center justify-center gap-3 border border-white/30 text-white px-8 py-4 font-bold uppercase tracking-widest text-sm hover:border-white hover:bg-white/5 transition-colors"
          >
            Operator Command Center
          </Link>
        </div>
      </section>

      {/* Feature Strip */}
      <section
        id="how"
        className="border-t border-white/10 px-8 md:px-24 py-16 grid grid-cols-1 md:grid-cols-3 gap-12"
      >
        {[
          {
            label: 'Crowd Intelligence',
            desc: 'Real-time zone risk scoring (0–100) using density, velocity, and inflow vectors.',
            icon: '⬡',
          },
          {
            label: 'Smart Nudging',
            desc: 'Proactive safety alerts and routing suggestions with intelligent cooldown mechanics.',
            icon: '↗',
          },
          {
            label: 'AI Assistant',
            desc: 'Gemini-powered chat aware of live crowd, queue wait times, and your current zone.',
            icon: '◈',
          },
        ].map((f) => (
          <div key={f.label} className="border-l border-white/20 pl-6">
            <div className="text-2xl mb-4 opacity-60">{f.icon}</div>
            <h3 className="font-bold uppercase tracking-widest text-sm mb-3">{f.label}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Stack Footer */}
      <section
        id="stack"
        className="border-t border-white/10 px-8 md:px-24 py-8 flex flex-wrap gap-6 text-xs tracking-widest uppercase text-white/30"
      >
        {[
          'Gemini 1.5 Pro',
          'Vertex AI',
          'Google Maps Routes API',
          'Firebase Auth',
          'Upstash Rate Limiting',
          'Next.js 16',
        ].map((s) => (
          <span key={s}>{s}</span>
        ))}
      </section>
    </main>
  );
}
