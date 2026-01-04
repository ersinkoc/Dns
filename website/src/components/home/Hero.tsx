import { Link } from 'react-router-dom';
import { ArrowRight, Github, Sparkles } from 'lucide-react';
import { InstallTabs } from '@/components/common/InstallTabs';
import { PACKAGE_NAME, GITHUB_REPO, DESCRIPTION } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated background with aurora effect */}
      <div className="absolute inset-0 -z-10 hero-gradient">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.3),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.4),transparent)]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/15 to-indigo-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge - glass morphism */}
          <div className="badge-primary inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm mb-8">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">
              <span className="text-indigo-400">Zero Dependencies</span>
              <span className="text-zinc-500 mx-2">|</span>
              <span className="text-indigo-400">100% TypeScript</span>
              <span className="text-zinc-500 mx-2">|</span>
              <span className="text-indigo-400">100% Coverage</span>
            </span>
          </div>

          {/* Title with glow */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent glow-text">
              {PACKAGE_NAME}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-zinc-300 font-medium mb-4">
            Zero-Dependency DNS Library
          </p>

          {/* Description */}
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {DESCRIPTION}. All without a single runtime dependency.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/docs"
              className={cn(
                'btn-primary inline-flex items-center justify-center gap-2',
                'px-8 py-3.5 rounded-xl font-semibold',
                'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
                'hover:from-indigo-400 hover:to-purple-400',
                'shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
                'transition-all duration-300'
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
                'px-8 py-3.5 rounded-xl font-semibold',
                'border border-zinc-700 bg-zinc-900/50 backdrop-blur-sm text-zinc-200',
                'hover:border-zinc-600 hover:bg-zinc-800/50',
                'transition-all duration-300'
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
