"use client";

import { createFileRoute, notFound } from "@tanstack/react-router";
import { useOrganization, useOrganizationMembers, useOrganizationRepos, useOrganizationTeams } from "@sigmagit/hooks";
import { BookOpen, Building2, GitBranch, Globe, Mail, MapPin, Users } from "lucide-react";
import { formatDate, timeAgo } from "@sigmagit/lib";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RepositoryCard from "@/components/repository-card";
import { createMeta } from "@/lib/seo";
import { parseAsStringLiteral, useQueryState } from "@/lib/hooks";

export const Route = createFileRoute("/_main/$username/index-org")({
  head: ({ params }) => ({
    meta: createMeta({
      title: params.username,
      description: `${params.username} organization on Sigmagit. Profile and repositories.`,
    }),
  }),
  component: OrganizationProfilePage,
});

function RepositoriesTab({ orgName }: { orgName: string }) {
  const { data, isLoading } = useOrganizationRepos(orgName);

  if (isLoading) {
    return <TabSkeleton />;
  }

  const repos = data?.repositories || [];

  if (repos.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed bg-muted/20">
        <GitBranch className="size-10 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-base font-medium">No repositories yet</h3>
        <p className="text-sm text-muted-foreground">This organization hasn't created any repositories yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-border bg-card p-4">
          <div className="text-2xl font-bold">{repos.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Repositories</div>
        </div>
      </div>
      <div className="border border-border rounded-lg bg-card divide-y divide-border">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} />
        ))}
      </div>
    </>
  );
}

function MembersTab({ orgName }: { orgName: string }) {
  const { data, isLoading } = useOrganizationMembers(orgName);

  if (isLoading) {
    return <TabSkeleton />;
  }

  const members = data?.members || [];

  return (
    <div className="border border-border rounded-lg bg-card divide-y divide-border">
      {members.map((member) => (
        <div key={member.userId} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>{member.user?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{member.user?.name || "Unknown"}</div>
              <div className="text-sm text-muted-foreground">@{member.user?.username || "unknown"}</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground capitalize">{member.role}</div>
        </div>
      ))}
    </div>
  );
}

function TeamsTab({ orgName }: { orgName: string }) {
  const { data, isLoading } = useOrganizationTeams(orgName);

  if (isLoading) {
    return <TabSkeleton />;
  }

  const teams = data?.teams || [];

  if (teams.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed bg-muted/20">
        <Users className="size-10 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-base font-medium">No teams yet</h3>
        <p className="text-sm text-muted-foreground">This organization hasn't created any teams yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-card divide-y divide-border">
      {teams.map((team) => (
        <div key={team.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{team.name}</div>
              {team.description && <div className="text-sm text-muted-foreground mt-1">{team.description}</div>}
            </div>
            <div className="text-sm text-muted-foreground capitalize">{team.permission}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 bg-card border border-border animate-pulse" />
      ))}
    </div>
  );
}

function OrganizationProfilePage() {
  const { username } = Route.useParams();
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(["repositories", "members", "teams"]).withDefault("repositories"));
  const { data: org, isLoading, error } = useOrganization(username);
  const { data: reposData } = useOrganizationRepos(username);
  const { data: membersData } = useOrganizationMembers(username);
  const { data: teamsData } = useOrganizationTeams(username);

  const repoCount = reposData?.repositories?.length || 0;
  const memberCount = membersData?.members?.length || 0;
  const teamCount = teamsData?.teams?.length || 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12 animate-pulse">
          <div className="lg:w-72 space-y-6">
            <div className="w-64 h-64 bg-muted" />
            <div className="h-8 w-48 bg-muted" />
            <div className="h-4 w-full bg-muted" />
          </div>
          <div className="flex-1 space-y-6">
            <div className="h-10 w-64 bg-muted" />
            <TabSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !org) {
    // If not found as org, let it fall through to user profile
    return null;
  }

  return (
    <div className="container max-w-[1280px] mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <aside className="lg:w-72 shrink-0 space-y-3">
          <Avatar className="lg:w-64 lg:h-64 w-40 h-40 rounded-full border-2 border-border">
            <AvatarImage src={org.avatarUrl || undefined} className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-4xl">
              <Building2 className="size-16" />
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{org.displayName}</h1>
              {org.isVerified && <span className="text-primary" title="Verified">✓</span>}
            </div>
            <p className="text-base text-muted-foreground">@{org.name}</p>
          </div>

          {org.description && (
            <div className="pt-2">
              <p className="text-sm leading-relaxed text-muted-foreground">{org.description}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            {org.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4" />
                <span>{org.email}</span>
              </div>
            )}
            {org.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                <span>{org.location}</span>
              </div>
            )}
            {org.website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="size-4" />
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline truncate">
                  {org.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Created {formatDate(org.createdAt)}</span>
            </div>
          </div>
        </aside>

        <div className="w-full">
          <Tabs value={tab} onValueChange={(value) => setTab(value === "repositories" ? null : (value as "members" | "teams"))}>
            <TabsList variant="line" className="w-full mb-6 h-auto bg-transparent p-0">
              <TabsTrigger value="repositories" className="gap-2">
                <BookOpen className="size-4" />
                <span>Repositories</span>
                {repoCount > 0 && <span className="ml-1 text-xs text-muted-foreground">({repoCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2">
                <Users className="size-4" />
                <span>Members</span>
                {memberCount > 0 && <span className="ml-1 text-xs text-muted-foreground">({memberCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="teams" className="gap-2">
                <Users className="size-4" />
                <span>Teams</span>
                {teamCount > 0 && <span className="ml-1 text-xs text-muted-foreground">({teamCount})</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="repositories" className="mt-0">
              <RepositoriesTab orgName={username} />
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <MembersTab orgName={username} />
            </TabsContent>

            <TabsContent value="teams" className="mt-0">
              <TeamsTab orgName={username} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
