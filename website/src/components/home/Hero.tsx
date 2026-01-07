import { Link } from 'react-router-dom';
import { ArrowRight, Github } from 'lucide-react';
import { InstallTabs } from '@/components/common/InstallTabs';
import { GITHUB_REPO, DESCRIPTION, VERSION } from '@/lib/constants';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 hero-bg" />
      <div className="absolute inset-0 -z-10 bg-grid-subtle opacity-50" />

      <div className="container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-3xl mx-auto text-center">
          {/* Version Badge */}
          <div className="inline-flex items-center gap-2 badge-primary mb-8">
            <span className="text-primary font-semibold">v{VERSION}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Now Available</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Zero-Dependency </span>
            <span className="text-gradient">DNS Library</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            {DESCRIPTION}. The only DNS library you'll ever need for building professional applications.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link to="/docs" className="btn-primary">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>

          {/* Install Command */}
          <div className="max-w-md mx-auto">
            <InstallTabs />
          </div>
        </div>
      </div>
    </section>
  );
}
