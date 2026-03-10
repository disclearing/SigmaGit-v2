"use client";

import { useState, type FormEvent } from "react";
import {
  useCollaborators,
  useAddCollaborator,
  useUpdateCollaborator,
  useRemoveCollaborator,
} from "@sigmagit/hooks";
import type { Collaborator, CollaboratorPermission } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const PERMISSIONS: { value: CollaboratorPermission; label: string }[] = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "admin", label: "Admin" },
];

interface CollaboratorsTabProps {
  owner: string;
  repoName: string;
}

export function CollaboratorsTab({ owner, repoName }: CollaboratorsTabProps) {
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState<CollaboratorPermission>("read");
  const [removeTarget, setRemoveTarget] = useState<Collaborator | null>(null);

  const { data, isLoading } = useCollaborators(owner, repoName);
  const { mutate: addCollaborator, isPending: isAdding } = useAddCollaborator(owner, repoName);
  const { mutate: updateCollaborator, isPending: isUpdating } = useUpdateCollaborator(owner, repoName);
  const { mutate: removeCollaborator, isPending: isRemoving } = useRemoveCollaborator(owner, repoName);

  const collaborators = data?.collaborators ?? [];

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    addCollaborator(
      { username: trimmed, permission },
      {
        onSuccess: () => {
          toast.success("Collaborator added");
          setUsername("");
          setPermission("read");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to add collaborator");
        },
      }
    );
  }

  function handleUpdatePermission(c: Collaborator, newPermission: CollaboratorPermission) {
    if (newPermission === c.permission) return;
    updateCollaborator(
      { userId: c.user.id, permission: newPermission },
      {
        onSuccess: () => toast.success("Permission updated"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
      }
    );
  }

  function handleRemove() {
    if (!removeTarget) return;
    removeCollaborator(removeTarget.user.id, {
      onSuccess: () => {
        toast.success("Collaborator removed");
        setRemoveTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to remove");
      },
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
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle>Add collaborator</CardTitle>
          <CardDescription>Grant access by username. They will be able to access the repository according to the selected permission.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px] space-y-2">
              <Label htmlFor="collab-username">Username</Label>
              <Input
                id="collab-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="font-mono"
              />
            </div>
            <div className="w-[140px] space-y-2">
              <Label>Permission</Label>
              <Select
                value={permission}
                onValueChange={(v) => setPermission(v as CollaboratorPermission)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isAdding || !username.trim()}>
              {isAdding && <Loader2 className="size-4 mr-2 animate-spin" />}
              <Plus className="size-4 mr-2" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle>Collaborators</CardTitle>
          <CardDescription>People with access to this repository.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No collaborators yet. Add one above.</p>
          ) : (
            <ul className="divide-y divide-border">
              {collaborators.map((c) => (
                <li key={c.user.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar size="sm">
                      <AvatarImage src={c.user.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">{c.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link
                        to="/$username"
                        params={{ username: c.user.username }}
                        className="font-medium hover:underline truncate block"
                      >
                        {c.user.username}
                      </Link>
                      <p className="text-xs text-muted-foreground">{timeAgo(c.addedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={c.permission}
                      onValueChange={(v) => handleUpdatePermission(c, v as CollaboratorPermission)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-[110px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setRemoveTarget(c)}
                      disabled={isRemoving}
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

      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove collaborator</DialogTitle>
            <DialogDescription>
              {removeTarget
                ? `${removeTarget.user.username} will lose access to this repository. They can be re-added later.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isRemoving}>
              {isRemoving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
