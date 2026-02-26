"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateSocialLinks } from "@sigmagit/hooks";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { GithubIcon, LinkedInIcon, XIcon } from "../icons";

interface SocialLinksFormProps {
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    custom?: string[];
  } | null;
}

export function SocialLinksForm({ socialLinks }: SocialLinksFormProps) {
  const { mutate, isPending } = useUpdateSocialLinks();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customLinks, setCustomLinks] = useState<string[]>([socialLinks?.custom?.[0] || "", socialLinks?.custom?.[1] || "", socialLinks?.custom?.[2] || ""]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      github: formData.get("github") as string,
      twitter: formData.get("twitter") as string,
      linkedin: formData.get("linkedin") as string,
      custom: customLinks.filter(link => link.trim() !== ""),
    };

    mutate(data, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Failed to update social links");
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 text-green-600 text-sm rounded-md">
          Social links updated successfully!
        </div>
      )}

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <GithubIcon className="size-4" />
          GitHub
        </Label>
        <Input id="github" name="github" defaultValue={socialLinks?.github || ""} placeholder="https://github.com/username" type="url" />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <XIcon className="size-4" />
          Twitter / X
        </Label>
        <Input id="twitter" name="twitter" defaultValue={socialLinks?.twitter || ""} placeholder="https://twitter.com/username" type="url" />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <LinkedInIcon className="size-4" />
          LinkedIn
        </Label>
        <Input id="linkedin" name="linkedin" defaultValue={socialLinks?.linkedin || ""} placeholder="https://linkedin.com/in/username" type="url" />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <LinkIcon className="size-4" />
          Custom Links
        </Label>
        {[0, 1, 2].map((i) => (
          <Input
            key={i}
            value={customLinks[i]}
            onChange={(e) => {
              const newLinks = [...customLinks];
              newLinks[i] = e.target.value;
              setCustomLinks(newLinks);
            }}
            placeholder={`Custom URL ${i + 1}`}
            type="url"
          />
        ))}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Social Links"
        )}
      </Button>
    </form>
  );
}
