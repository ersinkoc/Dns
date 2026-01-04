import { Heart, Github, Package, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PACKAGE_NAME, GITHUB_REPO, NPM_PACKAGE, VERSION, AUTHOR, AUTHOR_GITHUB } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Globe className="h-6 w-6 text-indigo-400" />
              <span className="font-bold text-zinc-100">{PACKAGE_NAME}</span>
            </Link>
            <p className="text-sm text-zinc-500">
              Zero-dependency DNS lookup library with DoH, caching, and DNSSEC validation.
            </p>
          </div>

          {/* Documentation */}
          <div>
            <h4 className="font-semibold mb-4 text-zinc-100">Documentation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/docs" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Introduction
                </Link>
              </li>
              <li>
                <Link to="/docs/installation" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Installation
                </Link>
              </li>
              <li>
                <Link to="/docs/quick-start" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Quick Start
                </Link>
              </li>
              <li>
                <Link to="/api" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-zinc-100">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/examples" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Examples
                </Link>
              </li>
              <li>
                <Link to="/plugins" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Plugins
                </Link>
              </li>
              <li>
                <Link to="/playground" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Playground
                </Link>
              </li>
              <li>
                <a
                  href={`https://github.com/${GITHUB_REPO}/blob/main/CHANGELOG.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-zinc-100">Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`https://github.com/${GITHUB_REPO}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
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
                  className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  npm
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-zinc-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Made with love */}
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            Made with{' '}
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />{' '}
            by{' '}
            <a
              href={AUTHOR_GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-300 hover:text-indigo-400 transition-colors"
            >
              {AUTHOR}
            </a>
          </div>

          {/* Version & License */}
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>v{VERSION}</span>
            <span>MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
