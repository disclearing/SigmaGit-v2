"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, User } from "lucide-react";
import { useUpdateProfile } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  user: {
    name: string;
    username: string;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    pronouns?: string | null;
    company?: string | null;
    gitEmail?: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { mutate, isPending } = useUpdateProfile();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    mutate(
      {
        name: formData.get("name") as string,
        username: formData.get("username") as string,
        bio: formData.get("bio") as string,
        location: formData.get("location") as string,
        website: formData.get("website") as string,
        pronouns: formData.get("pronouns") as string,
        company: formData.get("company") as string,
        gitEmail: formData.get("gitEmail") as string,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to update profile");
        },
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your public profile information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
    <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                placeholder="Your display name"
                required
                className="h-11"
              />
        <p className="text-xs text-muted-foreground">Your name as it appears on your profile</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                defaultValue={user.username}
                placeholder="username"
                required
                pattern="[a-zA-Z0-9_-]+"
                minLength={3}
                className="h-11"
              />
        <p className="text-xs text-muted-foreground">Your unique handle. Letters, numbers, underscores, and hyphens only.</p>
            </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={user.bio || ""}
              placeholder="Tell us about yourself"
              maxLength={160}
              rows={3}
            />
        <p className="text-xs text-muted-foreground">Brief description for your profile. Max 160 characters.</p>
      </div>

          <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="pronouns">Pronouns</Label>
              <Input
                id="pronouns"
                name="pronouns"
                defaultValue={user.pronouns || ""}
                placeholder="e.g., they/them, she/her, he/him"
                className="h-11"
              />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={user.location || ""}
                placeholder="City, Country"
                className="h-11"
              />
            </div>
      </div>

          <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={user.website || ""}
                placeholder="https://yourwebsite.com"
                className="h-11"
              />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                defaultValue={user.company || ""}
                placeholder="Your company or organization"
                className="h-11"
              />
            </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gitEmail">Git Email</Label>
            <Input
              id="gitEmail"
              name="gitEmail"
              type="email"
              defaultValue={user.gitEmail || ""}
              placeholder="Email for git commits"
              className="h-11"
            />
        <p className="text-xs text-muted-foreground">Email address used for git commits. Defaults to your account email if not set.</p>
      </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
              <CheckCircle2 className="size-4 shrink-0" />
              Profile updated successfully!
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" disabled={isPending} className="h-11 px-6">
        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Save Changes
      </Button>
            {success && (
              <span className="text-sm text-green-600 font-medium animate-in fade-in slide-in-from-left-2">
                Saved!
              </span>
            )}
          </div>
    </form>
      </CardContent>
    </Card>
  );
}
