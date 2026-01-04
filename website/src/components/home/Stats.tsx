import { Package, TestTube, FileCode2, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <section className="py-16 border-y border-border bg-card/50 stats-section">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">
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
