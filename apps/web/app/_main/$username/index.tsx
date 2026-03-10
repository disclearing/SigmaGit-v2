import { useEffect, useState } from "react";
import {
  useAddTeamRepo,
  useCreateTeam,
  useDeleteOrganization,
  useDeleteTeam,
  useOrganization,
  useOrganizationMembers,
  useOrganizationRepos,
  useOrganizationTeams,
  useRemoveOrgMember,
  useRemoveTeamRepo,
  useTeam,
  useUpdateOrgMember,
  useUpdateOrganization,
  useUserPackages,
  useUserProfile,
  useUserRepositories,
  useUserStarredRepos,
} from "@sigmagit/hooks";
import { toast } from "sonner";
import { Activity, Award, BookOpen, Building2, Calendar, Flag, GitBranch, Globe, Link as LinkIcon, Mail, MapPin, Package, Settings, Star, Trash2, Users } from "lucide-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { formatDate, timeAgo } from "@sigmagit/lib";
import { GithubIcon, LinkedInIcon, XIcon } from "@/components/icons";
import RepositoryCard from "@/components/repository-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ReportDialog } from "@/components/report-dialog";
import { createMeta } from "@/lib/seo";
import { useSession } from "@/lib/auth-client";
import { parseAsStringLiteral, useQueryState } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const ORG_MEMBER_ROLES = ["owner", "admin", "member"] as const;
type OrganizationRole = (typeof ORG_MEMBER_ROLES)[number];
const TEAM_PERMISSIONS = ["read", "write", "admin"] as const;
type TeamPermission = (typeof TEAM_PERMISSIONS)[number];

export const Route = createFileRoute("/_main/$username/")({
  head: ({ params }) => ({
    meta: createMeta({
      title: params.username,
      description: `${params.username}'s profile, repositories, and activity on Sigmagit.`,
    }),
  }),
  component: ProfilePage,
});

// Modern stat card component
function StatCard({ value, label, icon: Icon }: { value: number | string; label: string; icon: React.ElementType }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-4 transition-all duration-300 hover:bg-card hover:border-border hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Modern empty state component
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-16">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
        <Icon className="size-8 text-muted-foreground/50" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Modern tab skeleton
function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}

function RepositoriesTab({ username }: { username: string }) {
  const { data, isLoading } = useUserRepositories(username);

  if (isLoading) {
    return <TabSkeleton />;
  }

  const repos = data?.repos || [];
  const totalStars = repos.reduce((sum, repo) => sum + (repo.starCount || 0), 0);

  if (repos.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="No repositories yet"
        description="This user hasn't created any public repositories."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard value={repos.length} label="Repositories" icon={BookOpen} />
        <StatCard value={totalStars} label="Total Stars" icon={Star} />
      </div>
      <div className="flex flex-col gap-3">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} variant="list" />
        ))}
      </div>
    </div>
  );
}

function PackagesTab({ username }: { username: string }) {
  const { data, isLoading } = useUserPackages(username);

  if (isLoading) {
    return <TabSkeleton />;
  }

  const packages = data?.packages || [];

  if (packages.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No container images"
        description="Push images with docker push to get started."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {packages.map((pkg) => (
        <div
          key={`${pkg.owner}/${pkg.name}`}
          className="group flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-4 transition-all duration-300 hover:bg-card hover:border-border hover:shadow-sm"
        >
          <div className="min-w-0">
            <p className="font-mono font-medium text-foreground">{pkg.owner}/{pkg.name}</p>
            <p className="text-sm text-muted-foreground">{pkg.tags.length} tag(s)</p>
          </div>
          <code className="hidden shrink-0 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground sm:block">
            docker pull &lt;host&gt;/{pkg.owner}/{pkg.name}:&lt;tag&gt;
          </code>
        </div>
      ))}
    </div>
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
      <EmptyState
        icon={Award}
        title="No starred repositories"
        description="This user hasn't starred any repositories yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <StatCard value={repos.length} label="Starred repositories" icon={Award} />
      <div className="flex flex-col gap-3">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} showOwner variant="list" />
        ))}
      </div>
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
      <EmptyState
        icon={GitBranch}
        title="No repositories yet"
        description="This organization hasn't created any repositories yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <StatCard value={repos.length} label="Repositories" icon={BookOpen} />
      <div className="flex flex-col gap-3">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} variant="list" />
        ))}
      </div>
    </div>
  );
}

