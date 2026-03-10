"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  useCollaborators,
  useAddCollaborator,
  useUpdateCollaborator,
  useRemoveCollaborator,
  useSearch,
} from "@sigmagit/hooks";
import type { Collaborator, CollaboratorPermission } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2, User } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useCollaborators(owner, repoName);
  const { data: searchData, isLoading: isSearching } = useSearch(username.trim(), {
    type: "users",
    limit: 10,
    enabled: searchOpen && username.trim().length >= 2,
  });
  const { mutate: addCollaborator, isPending: isAdding } = useAddCollaborator(owner, repoName);
  const { mutate: updateCollaborator, isPending: isUpdating } = useUpdateCollaborator(owner, repoName);
  const { mutate: removeCollaborator, isPending: isRemoving } = useRemoveCollaborator(owner, repoName);

  const collaborators = data?.collaborators ?? [];
  const collaboratorUsernames = new Set(collaborators.map((c) => c.user.username.toLowerCase()));
  const userResults = (searchData?.results ?? []).filter(
    (r) =>
      r.type === "user" &&
      !collaboratorUsernames.has((r.title ?? "").toLowerCase()) &&
      (r.title ?? "").toLowerCase() !== owner.toLowerCase()
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
            <div ref={searchContainerRef} className="flex-1 min-w-[240px] space-y-2 relative">
              <Label htmlFor="collab-username">Username</Label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  ref={inputRef}
                  id="collab-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search users..."
                  className={cn(
                    "pl-10 font-mono h-11 bg-muted/50 border-transparent",
                    "focus-visible:bg-background focus-visible:border-primary/30 transition-all duration-200"
                  )}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="size-4 text-muted-foreground animate-spin" />
                  </div>
                )}
              </div>

              {searchOpen && username.trim().length >= 2 && (
                <>
                  {userResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl max-h-[320px] overflow-y-auto z-[60] p-2">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Users
                      </div>
                      {userResults.map((result) => (
                        <button
                          key={`user-${result.id}`}
                          type="button"
                          onClick={() => {
                            setUsername(result.title);
                            setSearchOpen(false);
                            inputRef.current?.focus();
                          }}
                          className={cn(
                            "w-full p-3 text-left rounded-lg transition-all duration-150 flex items-center gap-3",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus:bg-accent focus:text-accent-foreground focus:outline-none"
                          )}
                        >
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                            {result.owner ? (
                              <Avatar size="sm">
                                <AvatarImage src={result.owner.avatarUrl ?? undefined} />
                                <AvatarFallback className="text-xs font-medium">
                                  {result.title.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <User className="size-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-muted-foreground truncate mt-0.5">
                                {result.description}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {userResults.length === 0 && !isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl z-[60] p-6 text-center">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Search className="size-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try a different search or type a username to add
                      </p>
                    </div>
                  )}
                </>
              )}
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
