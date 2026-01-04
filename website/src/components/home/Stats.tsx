import { Package, TestTube, FileCode2, Gauge } from 'lucide-react';

const STATS = [
  {
    icon: Package,
    value: '0',
    label: 'Dependencies',
    description: 'Zero runtime dependencies',
  },
  {
    icon: TestTube,
    value: '100%',
    label: 'Test Coverage',
    description: 'Comprehensive test suite',
  },
  {
    icon: FileCode2,
    value: '100%',
    label: 'TypeScript',
    description: 'Full type safety',
  },
  {
    icon: Gauge,
    value: '<10KB',
    label: 'Bundle Size',
    description: 'Minimal footprint',
  },
];

export function Stats() {
  return (
    <section className="py-16 stats-section border-y border-zinc-800/60 bg-zinc-950/80">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/60 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
                  <Icon className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="font-semibold text-zinc-100 mb-1">{stat.label}</div>
                <div className="text-sm text-zinc-500">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
