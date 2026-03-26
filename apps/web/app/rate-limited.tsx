import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/rate-limited" as any)({
  component: RateLimitedPage,
});

function RateLimitedPage() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-destructive mb-4">Slow Down!</h1>
        <p className="text-xl text-muted-foreground mb-2">You&apos;ve been rate limited.</p>
        <p className="text-muted-foreground mb-8">
          Too many requests. Please wait a few minutes before trying again.
        </p>

        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border mb-8">
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
            title="Never Gonna Give You Up"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          You&apos;ve been sitting here for {seconds} seconds.
        </p>

        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try going home
        </a>
      </div>
    </div>
  );
}
