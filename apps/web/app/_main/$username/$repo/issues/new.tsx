import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCreateIssue } from "@sigmagit/hooks";
import { IssueForm } from "@/components/issues";
import { authClient } from "@/lib/auth-client";
import { createMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_main/$username/$repo/issues/new")({
  head: () => ({ meta: createMeta({ title: "New Issue", description: "Create a new issue.", noIndex: true }) }),
  component: NewIssuePage,
});

function NewIssuePage() {
  const { username, repo } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const createIssue = useCreateIssue(username, repo);

  const handleSubmit = async (data: { title: string; body: string }) => {
    const issue = await createIssue.mutateAsync({
      title: data.title,
      body: data.body || undefined,
    });
    navigate({
      to: "/$username/$repo/issues/$number",
      params: { username, repo, number: String(issue.number) },
    });
  };

  if (!session?.user) {
    return (
      <div className="container max-w-[1280px] mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/30">
            <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
            <p className="text-muted-foreground mb-6">You need to be signed in to create an issue.</p>
            <Button asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-[1280px] mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold mb-2">New issue</h1>
        <p className="text-muted-foreground mb-8">Report a bug, request a feature, or ask a question</p>

        <div className="border border-border rounded-lg bg-card p-6">
        <IssueForm
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: "/$username/$repo/issues", params: { username, repo } })}
          submitLabel="Submit new issue"
          isSubmitting={createIssue.isPending}
        />
        </div>
      </div>
    </div>
  );
}
