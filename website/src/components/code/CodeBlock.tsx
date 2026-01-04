import { useState } from 'react';
import { CodeBlock as CodeshinBlock } from '@oxog/codeshine/react';
import { Copy, Check } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  highlightLines?: (number | string)[];
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language,
  filename,
  highlightLines,
  showLineNumbers = true,
  showCopyButton = true,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  // Sync codeshine theme with app theme
  const codeTheme = resolvedTheme === 'dark' ? 'github-dark' : 'github-light';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'relative group rounded-xl overflow-hidden',
        'border border-border bg-card shadow-sm',
        'my-4',
        className
      )}
    >
      {/* IDE Header - macOS style */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
          </div>
          {/* Filename or language */}
          {filename && (
            <span className="text-sm text-muted-foreground font-mono">
              {filename}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {language}
          </span>
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent transition-colors'
              )}
              aria-label="Copy code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Code Block - @oxog/codeshine */}
      <div className="codeshine-block overflow-x-auto">
        <CodeshinBlock
          code={code.trim()}
          language={language}
          theme={codeTheme}
          lineNumbers={showLineNumbers}
          highlightLines={highlightLines}
        />
      </div>
    </div>
  );
}
