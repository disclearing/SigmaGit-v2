"use client";

import { useState } from "react";
import { useSubmitDmca } from "@sigmagit/hooks";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DmcaDialogProps {
  targetType: "repository" | "gist";
  targetId: string;
  targetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DmcaDialog({ targetType, targetId, targetName, open, onOpenChange }: DmcaDialogProps) {
  const [copyrightHolder, setCopyrightHolder] = useState("");
  const [copyrightHolderEmail, setCopyrightHolderEmail] = useState("");
  const [copyrightHolderAddress, setCopyrightHolderAddress] = useState("");
  const [copyrightHolderPhone, setCopyrightHolderPhone] = useState("");
  const [originalWorkDescription, setOriginalWorkDescription] = useState("");
  const [originalWorkUrl, setOriginalWorkUrl] = useState("");
  const [infringingUrls, setInfringingUrls] = useState("");
  const [description, setDescription] = useState("");
  const [swornStatement, setSwornStatement] = useState(false);
  const [perjuryStatement, setPerjuryStatement] = useState(false);
  const [signature, setSignature] = useState("");
  const submitDmca = useSubmitDmca();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!copyrightHolder.trim() || !copyrightHolderEmail.trim() || !copyrightHolderAddress.trim()) {
      toast.error("Please fill in all required copyright holder fields.");
      return;
    }
    if (!originalWorkDescription.trim()) {
      toast.error("Please describe the copyrighted work.");
      return;
    }
    if (!infringingUrls.trim()) {
      toast.error("Please provide the URL(s) of the infringing content.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe how the content infringes your copyright.");
      return;
    }
    if (!swornStatement || !perjuryStatement) {
      toast.error("You must accept both legal statements.");
      return;
    }
    if (!signature.trim()) {
      toast.error("Please provide your electronic signature.");
      return;
    }
    submitDmca.mutate(
      {
        targetType,
        targetId,
        copyrightHolder: copyrightHolder.trim(),
        copyrightHolderEmail: copyrightHolderEmail.trim(),
        copyrightHolderAddress: copyrightHolderAddress.trim(),
        copyrightHolderPhone: copyrightHolderPhone.trim() || null,
        originalWorkDescription: originalWorkDescription.trim(),
        originalWorkUrl: originalWorkUrl.trim() || null,
        infringingUrls: infringingUrls.trim(),
        description: description.trim(),
        swornStatement: true,
        perjuryStatement: true,
        signature: signature.trim(),
      },
      {
        onSuccess: () => {
          toast.success("DMCA takedown request submitted. We will review it shortly.");
          onOpenChange(false);
          setCopyrightHolder("");
          setCopyrightHolderEmail("");
          setCopyrightHolderAddress("");
          setCopyrightHolderPhone("");
          setOriginalWorkDescription("");
          setOriginalWorkUrl("");
          setInfringingUrls("");
          setDescription("");
          setSwornStatement(false);
          setPerjuryStatement(false);
          setSignature("");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to submit DMCA request");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DMCA Takedown Request</DialogTitle>
          <DialogDescription>
            File a copyright takedown request for {targetName}. All fields marked with * are required. By submitting,
            you certify the accuracy of your statements under penalty of perjury.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Copyright holder information</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="dmca-holder">Full legal name *</Label>
                <Input
                  id="dmca-holder"
                  value={copyrightHolder}
                  onChange={(e) => setCopyrightHolder(e.target.value)}
                  placeholder="Name of copyright owner"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dmca-email">Email *</Label>
                <Input
                  id="dmca-email"
                  type="email"
                  value={copyrightHolderEmail}
                  onChange={(e) => setCopyrightHolderEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dmca-phone">Phone (optional)</Label>
                <Input
                  id="dmca-phone"
                  type="tel"
                  value={copyrightHolderPhone}
                  onChange={(e) => setCopyrightHolderPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="dmca-address">Mailing address *</Label>
                <Textarea
                  id="dmca-address"
                  value={copyrightHolderAddress}
                  onChange={(e) => setCopyrightHolderAddress(e.target.value)}
                  placeholder="Full mailing address"
                  rows={2}
                  required
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Original copyrighted work</h4>
            <div className="space-y-2">
              <Label htmlFor="dmca-work-desc">Description of the copyrighted work *</Label>
              <Textarea
                id="dmca-work-desc"
                value={originalWorkDescription}
                onChange={(e) => setOriginalWorkDescription(e.target.value)}
                placeholder="Describe the work you own that has been infringed"
                rows={3}
                required
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dmca-work-url">URL to the original work (optional)</Label>
              <Input
                id="dmca-work-url"
                type="url"
                value={originalWorkUrl}
                onChange={(e) => setOriginalWorkUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Infringing content</h4>
            <div className="space-y-2">
              <Label htmlFor="dmca-infringing">URL(s) of infringing content on this platform *</Label>
              <Textarea
                id="dmca-infringing"
                value={infringingUrls}
                onChange={(e) => setInfringingUrls(e.target.value)}
                placeholder="One or more URLs where the infringing content appears"
                rows={2}
                required
                className="resize-none font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dmca-desc">How does the content infringe your copyright? *</Label>
              <Textarea
                id="dmca-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the infringement"
                rows={3}
                required
                className="resize-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Legal statements</h4>
            <div className="flex items-start gap-3">
              <Checkbox
                id="dmca-sworn"
                checked={swornStatement}
                onCheckedChange={(c) => setSwornStatement(c === true)}
              />
              <Label htmlFor="dmca-sworn" className="text-sm font-normal leading-relaxed cursor-pointer">
                I have a good faith belief that use of the copyrighted materials described above is not authorized by
                the copyright owner, its agent, or the law.
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="dmca-perjury"
                checked={perjuryStatement}
                onCheckedChange={(c) => setPerjuryStatement(c === true)}
              />
              <Label htmlFor="dmca-perjury" className="text-sm font-normal leading-relaxed cursor-pointer">
                I swear, under penalty of perjury, that the information in this notification is accurate and that I am
                the copyright owner or am authorized to act on behalf of the copyright owner.
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dmca-signature">Electronic signature *</Label>
            <Input
              id="dmca-signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Your full legal name"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitDmca.isPending ||
                !copyrightHolder.trim() ||
                !copyrightHolderEmail.trim() ||
                !copyrightHolderAddress.trim() ||
                !originalWorkDescription.trim() ||
                !infringingUrls.trim() ||
                !description.trim() ||
                !swornStatement ||
                !perjuryStatement ||
                !signature.trim()
              }
            >
              {submitDmca.isPending ? "Submitting..." : "Submit DMCA request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
