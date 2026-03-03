"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateOrganization } from "@sigmagit/hooks";
import { Building2, Loader2 } from "lucide-react";
import { createMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_main/organizations/new")({
  head: () => ({ meta: createMeta({ title: "New Organization", description: "Create a new organization on Sigmagit.", noIndex: true }) }),
  component: NewOrganizationPage,
});

function NewOrganizationPage() {
  const navigate = useNavigate();
  const createOrg = useCreateOrganization();
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    email: "",
    website: "",
    location: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    createOrg.mutate(
      {
        name: formData.name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        displayName: formData.displayName || formData.name,
        description: formData.description || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        location: formData.location || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success("Organization created!");
          navigate({
            to: "/$username",
            params: { username: data?.name || formData.name.toLowerCase() },
          });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create organization");
        },
      }
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-border bg-muted/30">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground mb-6 shadow-lg shadow-primary/20">
            <Building2 className="size-7" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Create a new organization</h1>
          <p className="text-muted-foreground text-center max-w-md mx-auto">
            Organizations are shared accounts where teams can collaborate across many repositories.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Organization name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="my-organization"
                required
                pattern="^[a-zA-Z0-9-]+$"
                className="h-12 text-lg"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This will be used in your organization's URL. Only lowercase letters, numbers, and hyphens are allowed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-semibold">
                Display name
              </Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="My Organization"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                This is the name that will be displayed on your organization's profile.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description of your organization"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Public email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-semibold">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate({ to: "/" })}
              disabled={createOrg.isPending}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createOrg.isPending || !formData.name} 
              className="h-11 px-8 shadow-lg shadow-primary/20"
            >
              {createOrg.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="size-4 mr-2" />
                  Create organization
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
