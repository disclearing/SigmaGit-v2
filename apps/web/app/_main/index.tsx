import { useState } from "react";
import { GitBranch, Loader2, Plus, BookOpen, User, Settings, Github } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useCurrentUserSummary, useUserRepositories } from "@sigmagit/hooks";
import RepositoryCard from "@/components/repository-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { NewRepositoryModal } from "@/components/new-repository-modal";

export const Route = createFileRoute("/_main/")({
  component: HomePage,
});

function HomePage() {
  const { data: session, isPending: sessionLoading } = useSession();

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return <LandingPage />;
  }

  return <LoggedInHomePage session={session} />;
}

function LoggedInHomePage({ session }: { session: { user: { username?: string;[key: string]: any };[key: string]: any } }) {
  const username = session.user.username || "";
  const { data: user, isLoading: userLoading } = useCurrentUserSummary(!!session.user);
  const { data, isLoading: reposLoading } = useUserRepositories(username);
  const [newRepoModalOpen, setNewRepoModalOpen] = useState(false);

  const repos = data?.repos || [];

  return (
    <div className="container max-w-[1280px] mx-auto py-6 px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          {userLoading ? (
            <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg animate-pulse">
              <div className="h-12 w-12 bg-secondary/50 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-24 bg-secondary/50 mb-1.5" />
                <div className="h-3 w-20 bg-secondary/50" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
              <Avatar className="size-12 rounded-full border border-border">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {user?.name.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">@{username}</p>
              </div>
            </div>
          )}
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your repositories</h2>
            <Button size="sm" className="gap-2" onClick={() => setNewRepoModalOpen(true)}>
              <Plus className="size-4" />
              New
            </Button>
          </div>

          {userLoading || reposLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(6)].map((_, i) => (
                <RepositoryCardSkeleton key={i} />
              ))}
            </div>
          ) : repos.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center bg-card/30 flex flex-col items-center justify-center">
              <GitBranch className="size-8 text-primary" />
              <h3 className="text-lg font-semibold mb-2">No repositories yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create your first repository to start building something awesome</p>
              <Button size="lg" className="gap-2 flex items-center" onClick={() => setNewRepoModalOpen(true)}>
                <Plus className="size-4 mr-2" />
                Create repository
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-lg bg-card divide-y divide-border">
              {repos.map((repo) => (
                <RepositoryCard key={repo.id} repository={repo} />
              ))}
            </div>
          )}
        </div>
      </div>
      <NewRepositoryModal open={newRepoModalOpen} onOpenChange={setNewRepoModalOpen} />
    </div>
  );
}

function RepositoryCardSkeleton() {
  return (
    <div className="border-b border-border py-4 animate-pulse first:pt-0">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 bg-secondary/50 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="h-4 w-48 bg-secondary/50" />
            <div className="h-6 w-16 bg-secondary/50 border border-border" />
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="h-3 w-full bg-secondary/50" />
            <div className="h-3 w-4/5 bg-secondary/50" />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 bg-secondary/50" />
              <div className="h-3 w-6 bg-secondary/50" />
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 bg-secondary/50" />
              <div className="h-3 w-20 bg-secondary/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-36 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="container relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-8">
            <GitBranch className="size-4 text-primary" />
            <span className="text-sm font-medium">Where code lives</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Build amazing things together
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            A modern Git hosting platform built for developers. Host your code, collaborate with your team, and ship faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/register">
              <Button size="lg" className="text-base h-12 px-8">Get started for free</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base h-12 px-8">Sign in</Button>
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-3xl" />
            <div className="relative border border-border rounded-lg bg-card/50 backdrop-blur-sm p-8 shadow-2xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <GitBranch className="size-4" />
                <span>username/repository</span>
              </div>
              <div className="text-left font-mono text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-primary">$</span>
                  <span className="text-foreground">git clone git@sigmagit.com:username/repo.git</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">$</span>
                  <span className="text-muted-foreground">cd repo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">$</span>
                  <span className="text-muted-foreground"># Start building...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features to help you build, collaborate, and ship faster
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<GitBranch className="size-6" />}
              title="Git Hosting"
              description="Full Git support with SSH and HTTPS. Clone, push, and pull just like you're used to."
            />
            <FeatureCard
              icon={<Plus className="size-6" />}
              title="Pull Requests"
              description="Review code, discuss changes, and merge with confidence. Built-in code review tools."
            />
            <FeatureCard
              icon={<BookOpen className="size-6" />}
              title="Issues & Discussions"
              description="Track bugs, plan features, and discuss ideas. Keep your team aligned and organized."
            />
            <FeatureCard
              icon={<User className="size-6" />}
              title="Team Collaboration"
              description="Work together seamlessly with fine-grained permissions and team management."
            />
            <FeatureCard
              icon={<Settings className="size-6" />}
              title="CI/CD Integration"
              description="Connect with your favorite CI/CD tools. Automate your workflow from code to deployment."
            />
            <FeatureCard
              icon={<Github className="size-6" />}
              title="Open Source"
              description="Built by developers, for developers. Self-host or use our cloud platform."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers already using sigmagit to build amazing things.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-base h-12 px-8">Create your account</Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="text-base h-12 px-8">Explore repositories</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
