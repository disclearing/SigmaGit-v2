"use client";

import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
      <div className="relative text-center">
        <Wrench className="size-16 mx-auto mb-6 text-orange-500" />
        <h1 className="text-3xl font-bold text-foreground mb-2">Under maintenance</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          We&apos;re performing scheduled maintenance. We&apos;ll be back shortly.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
