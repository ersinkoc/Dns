import { Zap, Shield, Database, Lock, Puzzle, FileCode } from 'lucide-react';
import { FEATURES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  Zap,
  Shield,
  Database,
  Lock,
  Puzzle,
  FileCode,
};

export function Features() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why @oxog/dns?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A modern DNS library designed for performance, security, and developer experience.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {FEATURES.map((feature) => {
            const Icon = ICON_MAP[feature.icon as keyof typeof ICON_MAP];
            return (
              <div
                key={feature.title}
                className={cn(
                  'group rounded-xl border border-border bg-card p-6 feature-card',
                  'hover:border-primary/50 hover:shadow-lg transition-all duration-300'
                )}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
