"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAdminSettings, useUpdateAdminSettings, useToggleMaintenance } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  AlertTriangle,
  Globe,
  Mail,
  Type,
  FileText,
  Save,
  Power,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_main/admin/settings/")({
  head: () => ({
    meta: [
      { title: "Settings | Admin Panel | Sigmagit" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const { data: settings, isLoading, error } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const toggleMaintenance = useToggleMaintenance();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpdateSetting = async (key: string, value: unknown) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast.success("Setting updated");
    } catch {
      toast.error("Failed to update setting");
    }
  };

  const handleToggleMaintenance = async () => {
    const newValue = !maintenanceEnabled;
    try {
      await toggleMaintenance.mutateAsync(newValue);
      toast.success(newValue ? "Maintenance mode enabled" : "Maintenance mode disabled");
    } catch {
      toast.error("Failed to toggle maintenance mode");
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="size-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="size-10 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">Error loading settings</h3>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  const maintenanceEnabled = (settings?.maintenance_mode as boolean) || false;
  const siteName = (settings?.site_name as string) || "";
  const siteDescription = (settings?.site_description as string) || "";
  const contactEmail = (settings?.contact_email as string) || "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Configure system settings and platform-wide options</p>
        </div>
        <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Settings className="size-6" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Maintenance Mode Card */}
        <Card className={cn(maintenanceEnabled && "border-orange-500/30")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center",
                  maintenanceEnabled ? "bg-orange-500/10" : "bg-green-500/10"
                )}>
                  <Power className={cn(
                    "size-5",
                    maintenanceEnabled ? "text-orange-600" : "text-green-600"
                  )} />
                </div>
                <div>
                  <CardTitle>Maintenance Mode</CardTitle>
                  <CardDescription>
                    Control site availability for all users
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    maintenanceEnabled
                      ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                      : "bg-green-500/10 text-green-600 border-green-500/20"
                  )}
                >
                  {maintenanceEnabled ? (
                    <>
                      <AlertTriangle className="size-3 mr-1" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3 mr-1" />
                      Operational
                    </>
                  )}
                </Badge>
                <Button
                  variant={maintenanceEnabled ? "destructive" : "default"}
                  size="sm"
                  onClick={handleToggleMaintenance}
                  disabled={toggleMaintenance.isPending}
                >
                  {maintenanceEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              When enabled, all users (except administrators) will see a maintenance page instead of accessing the site.
              Use this during deployments or when performing critical system maintenance.
            </p>
          </CardContent>
        </Card>

        {/* General Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Globe className="size-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name" className="flex items-center gap-2">
                  <Type className="size-4 text-muted-foreground" />
                  Site Name
                </Label>
                <Input
                  id="site-name"
                  value={siteName}
                  onChange={(e) => handleUpdateSetting("site_name", e.target.value)}
                  placeholder="My Git Platform"
                  className="h-11"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="site-description" className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  Site Description
                </Label>
                <Input
                  id="site-description"
                  value={siteDescription}
                  onChange={(e) => handleUpdateSetting("site_description", e.target.value)}
                  placeholder="A platform for hosting and collaborating on code"
                  className="h-11"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="contact-email" className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  Contact Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => handleUpdateSetting("contact_email", e.target.value)}
                  placeholder="admin@example.com"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  This email will be displayed on the contact page and used for system notifications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Info */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <Save className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Auto-save enabled</p>
              <p className="text-xs text-muted-foreground">
                Changes are saved automatically when you leave a field
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
