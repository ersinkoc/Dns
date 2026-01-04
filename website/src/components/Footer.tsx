export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            </svg>
            <span className="font-medium">@oxog/dns</span>
          </div>
          <p className="text-sm text-muted-foreground">
            MIT License © 2025 Ersin Koç
          </p>
          <a
            href="https://github.com/ersinkoc/dns"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link text-sm"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
