import { createFileRoute } from "@tanstack/react-router";
import { useAdminSettings, useUpdateAdminSettings, useToggleMaintenance } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_main/admin/settings/")({
  head: () => ({
    meta: [
      { title: "Settings | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "Configure system settings, maintenance mode, and platform-wide configuration.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Settings | Admin Panel | Sigmagit" },
      {
        property: "og:description",
        content: "Configure system settings, maintenance mode, and platform-wide configuration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Settings | Admin Panel | Sigmagit" },
      {
        name: "twitter:description",
        content: "Configure system settings, maintenance mode, and platform-wide configuration.",
      },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const toggleMaintenance = useToggleMaintenance();

  const handleUpdateSetting = async (key: string, value: unknown) => {
    await updateSettings.mutateAsync({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  const maintenanceEnabled = (settings?.maintenance_mode as boolean) || false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">System configuration</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Maintenance Mode</h2>
          <div className="flex items-center justify-between">
            <div>
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, users will see a maintenance page instead of accessing the site
              </p>
            </div>
            <Button
              variant={maintenanceEnabled ? "destructive" : "default"}
              onClick={() => toggleMaintenance.mutate(!maintenanceEnabled)}
            >
              {maintenanceEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">General Settings</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                defaultValue={(settings?.site_name as string) || ""}
                onBlur={(e) => handleUpdateSetting("site_name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-description">Site Description</Label>
              <Input
                id="site-description"
                defaultValue={(settings?.site_description as string) || ""}
                onBlur={(e) => handleUpdateSetting("site_description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                defaultValue={(settings?.contact_email as string) || ""}
                onBlur={(e) => handleUpdateSetting("contact_email", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
