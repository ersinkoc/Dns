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
    <section className="py-24 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-zinc-950/50" />

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Why @oxog/dns?</h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
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
                  'group rounded-2xl p-6 feature-card',
                  'bg-zinc-900/60 backdrop-blur-sm',
                  'border border-zinc-800/80',
                  'hover:border-indigo-500/40 hover:bg-zinc-900/80',
                  'transition-all duration-300'
                )}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
                  <Icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-100">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
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
