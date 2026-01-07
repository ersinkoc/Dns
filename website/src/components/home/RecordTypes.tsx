import { RECORD_TYPES } from '@/lib/constants';

export function RecordTypes() {
  return (
    <section className="py-16 section-alt">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
            Supported Record Types
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Full support for all major DNS record types with type-safe responses.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-5xl mx-auto">
          {RECORD_TYPES.map((record) => (
            <div
              key={record.type}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary transition-colors"
            >
              <code className="text-sm font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
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
