import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { cn } from '@/lib/utils';
import { NPM_PACKAGE } from '@/lib/constants';

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

const COMMANDS: Record<PackageManager, string> = {
  npm: `npm install ${NPM_PACKAGE}`,
  yarn: `yarn add ${NPM_PACKAGE}`,
  pnpm: `pnpm add ${NPM_PACKAGE}`,
  bun: `bun add ${NPM_PACKAGE}`,
};

const TABS: { id: PackageManager; label: string }[] = [
  { id: 'npm', label: 'npm' },
  { id: 'yarn', label: 'yarn' },
  { id: 'pnpm', label: 'pnpm' },
  { id: 'bun', label: 'bun' },
];

interface InstallTabsProps {
  className?: string;
}

export function InstallTabs({ className }: InstallTabsProps) {
  const [activeTab, setActiveTab] = useState<PackageManager>('npm');
  const { copied, copy } = useClipboard();

  const command = COMMANDS[activeTab];

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border border-border bg-card',
        className
      )}
    >
      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-foreground bg-background border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Command */}
      <div className="flex items-center justify-between p-4">
        <code className="text-sm font-mono text-foreground">{command}</code>
        <button
          onClick={() => copy(command)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-accent transition-colors'
          )}
          aria-label="Copy command"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
