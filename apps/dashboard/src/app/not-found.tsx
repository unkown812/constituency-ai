import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="text-center max-w-sm px-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-muted">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-display-sm text-text mb-2">Page not found</h1>
        <p className="text-body text-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-brand text-white text-button font-medium hover:bg-brand-active transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