function OrganizationMemberRow({
  orgName,
  member,
  canManageMembers,
  currentUsername,
}: {
  orgName: string;
  member: any;
  canManageMembers: boolean;
  currentUsername?: string;
}) {
  const username = member?.user?.username as string | undefined;
  const removeMember = useRemoveOrgMember(orgName, username || "");

  const canRemove =
    canManageMembers && !!username && username !== currentUsername && member.role !== "owner";

  const handleRemoveMember = async () => {
    if (!username) return;
    if (!confirm(`Remove @${username} from ${orgName}?`)) return;
    try {
      await removeMember.mutateAsync();
      toast.success(`Removed @${username} from organization`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarFallback className="bg-muted text-sm font-medium">
            {member.user?.name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{member.user?.name || "Unknown"}</div>
          <div className="text-sm text-muted-foreground">@{member.user?.username || "unknown"}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
          {member.role}
        </span>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveMember}
            disabled={removeMember.isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

function OrganizationMembersTab({
  orgName,
  canManageMembers,
  currentUsername,
}: {
  orgName: string;
  canManageMembers: boolean;
  currentUsername?: string;
}) {
  const { data, isLoading } = useOrganizationMembers(orgName);

  if (isLoading) {
    return <TabSkeleton />;
  }

  const members = data?.members || [];

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50">
      {members.map((member) => (
        <OrganizationMemberRow
          key={member.userId}
          orgName={orgName}
          member={member}
          canManageMembers={canManageMembers}
          currentUsername={currentUsername}
        />
      ))}
    </div>
  );
}

function OrganizationSettingsMemberRow({
  orgName,
  member,
  currentUsername,
}: {
  orgName: string;
  member: any;
  currentUsername?: string;
}) {
  const username = member?.user?.username as string | undefined;
  const role = (member?.role || "member") as OrganizationRole;
  const updateMemberRole = useUpdateOrgMember(orgName, username || "");
  const removeMember = useRemoveOrgMember(orgName, username || "");

  const isSelf = username === currentUsername;
  const isOwner = role === "owner";
  const canEditRole = !!username && !isSelf && !isOwner;
  const canRemove = !!username && !isSelf && !isOwner;

  const handleRoleChange = async (nextRole: string) => {
    if (!username) return;
    try {
      await updateMemberRole.mutateAsync({ role: nextRole as OrganizationRole });
      toast.success(`Updated @${username} to ${nextRole}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    }
  };

  const handleRemoveMember = async () => {
    if (!username) return;
    if (!confirm(`Remove @${username} from ${orgName}?`)) return;
    try {
      await removeMember.mutateAsync();
      toast.success(`Removed @${username}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10">
          <AvatarFallback className="bg-muted text-sm font-medium">
            {member.user?.name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-medium">{member.user?.name || "Unknown"}</div>
          <div className="truncate text-sm text-muted-foreground">@{member.user?.username || "unknown"}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger className="h-9 w-32" disabled={!canEditRole || updateMemberRole.isPending}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORG_MEMBER_ROLES.map((memberRole) => (
              <SelectItem key={memberRole} value={memberRole}>
                {memberRole}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveMember}
          disabled={!canRemove || removeMember.isPending}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

function OrganizationSettingsMembersSection({
  orgName,
  currentUsername,
}: {
  orgName: string;
  currentUsername?: string;
}) {
  const { data, isLoading } = useOrganizationMembers(orgName);
  const [usernameInput, setUsernameInput] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<OrganizationRole>("member");
  const addOrUpdateMember = useUpdateOrgMember(orgName, usernameInput.trim());

  const members = data?.members || [];

  const handleAddMember = async () => {
    const username = usernameInput.trim();
    if (!username) {
      toast.error("Enter a username");
      return;
    }

    try {
      await addOrUpdateMember.mutateAsync({ role: newMemberRole });
      toast.success(`Added/updated @${username}`);
      setUsernameInput("");
      setNewMemberRole("member");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add member");
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Add Member</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto]">
          <Input
            placeholder="Username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            disabled={addOrUpdateMember.isPending}
          />
          <Select
            value={newMemberRole}
            onValueChange={(value) => setNewMemberRole(value as OrganizationRole)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORG_MEMBER_ROLES.map((memberRole) => (
                <SelectItem key={memberRole} value={memberRole}>
                  {memberRole}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddMember} disabled={addOrUpdateMember.isPending}>
            Add member
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Enter an existing username to add them to this organization.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No members yet.</div>
        ) : (
          members.map((member) => (
            <OrganizationSettingsMemberRow
              key={(member as any).user?.id || member.userId}
              orgName={orgName}
              member={member}
              currentUsername={currentUsername}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OrganizationSettingsTeamsSection({ orgName }: { orgName: string }) {
  const { data: teamsData, isLoading: isLoadingTeams } = useOrganizationTeams(orgName);
  const { data: orgReposData } = useOrganizationRepos(orgName);
  const [selectedTeamSlug, setSelectedTeamSlug] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newTeamPermission, setNewTeamPermission] = useState<TeamPermission>("read");
  const [repoName, setRepoName] = useState("");
  const [repoPermission, setRepoPermission] = useState<TeamPermission>("read");

  const createTeam = useCreateTeam(orgName);
  const deleteTeam = useDeleteTeam(orgName, selectedTeamSlug);
  const { data: selectedTeamData, isLoading: isLoadingSelectedTeam } = useTeam(orgName, selectedTeamSlug);
  const addTeamRepo = useAddTeamRepo(orgName, selectedTeamSlug, repoName, { permission: repoPermission });
  const removeTeamRepo = useRemoveTeamRepo(orgName, selectedTeamSlug, repoName);

  const teams = teamsData?.teams || [];
  const repositories = orgReposData?.repositories || [];
  const assignedRepos = (selectedTeamData?.repositories || []) as Array<{
    repository: any;
    permission: TeamPermission;
  }>;

  useEffect(() => {
    if (!selectedTeamSlug && teams.length > 0) {
      setSelectedTeamSlug(teams[0].slug);
    }
  }, [selectedTeamSlug, teams]);

  const availableRepos = repositories.filter(
    (repo) => !assignedRepos.some((assigned) => assigned.repository?.name === repo.name)
  );

  const handleCreateTeam = async () => {
    const name = newTeamName.trim();
    if (!name) {
      toast.error("Team name is required");
      return;
    }

    try {
      await createTeam.mutateAsync({
        name,
        description: newTeamDescription.trim() || undefined,
        permission: newTeamPermission,
      });
      const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      setSelectedTeamSlug(slug);
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamPermission("read");
      toast.success("Team created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create team");
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeamSlug) return;
    if (!confirm(`Delete team "${selectedTeamSlug}"?`)) return;
    try {
      await deleteTeam.mutateAsync();
      toast.success("Team deleted");
      setSelectedTeamSlug("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete team");
    }
  };

  const handleAssignRepo = async () => {
    if (!selectedTeamSlug || !repoName) {
      toast.error("Select a team and repository");
      return;
    }
    try {
      await addTeamRepo.mutateAsync();
      toast.success("Repository access assigned");
      setRepoName("");
      setRepoPermission("read");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign repository access");
    }
  };

  const handleRemoveRepo = async (name: string) => {
    if (!selectedTeamSlug) return;
    if (!confirm(`Remove ${name} from team access list?`)) return;
    try {
      setRepoName(name);
      await removeTeamRepo.mutateAsync();
      toast.success("Repository access removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove repository access");
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Create Team</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
          <Input
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            disabled={createTeam.isPending}
          />
          <Select
            value={newTeamPermission}
            onValueChange={(value) => setNewTeamPermission(value as TeamPermission)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEAM_PERMISSIONS.map((permission) => (
                <SelectItem key={permission} value={permission}>
                  {permission}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Team description (optional)"
          value={newTeamDescription}
          onChange={(e) => setNewTeamDescription(e.target.value)}
          disabled={createTeam.isPending}
          className="mt-3"
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleCreateTeam} disabled={createTeam.isPending}>
            Create team
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Team Repository Access</h3>
          {selectedTeamSlug && (
            <Button variant="destructive" size="sm" onClick={handleDeleteTeam} disabled={deleteTeam.isPending}>
              Delete team
            </Button>
          )}
        </div>

        {isLoadingTeams ? (
          <p className="text-sm text-muted-foreground">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No teams yet. Create one to assign repository access.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={selectedTeamSlug} onValueChange={setSelectedTeamSlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.slug}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTeamSlug && (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
                  <Select value={repoName} onValueChange={setRepoName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRepos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.name}>
                          {repo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={repoPermission}
                    onValueChange={(value) => setRepoPermission(value as TeamPermission)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_PERMISSIONS.map((permission) => (
                        <SelectItem key={permission} value={permission}>
                          {permission}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignRepo} disabled={!repoName || addTeamRepo.isPending}>
                    Assign
                  </Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border/50">
                  {isLoadingSelectedTeam ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading team access...</div>
                  ) : assignedRepos.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      No repositories assigned to this team yet.
                    </div>
                  ) : (
                    assignedRepos.map((assigned) => (
                      <div key={assigned.repository?.id} className="flex items-center justify-between p-4">
                        <div>
                          <div className="font-medium">{assigned.repository?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Permission: {assigned.permission}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveRepo(assigned.repository?.name)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrganizationSettingsTab({
  orgName,
  org,
  isOwner,
  currentUsername,
}: {
  orgName: string;
  org: {
    displayName: string;
    description: string | null;
    email: string | null;
    website: string | null;
    location: string | null;
  };
  isOwner: boolean;
  currentUsername?: string;
}) {
  const updateOrg = useUpdateOrganization(orgName);
  const deleteOrg = useDeleteOrganization(orgName);
  const [section, setSection] = useState<"general" | "members" | "teams" | "danger">("general");
  const [formData, setFormData] = useState({
    displayName: org.displayName || "",
    description: org.description || "",
    email: org.email || "",
    website: org.website || "",
    location: org.location || "",
  });
  const navigate = Route.useNavigate();

  useEffect(() => {
    setFormData({
      displayName: org.displayName || "",
      description: org.description || "",
      email: org.email || "",
      website: org.website || "",
      location: org.location || "",
    });
  }, [org.displayName, org.description, org.email, org.website, org.location]);

  const handleSave = async () => {
    try {
      await updateOrg.mutateAsync({
        displayName: formData.displayName,
        description: formData.description || null,
        email: formData.email || null,
        website: formData.website || null,
        location: formData.location || null,
      });
      toast.success("Organization settings updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update organization");
    }
  };

  const handleDeleteOrg = async () => {
    if (!isOwner) return;
    if (!confirm(`Delete @${orgName}? This action cannot be undone.`)) return;
    try {
      await deleteOrg.mutateAsync();
      toast.success("Organization deleted");
      navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete organization");
    }
  };

  const navItems = [
    { id: "general", label: "General" },
    { id: "members", label: "Members" },
    { id: "teams", label: "Teams" },
    { id: "danger", label: "Danger Zone", danger: true },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <nav className="h-fit overflow-hidden rounded-xl border border-border/50 bg-card/50 p-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                section === item.id
                  ? item.danger
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                item.danger && section !== item.id && "text-destructive/70 hover:text-destructive"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="space-y-6">
        {section === "general" && (
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 p-6">
            <h3 className="mb-4 text-lg font-semibold">General</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-display-name">Display name</Label>
                <Input
                  id="org-display-name"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  disabled={!isOwner || updateOrg.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-description">Description</Label>
                <Textarea
                  id="org-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  disabled={!isOwner || updateOrg.isPending}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-email">Email</Label>
                  <Input
                    id="org-email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={!isOwner || updateOrg.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-website">Website</Label>
                  <Input
                    id="org-website"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    disabled={!isOwner || updateOrg.isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-location">Location</Label>
                <Input
                  id="org-location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  disabled={!isOwner || updateOrg.isPending}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={!isOwner || updateOrg.isPending}>
                Save changes
              </Button>
            </div>
          </div>
        )}

        {section === "members" && (
          <OrganizationSettingsMembersSection orgName={orgName} currentUsername={currentUsername} />
        )}

        {section === "teams" && <OrganizationSettingsTeamsSection orgName={orgName} />}

        {section === "danger" && (
          <div className="overflow-hidden rounded-xl border border-destructive/30 bg-card/50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-destructive">Danger Zone</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Delete this organization and all associated repositories.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteOrg}
              disabled={!isOwner || deleteOrg.isPending}
              className="gap-2"
            >
              <Trash2 className="size-4" />
              Delete organization
            </Button>
          </div>
        )}
      </div>
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
      <EmptyState
        icon={Users}
        title="No teams yet"
        description="This organization hasn't created any teams yet."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {teams.map((team) => (
        <div
          key={team.id}
          className="overflow-hidden rounded-xl border border-border/50 bg-card/50 p-4 transition-all duration-300 hover:bg-card hover:border-border hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{team.name}</div>
              {team.description && (
                <div className="mt-1 text-sm text-muted-foreground">{team.description}</div>
              )}
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
              {team.permission}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Modern profile info item component
function ProfileInfoItem({
  icon: Icon,
  children,
  href,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0 text-muted-foreground/70" />
      <span className="truncate">{children}</span>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block transition-colors hover:text-primary"
      >
        {content}
      </a>
    );
  }

  return content;
}

// Modern social link component
function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
    >
      <Icon className="size-4" />
    </a>
  );
}

function ProfilePage() {
  const { username } = Route.useParams();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["repositories", "starred", "packages", "members", "teams", "settings"]).withDefault(
      "repositories"
    )
  );
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { data: session } = useSession();

  // Resolve profile type with only 2 requests; secondary data is fetched after we know org vs user
  const { data: org, isLoading: isLoadingOrg, error: orgError } = useOrganization(username);
  const { data: user, isLoading: isLoadingUser, error: userError } = useUserProfile(username);

  const isOrg = !!org && !orgError;
  const isUser = !!user && !userError;

  const { data: orgReposData } = useOrganizationRepos(username, { enabled: isOrg });
  const { data: orgMembersData } = useOrganizationMembers(username, { enabled: isOrg });
  const { data: orgTeamsData } = useOrganizationTeams(username, { enabled: isOrg });
  const { data: reposData } = useUserRepositories(username, { enabled: isUser });
  const { data: starredData } = useUserStarredRepos(username, { enabled: isUser });

  const isLoading = isLoadingOrg || isLoadingUser;
  const currentUsername = (session?.user as { username?: string } | undefined)?.username;
  const currentUserId = session?.user?.id;
  const orgMembers = orgMembersData?.members ?? [];
  const orgRepos = orgReposData?.repositories ?? [];
  const orgTeams = orgTeamsData?.teams ?? [];
  const userRepos = reposData?.repos ?? [];
  const starredRepos = starredData?.repos ?? [];
  const currentOrgMembership = orgMembers.find(
    (member) => (member as any).user?.username === currentUsername
  );
  const isOrgOwner = currentOrgMembership?.role === "owner";
  const canManageMembers = isOrgOwner;

  const repoCount = isOrg ? orgRepos.length : userRepos.length;
  const starredCount = starredRepos.length;
  const memberCount = orgMembers.length;
  const teamCount = orgTeams.length;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="flex animate-pulse flex-col gap-12 lg:flex-row">
          <aside className="shrink-0 space-y-6 lg:w-80">
            <div className="size-64 rounded-full bg-muted" />
            <div className="h-8 w-48 bg-muted" />
            <div className="h-4 w-full bg-muted" />
          </aside>
          <div className="flex-1 space-y-6">
            <div className="h-10 w-64 bg-muted" />
            <TabSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // If it's an organization, render org profile
  if (isOrg) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Sidebar */}
          <aside className="shrink-0 lg:w-80">
            <div className="sticky top-24 space-y-6">
              {/* Avatar with gradient ring */}
              <div className="relative mx-auto w-fit lg:mx-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
                <Avatar className="relative size-40 lg:size-64">
                  <AvatarImage src={org.avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-muted text-4xl font-semibold text-muted-foreground">
                    <Building2 className="size-16" />
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and username */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight">{org.displayName}</h1>
                  {org.isVerified && (
                    <span
                      className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                      title="Verified"
                    >
                      <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">@{org.name}</p>
              </div>

              {/* Report button */}
              {(currentUserId || currentUsername) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setIsReportDialogOpen(true)}
                >
                  <Flag className="size-4" />
                  Report
                </Button>
              )}

              <ReportDialog
                targetType="organization"
                targetId={org.id}
                targetName={org.displayName}
                open={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
              />

              {/* Bio */}
              {org.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">{org.description}</p>
              )}

              {/* Metadata */}
              <div className="space-y-2.5">
                {org.email && <ProfileInfoItem icon={Mail}>{org.email}</ProfileInfoItem>}
                {org.location && <ProfileInfoItem icon={MapPin}>{org.location}</ProfileInfoItem>}
                {org.website && (
                  <ProfileInfoItem icon={Globe} href={org.website}>
                    {org.website.replace(/^https?:\/\//, "")}
                  </ProfileInfoItem>
                )}
                <ProfileInfoItem icon={Calendar}>Created {formatDate(org.createdAt)}</ProfileInfoItem>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            <Tabs
              value={tab}
              onValueChange={(value) =>
                setTab(value === "repositories" ? null : (value as "members" | "teams" | "settings"))
              }
            >
              <TabsList className="mb-6 h-auto w-full justify-start rounded-none border-b border-border/50 bg-transparent p-0">
                <TabsTrigger
                  value="repositories"
                  className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:shadow-none"
                >
                  <BookOpen className="size-4" />
                  <span>Repositories</span>
                  {repoCount > 0 && (
                    <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {repoCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:shadow-none"
                >
                  <Users className="size-4" />
                  <span>Members</span>
                  {memberCount > 0 && (
                    <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {memberCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="teams"
                  className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:shadow-none"
                >
                  <Users className="size-4" />
                  <span>Teams</span>
                  {teamCount > 0 && (
                    <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {teamCount}
                    </span>
                  )}
                </TabsTrigger>
                {isOrgOwner && (
                  <TabsTrigger
                    value="settings"
                    className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:shadow-none"
                  >
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="repositories" className="mt-0">
                <OrganizationRepositoriesTab orgName={username} />
              </TabsContent>

              <TabsContent value="members" className="mt-0">
                <OrganizationMembersTab
                  orgName={username}
                  canManageMembers={canManageMembers}
                  currentUsername={currentUsername}
                />
              </TabsContent>

              <TabsContent value="teams" className="mt-0">
                <OrganizationTeamsTab orgName={username} />
              </TabsContent>

              {isOrgOwner && (
                <TabsContent value="settings" className="mt-0">
                  <OrganizationSettingsTab
                    orgName={username}
                    org={org}
                    isOwner={isOrgOwner}
                    currentUsername={currentUsername}
                  />
                </TabsContent>
              )}
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Sidebar */}
        <aside className="shrink-0 lg:w-80">
          <div className="sticky top-24 space-y-6">
            {/* Avatar with gradient ring */}
            <div className="relative mx-auto w-fit lg:mx-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/40 via-primary/20 to-primary/5" />
              <Avatar className="relative size-40 lg:size-64">
                <AvatarImage src={user.avatarUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-muted text-5xl font-semibold text-muted-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and username */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                {user.pronouns && (
                  <span className="text-sm text-muted-foreground">({user.pronouns})</span>
                )}
              </div>
              <p className="text-lg text-muted-foreground">@{user.username}</p>
            </div>

            {/* Report button */}
            {(!currentUserId || currentUserId !== user.id) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setIsReportDialogOpen(true)}
              >
                <Flag className="size-4" />
                Report
              </Button>
            )}

            <ReportDialog
              targetType="user"
              targetId={user.id}
              targetName={user.name}
              open={isReportDialogOpen}
              onOpenChange={setIsReportDialogOpen}
            />

            {/* Bio */}
            {user.bio && <p className="text-sm leading-relaxed text-muted-foreground">{user.bio}</p>}

            {/* Metadata */}
            <div className="space-y-2.5">
              {user.company && <ProfileInfoItem icon={Building2}>{user.company}</ProfileInfoItem>}
              {user.location && <ProfileInfoItem icon={MapPin}>{user.location}</ProfileInfoItem>}
              {user.website && (
                <ProfileInfoItem icon={Globe} href={user.website}>
                  {user.website.replace(/^https?:\/\//, "")}
                </ProfileInfoItem>
              )}
              {user.lastActiveAt && (
                <ProfileInfoItem icon={Activity}>Active {timeAgo(user.lastActiveAt)}</ProfileInfoItem>
              )}
              <ProfileInfoItem icon={Calendar}>Joined {formatDate(user.createdAt)}</ProfileInfoItem>
            </div>

            {/* Social links */}
            {user.socialLinks && (
              <div className="flex flex-wrap gap-2 pt-2">
                {user.socialLinks.github && (
                  <SocialLink href={user.socialLinks.github} icon={GithubIcon} label="GitHub" />
                )}
                {user.socialLinks.twitter && (
                  <SocialLink href={user.socialLinks.twitter} icon={XIcon} label="Twitter" />
                )}
                {user.socialLinks.linkedin && (
                  <SocialLink href={user.socialLinks.linkedin} icon={LinkedInIcon} label="LinkedIn" />
                )}
                {user.socialLinks.custom?.map((url, i) => (
                  <SocialLink key={i} href={url} icon={LinkIcon} label={`Link ${i + 1}`} />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <Tabs
            value={tab}
            onValueChange={(value) =>
              setTab(value === "repositories" ? null : (value as "starred" | "packages"))
            }
          >
            <TabsList className="mb-6 h-auto w-full justify-start rounded-none border-b border-border/50 bg-transparent p-0">
              <TabsTrigger
                value="repositories"
                className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:shadow-none"
              >
                <BookOpen className="size-4" />
                <span>Repositories</span>
                {repoCount > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {repoCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="starred"
                className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:shadow-none"
              >
                <Award className="size-4" />
                <span>Starred</span>
                {starredCount > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {starredCount}
                  </span>
                )}
              </TabsTrigger>
              {currentUsername === username && (
                <TabsTrigger
                  value="packages"
                  className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:shadow-none"
                >
                  <Package className="size-4" />
                  <span>Packages</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="repositories" className="mt-0">
              <RepositoriesTab username={username} />
            </TabsContent>

            <TabsContent value="starred" className="mt-0">
              <StarredTab username={username} />
            </TabsContent>

            {currentUsername === username && (
              <TabsContent value="packages" className="mt-0">
                <PackagesTab username={username} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
