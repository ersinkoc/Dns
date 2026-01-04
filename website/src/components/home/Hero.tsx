import { Link } from 'react-router-dom';
import { ArrowRight, Github, Sparkles } from 'lucide-react';
import { InstallTabs } from '@/components/common/InstallTabs';
import { PACKAGE_NAME, GITHUB_REPO, DESCRIPTION } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 hero-gradient">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/15 dark:from-primary/25 dark:via-primary/5 dark:to-transparent animate-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 dark:bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/25 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              <span className="text-primary">Zero Dependencies</span>
              <span className="text-muted-foreground mx-2">|</span>
              <span className="text-primary">100% TypeScript</span>
              <span className="text-muted-foreground mx-2">|</span>
              <span className="text-primary">100% Coverage</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-primary">{PACKAGE_NAME}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-4">
            Zero-Dependency DNS Library
          </p>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            {DESCRIPTION}. All without a single runtime dependency.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/docs"
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'px-6 py-3 rounded-lg font-medium',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'glow'
              )}
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'px-6 py-3 rounded-lg font-medium',
                'border border-border bg-card',
                'hover:bg-accent transition-colors'
              )}
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>

          {/* Install Tabs */}
          <div className="max-w-lg mx-auto">
            <InstallTabs />
          </div>
        </div>
      </div>
    </section>
  );
}
