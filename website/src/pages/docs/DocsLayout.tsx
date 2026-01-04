import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DOCS_SIDEBAR, GITHUB_REPO } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface DocsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function DocsLayout({ children, title, description }: DocsLayoutProps) {
  const location = useLocation();

  // Find current page index for prev/next navigation
  const allPages = DOCS_SIDEBAR.flatMap((section) => section.items);
  const currentIndex = allPages.findIndex((item) => item.href === location.pathname);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  // Get GitHub edit URL
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const fileName = pathSegments.length > 1 ? pathSegments.slice(1).join('/') : 'index';
  const editUrl = `https://github.com/${GITHUB_REPO}/edit/main/website/src/pages/docs/${fileName}.tsx`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-12">
        <Sidebar />

        <article className="flex-1 min-w-0 max-w-3xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {children}
          </div>

          {/* Edit on GitHub */}
          <div className="mt-12 pt-8 border-t border-border">
            <a
              href={editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Edit this page on GitHub
            </a>
          </div>

          {/* Prev/Next Navigation */}
          <nav className="mt-8 flex justify-between gap-4">
            {prevPage ? (
              <Link
                to={prevPage.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-lg',
                  'border border-border bg-card',
                  'hover:border-primary/50 transition-colors',
                  'flex-1'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Previous</div>
                  <div className="font-medium">{prevPage.label}</div>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextPage ? (
              <Link
                to={nextPage.href}
                className={cn(
                  'flex items-center justify-end gap-2 px-4 py-3 rounded-lg',
                  'border border-border bg-card',
                  'hover:border-primary/50 transition-colors',
                  'flex-1 text-right'
                )}
              >
                <div>
                  <div className="text-xs text-muted-foreground">Next</div>
                  <div className="font-medium">{nextPage.label}</div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
