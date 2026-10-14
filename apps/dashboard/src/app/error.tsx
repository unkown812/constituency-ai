"use client";

import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-error-subtle flex items-center justify-center mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-error">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="text-display-sm text-text mb-2">Something went wrong</h1>
      <p className="text-body text-secondary max-w-sm mb-6">
        An unexpected error occurred. Please try again.
      </p>
      {error.digest && (
        <p className="text-caption text-muted mb-6 font-mono">Error ref: {error.digest}</p>
      )}
      <Button variant="primary" size="lg" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
