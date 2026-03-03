"use client";

import { useState } from "react";
import { useSubmitReport } from "@sigmagit/hooks";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ReportReason, ReportTargetType } from "@sigmagit/hooks";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
];

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ targetType, targetId, targetName, open, onOpenChange }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const submitReport = useSubmitReport();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason || !description.trim()) {
      toast.error("Please select a reason and provide details.");
      return;
    }
    submitReport.mutate(
      { targetType, targetId, reason, description: description.trim() },
      {
        onSuccess: () => {
          toast.success("Report submitted. We will review it shortly.");
          onOpenChange(false);
          setReason("");
          setDescription("");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to submit report");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetName}</DialogTitle>
          <DialogDescription>
            Describe why you are reporting this {targetType}. Our team will review your report.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)} required>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-description">Details</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context..."
              rows={4}
              required
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitReport.isPending || !reason || !description.trim()}>
              {submitReport.isPending ? "Submitting..." : "Submit report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
