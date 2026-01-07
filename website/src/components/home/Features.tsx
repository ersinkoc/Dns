import { Zap, Shield, Database, Lock, Puzzle, FileCode } from 'lucide-react';
import { FEATURES } from '@/lib/constants';

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
    <section className="py-20 section-alt">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
            Why {FEATURES[0] ? '@oxog/dns' : ''}?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built for developers who value simplicity, type safety, and performance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {FEATURES.map((feature) => {
            const Icon = ICON_MAP[feature.icon as keyof typeof ICON_MAP];
            return (
              <div key={feature.title} className="feature-card group">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
