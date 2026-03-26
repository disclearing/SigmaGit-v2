import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_main/rate-limited")({
  component: RateLimitedPage,
});

function RateLimitedPage() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-destructive mb-4">Slow Down!</h1>
        <p className="text-xl text-muted-foreground mb-2">You&apos;ve been rate limited.</p>
        <p className="text-muted-foreground mb-8">
          Too many requests. Please wait a few minutes before trying again.
        </p>

        <div className="w-full max-w-md mx-auto rounded-lg overflow-hidden border border-border mb-8">
          <img
            src="https://pics.memoryleaked.dev/r/d4ujoO.gif"
            alt="Never Gonna Give You Up"
            className="w-full h-auto"
          />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          You&apos;ve been sitting here for {seconds} seconds.
        </p>
      </div>
    </div>
  );
}
