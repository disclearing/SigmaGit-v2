import { GithubIcon, LinkedInIcon, XIcon } from "@/components/icons";
import RepositoryCard from "@/components/repository-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile, useUserRepositories, useUserStarredRepos, useOrganization, useOrganizationRepos, useOrganizationMembers, useOrganizationTeams } from "@sigmagit/hooks";
import { Activity, BookOpen, Building2, Calendar, GitBranch, Globe, Link as LinkIcon, MapPin, Award, Users, Mail } from "lucide-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { timeAgo, formatDate } from "@sigmagit/lib";
import { parseAsStringLiteral, useQueryState } from "@/lib/hooks";

export const Route = createFileRoute("/_main/$username/")({
  component: ProfilePage,
});

function RepositoriesTab({ username }: { username: string }) {
  const { data, isLoading } = useUserRepositories(username);

  if (isLoading) {
    return <TabSkeleton />;
  }

  const repos = data?.repos || [];
  const totalStars = repos.reduce((sum, repo) => sum + (repo.starCount || 0), 0);

  if (repos.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed bg-muted/20">
              <GitBranch className="size-10 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-base font-medium">No repositories yet</h3>
        <p className="text-sm text-muted-foreground">This user hasn't created any public repositories.</p>
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
        <div className="border border-border bg-card p-4">
          <div className="text-2xl font-bold">{totalStars}</div>
          <div className="text-sm text-muted-foreground mt-1">Total stars</div>
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

function StarredTab({ username }: { username: string }) {
  const { data, isLoading } = useUserStarredRepos(username);

  if (isLoading) {
    return <TabSkeleton />;
  }

  const repos = data?.repos || [];

  if (repos.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed bg-muted/20">
              <Award className="size-10 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-base font-medium">No starred repositories</h3>
        <p className="text-sm text-muted-foreground">This user hasn't starred any repositories yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="border border-border bg-card p-4 inline-block">
          <div className="text-2xl font-bold">{repos.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Starred repositories</div>
        </div>
      </div>
      <div className="border border-border rounded-lg bg-card divide-y divide-border">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} showOwner />
        ))}
      </div>
    </>
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

function OrganizationRepositoriesTab({ orgName }: { orgName: string }) {
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

function OrganizationMembersTab({ orgName }: { orgName: string }) {
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
              <AvatarFallback>{(member as any).user?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{(member as any).user?.name || "Unknown"}</div>
              <div className="text-sm text-muted-foreground">@{(member as any).user?.username || "unknown"}</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground capitalize">{member.role}</div>
        </div>
      ))}
    </div>
  );
}

function OrganizationTeamsTab({ orgName }: { orgName: string }) {
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

function ProfilePage() {
  const { username } = Route.useParams();
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(["repositories", "starred", "members", "teams"]).withDefault("repositories"));
  
  // Check for organization first
  const { data: org, isLoading: isLoadingOrg, error: orgError } = useOrganization(username);
  const { data: orgReposData } = useOrganizationRepos(username);
  const { data: orgMembersData } = useOrganizationMembers(username);
  const { data: orgTeamsData } = useOrganizationTeams(username);
  
  // Fall back to user if not an org
  const { data: user, isLoading: isLoadingUser, error: userError } = useUserProfile(username);
  const { data: reposData } = useUserRepositories(username);
  const { data: starredData } = useUserStarredRepos(username);

  const isLoading = isLoadingOrg || isLoadingUser;
  const isOrg = !!org && !orgError;
  
  const repoCount = isOrg ? (orgReposData?.repositories?.length || 0) : (reposData?.repos?.length || 0);
  const starredCount = starredData?.repos?.length || 0;
  const memberCount = orgMembersData?.members?.length || 0;
  const teamCount = orgTeamsData?.teams?.length || 0;

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

  // If it's an organization, render org profile
  if (isOrg && org) {
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
                <OrganizationRepositoriesTab orgName={username} />
              </TabsContent>

              <TabsContent value="members" className="mt-0">
                <OrganizationMembersTab orgName={username} />
              </TabsContent>

              <TabsContent value="teams" className="mt-0">
                <OrganizationTeamsTab orgName={username} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render user profile
  if (userError || !user) {
    throw notFound();
  }

  return (
    <div className="container max-w-[1280px] mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <aside className="lg:w-72 shrink-0 space-y-3">
          <Avatar className="lg:w-64 lg:h-64 w-40 h-40 rounded-full border-2 border-border">
            <AvatarImage src={user.avatarUrl || undefined} className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-4xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{user.name}</h1>
              {user.pronouns && <span className="text-sm text-muted-foreground">({user.pronouns})</span>}
            </div>
            <p className="text-base text-muted-foreground">@{user.username}</p>
          </div>

          {user.bio && (
            <div className="pt-2">
              <p className="text-sm leading-relaxed text-muted-foreground">{user.bio}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            {user.company && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="size-4" />
                <span>{user.company}</span>
              </div>
            )}
            {user.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                <span>{user.location}</span>
              </div>
            )}
            {user.website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="size-4" />
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline truncate">
                  {user.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            {user.lastActiveAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="size-4" />
                <span>Active {timeAgo(user.lastActiveAt)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {user.socialLinks && (
            <div className="flex items-center gap-4 pt-2">
              {user.socialLinks.github && (
                <a
                  href={user.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GithubIcon className="h-5 w-5" />
                </a>
              )}
              {user.socialLinks.twitter && (
                <a
                  href={user.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XIcon className="h-5 w-5" />
                </a>
              )}
              {user.socialLinks.linkedin && (
                <a
                  href={user.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LinkedInIcon className="h-5 w-5" />
                </a>
              )}
              {user.socialLinks.custom?.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <LinkIcon className="size-5" />
                </a>
              ))}
            </div>
          )}
        </aside>

        <div className="w-full">
          <Tabs value={tab} onValueChange={(value) => setTab(value === "repositories" ? null : (value as "starred"))}>
            <TabsList variant="line" className="w-full mb-6 h-auto bg-transparent p-0">
              <TabsTrigger value="repositories" className="gap-2">
                <BookOpen className="size-4" />
                <span>Repositories</span>
                {repoCount > 0 && <span className="ml-1 text-xs text-muted-foreground">({repoCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="starred" className="gap-2">
                <Award className="size-4" />
                <span>Starred</span>
                {starredCount > 0 && <span className="ml-1 text-xs text-muted-foreground">({starredCount})</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="repositories" className="mt-0">
              <RepositoriesTab username={username} />
            </TabsContent>

            <TabsContent value="starred" className="mt-0">
              <StarredTab username={username} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
