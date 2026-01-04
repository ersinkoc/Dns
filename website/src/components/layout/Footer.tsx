import { Heart, Github, Package, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PACKAGE_NAME, GITHUB_REPO, NPM_PACKAGE, VERSION, AUTHOR, AUTHOR_GITHUB } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <span className="font-bold">{PACKAGE_NAME}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Zero-dependency DNS lookup library with DoH, caching, and DNSSEC validation.
            </p>
          </div>

          {/* Documentation */}
          <div>
            <h4 className="font-semibold mb-4">Documentation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Introduction
                </Link>
              </li>
              <li>
                <Link to="/docs/installation" className="text-muted-foreground hover:text-foreground transition-colors">
                  Installation
                </Link>
              </li>
              <li>
                <Link to="/docs/quick-start" className="text-muted-foreground hover:text-foreground transition-colors">
                  Quick Start
                </Link>
              </li>
              <li>
                <Link to="/api" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                  Examples
                </Link>
              </li>
              <li>
                <Link to="/plugins" className="text-muted-foreground hover:text-foreground transition-colors">
                  Plugins
                </Link>
              </li>
              <li>
                <Link to="/playground" className="text-muted-foreground hover:text-foreground transition-colors">
                  Playground
                </Link>
              </li>
              <li>
                <a
                  href={`https://github.com/${GITHUB_REPO}/blob/main/CHANGELOG.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`https://github.com/${GITHUB_REPO}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={`https://www.npmjs.com/package/${NPM_PACKAGE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Package className="h-4 w-4" />
                  npm
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Made with love */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Made with{' '}
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />{' '}
            by{' '}
            <a
              href={AUTHOR_GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              {AUTHOR}
            </a>
          </div>

          {/* Version & License */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>v{VERSION}</span>
            <span>MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
