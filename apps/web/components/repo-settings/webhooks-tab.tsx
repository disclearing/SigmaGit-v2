"use client";

import { useState, type FormEvent } from "react";
import {
  useRepoWebhooks,
  useCreateRepoWebhook,
  useUpdateRepoWebhook,
  useDeleteRepoWebhook,
} from "@sigmagit/hooks";
import type { RepositoryWebhook, WebhookEvent } from "@sigmagit/hooks";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WEBHOOK_EVENTS: WebhookEvent[] = ["push", "pull_request", "issues", "tag", "branch"];
const EVENT_LABELS: Record<WebhookEvent, string> = {
  push: "Push",
  pull_request: "Pull request",
  issues: "Issues",
  tag: "Tag",
  branch: "Branch",
};

interface WebhooksTabProps {
  owner: string;
  repoName: string;
}

export function WebhooksTab({ owner, repoName }: WebhooksTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHook, setEditingHook] = useState<RepositoryWebhook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RepositoryWebhook | null>(null);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(["push"]);
  const [contentType, setContentType] = useState<"json" | "form">("json");
  const [active, setActive] = useState(true);

  const { data, isLoading } = useRepoWebhooks(owner, repoName);
  const { mutate: createWebhook, isPending: isCreating } = useCreateRepoWebhook(owner, repoName);
  const { mutate: updateWebhook, isPending: isUpdating } = useUpdateRepoWebhook(owner, repoName);
  const { mutate: deleteWebhook, isPending: isDeleting } = useDeleteRepoWebhook(owner, repoName);

  const webhooks = data?.webhooks ?? [];
  const isSaving = isCreating || isUpdating;

  function openCreate() {
    setEditingHook(null);
    setUrl("");
    setSecret("");
    setEvents(["push"]);
    setContentType("json");
    setActive(true);
    setDialogOpen(true);
  }

  function openEdit(hook: RepositoryWebhook) {
    setEditingHook(hook);
    setUrl(hook.url);
    setSecret("");
    setEvents(hook.events ?? ["push"]);
    setContentType(hook.contentType ?? "json");
    setActive(hook.active);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingHook(null);
  }

  function toggleEvent(ev: WebhookEvent) {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (events.length === 0) {
      toast.error("Select at least one event");
      return;
    }
    if (editingHook) {
      updateWebhook(
        {
          hookId: editingHook.id,
          data: {
            url,
            ...(secret ? { secret } : {}),
            events,
            contentType,
            active,
          },
        },
        {
          onSuccess: () => {
            toast.success("Webhook updated");
            closeDialog();
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
        }
      );
    } else {
      createWebhook(
        { url, secret: secret || undefined, events, contentType, active },
        {
          onSuccess: () => {
            toast.success("Webhook created");
            closeDialog();
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create"),
        }
      );
    }
  }

  function handleToggleActive(hook: RepositoryWebhook) {
    updateWebhook(
      { hookId: hook.id, data: { active: !hook.active } },
      {
        onSuccess: () => toast.success(hook.active ? "Webhook disabled" : "Webhook enabled"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
      }
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteWebhook(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Webhook deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete"),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader className="border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>Send HTTP POST requests to your URL when repository events occur.</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            Add webhook
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No webhooks. Add one to receive push, pull request, and other events.</p>
          ) : (
            <ul className="space-y-4">
              {webhooks.map((hook) => (
                <li
                  key={hook.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm truncate" title={hook.url}>
                      {hook.url}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(hook.events ?? []).map((ev) => (
                        <Badge key={ev} variant="secondary" className="text-xs">
                          {EVENT_LABELS[ev]}
                        </Badge>
                      ))}
                      <Badge variant={hook.active ? "default" : "outline"} className="text-xs">
                        {hook.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Checkbox
                      id={`active-${hook.id}`}
                      checked={hook.active}
                      onCheckedChange={() => handleToggleActive(hook)}
                      disabled={isUpdating}
                    />
                    <Label htmlFor={`active-${hook.id}`} className="text-xs cursor-pointer">Active</Label>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(hook)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(hook)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingHook ? "Edit webhook" : "Add webhook"}</DialogTitle>
            <DialogDescription>
              Configure the endpoint URL and events. We will send a POST request with a JSON or form body and optional signature header.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wh-url">Payload URL</Label>
              <Input
                id="wh-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-secret">Secret (optional)</Label>
              <Input
                id="wh-secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={editingHook?.secret ? "••••••••" : "Leave blank to skip signing"}
              />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="flex flex-wrap gap-3">
                {WEBHOOK_EVENTS.map((ev) => (
                  <div key={ev} className="flex items-center gap-2">
                    <Checkbox
                      id={`ev-${ev}`}
                      checked={events.includes(ev)}
                      onCheckedChange={() => toggleEvent(ev)}
                    />
                    <Label htmlFor={`ev-${ev}`} className="cursor-pointer text-sm">
                      {EVENT_LABELS[ev]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as "json" | "form")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">application/json</SelectItem>
                  <SelectItem value="form">application/x-www-form-urlencoded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="wh-active"
                checked={active}
                onCheckedChange={(c) => setActive(!!c)}
              />
              <Label htmlFor="wh-active" className="cursor-pointer">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !url.trim() || events.length === 0}>
                {isSaving && <Loader2 className="size-4 mr-2 animate-spin" />}
                {editingHook ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete webhook</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Remove the webhook for ${deleteTarget.url}? This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
