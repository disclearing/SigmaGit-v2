"use client";

import {  useState } from "react";
import {
  useBranchProtectionRules,
  useCreateBranchProtectionRule,
  useDeleteBranchProtectionRule,
  useUpdateBranchProtectionRule,
} from "@sigmagit/hooks";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type {FormEvent} from "react";
import type { BranchProtectionRule } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RuleFormState = {
  pattern: string;
  requirePullRequest: boolean;
  requireApprovals: number;
  dismissStaleReviews: boolean;
  requireStatusChecks: boolean;
  requiredStatusChecks: string;
  allowForcePush: boolean;
  allowDeletion: boolean;
};

const defaultForm: RuleFormState = {
  pattern: "",
  requirePullRequest: false,
  requireApprovals: 0,
  dismissStaleReviews: false,
  requireStatusChecks: false,
  requiredStatusChecks: "",
  allowForcePush: false,
  allowDeletion: false,
};

function ruleToForm(rule: BranchProtectionRule | null): RuleFormState {
  if (!rule) return defaultForm;
  return {
    pattern: rule.pattern,
    requirePullRequest: rule.requirePullRequest,
    requireApprovals: rule.requireApprovals,
    dismissStaleReviews: rule.dismissStaleReviews,
    requireStatusChecks: rule.requireStatusChecks,
    requiredStatusChecks: rule.requiredStatusChecks.join(", "),
    allowForcePush: rule.allowForcePush,
    allowDeletion: rule.allowDeletion,
  };
}

interface BranchProtectionTabProps {
  owner: string;
  repoName: string;
}

export function BranchProtectionTab({ owner, repoName }: BranchProtectionTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BranchProtectionRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BranchProtectionRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(defaultForm);

  const { data, isLoading } = useBranchProtectionRules(owner, repoName);
  const { mutate: createRule, isPending: isCreating } = useCreateBranchProtectionRule(owner, repoName);
  const { mutate: updateRule, isPending: isUpdating } = useUpdateBranchProtectionRule(owner, repoName);
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteBranchProtectionRule(owner, repoName);

  const rules = data?.rules ?? [];
  const isSaving = isCreating || isUpdating;

  function openCreate() {
    setEditingRule(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(rule: BranchProtectionRule) {
    setEditingRule(rule);
    setForm(ruleToForm(rule));
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingRule(null);
    setForm(defaultForm);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const requiredStatusChecks = form.requiredStatusChecks
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (editingRule) {
      updateRule(
        {
          ruleId: editingRule.id,
          data: {
            pattern: form.pattern,
            requirePullRequest: form.requirePullRequest,
            requireApprovals: form.requireApprovals,
            dismissStaleReviews: form.dismissStaleReviews,
            requireStatusChecks: form.requireStatusChecks,
            requiredStatusChecks,
            allowForcePush: form.allowForcePush,
            allowDeletion: form.allowDeletion,
          },
        },
        {
          onSuccess: () => {
            toast.success("Rule updated");
            closeDialog();
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
        }
      );
    } else {
      createRule(
        {
          pattern: form.pattern,
          requirePullRequest: form.requirePullRequest,
          requireApprovals: form.requireApprovals,
          dismissStaleReviews: form.dismissStaleReviews,
          requireStatusChecks: form.requireStatusChecks,
          requiredStatusChecks,
          allowForcePush: form.allowForcePush,
          allowDeletion: form.allowDeletion,
        },
        {
          onSuccess: () => {
            toast.success("Rule created");
            closeDialog();
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create"),
        }
      );
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteRule(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Rule deleted");
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
            <CardTitle>Branch protection rules</CardTitle>
            <CardDescription>Require status checks, pull request reviews, or restrict force push and deletion for matching branches.</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            Add rule
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No branch protection rules. Add one to protect branches like main.</p>
          ) : (
            <ul className="space-y-4">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-mono font-medium">{rule.pattern}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rule.requirePullRequest && `PR required (${rule.requireApprovals} approval(s)) · `}
                      {rule.dismissStaleReviews && "Dismiss stale reviews · "}
                      {rule.requireStatusChecks && `Status checks: ${rule.requiredStatusChecks.join(", ") || "—"} · `}
                      {rule.allowForcePush && "Force push allowed · "}
                      {rule.allowDeletion && "Deletion allowed"}
                      {!rule.requirePullRequest && !rule.dismissStaleReviews && !rule.requireStatusChecks && !rule.allowForcePush && !rule.allowDeletion && "No extra restrictions"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(rule)}
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
            <DialogTitle>{editingRule ? "Edit rule" : "Add branch protection rule"}</DialogTitle>
            <DialogDescription>
              Branch name or pattern (e.g. main or release/*). Matching branches will be protected.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bp-pattern">Branch name pattern</Label>
              <Input
                id="bp-pattern"
                value={form.pattern}
                onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
                placeholder="main"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="bp-pr"
                checked={form.requirePullRequest}
                onCheckedChange={(c) => setForm((f) => ({ ...f, requirePullRequest: !!c }))}
              />
              <Label htmlFor="bp-pr" className="cursor-pointer">Require pull request before merging</Label>
            </div>
            {form.requirePullRequest && (
              <div className="pl-6 space-y-2">
                <Label htmlFor="bp-approvals">Required approvals</Label>
                <Input
                  id="bp-approvals"
                  type="number"
                  min={0}
                  value={form.requireApprovals}
                  onChange={(e) => setForm((f) => ({ ...f, requireApprovals: parseInt(e.target.value, 10) || 0 }))}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bp-dismiss"
                    checked={form.dismissStaleReviews}
                    onCheckedChange={(c) => setForm((f) => ({ ...f, dismissStaleReviews: !!c }))}
                  />
                  <Label htmlFor="bp-dismiss" className="cursor-pointer">Dismiss stale reviews when new commits are pushed</Label>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="bp-status"
                checked={form.requireStatusChecks}
                onCheckedChange={(c) => setForm((f) => ({ ...f, requireStatusChecks: !!c }))}
              />
              <Label htmlFor="bp-status" className="cursor-pointer">Require status checks to pass</Label>
            </div>
            {form.requireStatusChecks && (
              <div className="pl-6 space-y-2">
                <Label htmlFor="bp-checks">Status check names (comma-separated)</Label>
                <Input
                  id="bp-checks"
                  value={form.requiredStatusChecks}
                  onChange={(e) => setForm((f) => ({ ...f, requiredStatusChecks: e.target.value }))}
                  placeholder="build, test"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="bp-force"
                checked={form.allowForcePush}
                onCheckedChange={(c) => setForm((f) => ({ ...f, allowForcePush: !!c }))}
              />
              <Label htmlFor="bp-force" className="cursor-pointer">Allow force push</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="bp-delete"
                checked={form.allowDeletion}
                onCheckedChange={(c) => setForm((f) => ({ ...f, allowDeletion: !!c }))}
              />
              <Label htmlFor="bp-delete" className="cursor-pointer">Allow branch deletion</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !form.pattern.trim()}>
                {isSaving && <Loader2 className="size-4 mr-2 animate-spin" />}
                {editingRule ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete branch protection rule</DialogTitle>
            <DialogDescription>
              {deleteTarget ? `The rule for pattern "${deleteTarget.pattern}" will be removed. This cannot be undone.` : ""}
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
