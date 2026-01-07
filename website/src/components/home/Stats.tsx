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
    <section className="py-12 section-divider border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-gradient mb-1">
                  {stat.value}
                </div>
                <div className="font-medium text-foreground text-sm">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
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
