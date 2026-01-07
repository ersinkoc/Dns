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
    <div className={cn('install-tabs', className)}>
      {/* Tabs */}
      <div className="install-tabs-header">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn('install-tab', activeTab === tab.id && 'active')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Command */}
      <div className="install-command">
        <code>
          {command}
        </code>
        <button
          onClick={() => copy(command)}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
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
