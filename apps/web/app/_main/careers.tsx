"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createMeta } from "@/lib/seo";
import { Briefcase, Heart, Loader2, Users, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { getApiUrl } from "@/lib/utils";

export const Route = createFileRoute("/_main/careers")({
  head: () => ({ meta: createMeta({ title: "Careers", description: "Join Sigmagit. Open positions in engineering and beyond." }) }),
  component: CareersPage,
});

type JobListing = {
  id: string;
  slug: string;
  title: string;
  description: string;
  department: string | null;
  location: string | null;
  employmentType: string;
  open: boolean;
  createdAt: string;
};

async function fetchJobs(): Promise<JobListing[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new Error("API URL not configured");
  const res = await fetch(`${apiUrl}/api/careers/jobs`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load jobs");
  const data = await res.json();
  return data.jobs ?? [];
}

async function submitApplication(
  jobId: string,
  payload: { name: string; email: string; phone?: string; coverLetter?: string; resumeUrl?: string; linkedInUrl?: string }
): Promise<void> {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new Error("API URL not configured");
  const res = await fetch(`${apiUrl}/api/careers/jobs/${jobId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to submit application");
}

function CareersPage() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ["careers", "jobs"],
    queryFn: fetchJobs,
  });
  const [applyJob, setApplyJob] = useState<JobListing | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    coverLetter: "",
    resumeUrl: "",
    linkedInUrl: "",
  });

  const handleOpenApply = (job: JobListing) => {
    setApplyJob(job);
    setSubmitError(null);
    setSubmitSuccess(false);
    setForm({ name: "", email: "", phone: "", coverLetter: "", resumeUrl: "", linkedInUrl: "" });
  };

  const handleCloseApply = () => {
    setApplyJob(null);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyJob) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await submitApplication(applyJob.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        coverLetter: form.coverLetter.trim() || undefined,
        resumeUrl: form.resumeUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      });
      setSubmitSuccess(true);
      setTimeout(() => handleCloseApply(), 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Help us build the future of Git hosting and developer collaboration.
        </p>
      </div>

      <div className="space-y-16">
        <section>
          <h2 className="text-3xl font-semibold mb-6">Why Work at sigmagit?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <Zap className="size-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Fast-Paced Innovation</h3>
                <p className="text-muted-foreground">
                  Work on cutting-edge technology and help shape the future of developer tools.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Users className="size-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Great Team</h3>
                <p className="text-muted-foreground">
                  Collaborate with talented developers who are passionate about what they build.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Heart className="size-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Work-Life Balance</h3>
                <p className="text-muted-foreground">
                  We believe in sustainable work practices and supporting our team's well-being.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Briefcase className="size-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Remote First</h3>
                <p className="text-muted-foreground">
                  Work from anywhere. We're a distributed team that values flexibility and autonomy.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mb-6">Open Positions</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>Loading positions...</span>
            </div>
          ) : error ? (
            <Card className="border-destructive/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                Failed to load job listings. Please try again later.
              </CardContent>
            </Card>
          ) : !jobs?.length ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                No open positions at the moment. Check back soon or get in touch.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                        {(job.department || job.location) && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {[job.department, job.location].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p className="text-muted-foreground">{job.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="shrink-0"
                        onClick={() => handleOpenApply(job)}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="text-center p-8 rounded-lg border border-border bg-card">
          <h2 className="text-2xl font-semibold mb-4">Don't see a role that fits?</h2>
          <p className="text-muted-foreground mb-6">
            We're always looking for talented people. Send us your resume and let's talk!
          </p>
          <Button asChild>
            <a href="mailto:careers@sigmagit.com?subject=General Application">Get in Touch</a>
          </Button>
        </section>
      </div>

      <Dialog open={!!applyJob} onOpenChange={(open) => !open && handleCloseApply()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for {applyJob?.title}</DialogTitle>
            <DialogDescription>
              Submit your application below. We'll get back to you soon.
            </DialogDescription>
          </DialogHeader>
          {submitSuccess ? (
            <p className="text-center py-6 text-primary font-medium">
              Application submitted successfully. Thank you!
            </p>
          ) : (
            <form onSubmit={handleSubmitApply} className="space-y-4">
              {submitError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="apply-name">Name *</Label>
                <Input
                  id="apply-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-email">Email *</Label>
                <Input
                  id="apply-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-phone">Phone</Label>
                <Input
                  id="apply-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-cover">Cover letter</Label>
                <textarea
                  id="apply-cover"
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.coverLetter}
                  onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))}
                  placeholder="Tell us why you're interested and what you'd bring to the role..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-resume">Resume or portfolio URL</Label>
                <Input
                  id="apply-resume"
                  type="url"
                  value={form.resumeUrl}
                  onChange={(e) => setForm((f) => ({ ...f, resumeUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-linkedin">LinkedIn profile</Label>
                <Input
                  id="apply-linkedin"
                  type="url"
                  value={form.linkedInUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkedInUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={handleCloseApply}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit application"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
