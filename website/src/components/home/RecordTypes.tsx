import { RECORD_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function RecordTypes() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Supported Record Types</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Full support for all major DNS record types with type-safe responses.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-6xl mx-auto">
          {RECORD_TYPES.map((record) => (
            <div
              key={record.type}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl',
                'border border-border bg-card',
                'hover:border-primary/50 transition-colors'
              )}
            >
              <code className="text-sm font-bold text-primary px-2 py-1 rounded bg-primary/10">
                {record.type}
              </code>
              <span className="text-sm text-muted-foreground">
                {record.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
