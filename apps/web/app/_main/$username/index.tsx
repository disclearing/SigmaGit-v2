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
  useUserProfile,
  useUserRepositories,
  useUserStarredRepos,
} from "@sigmagit/hooks";
import { toast } from "sonner";
import { Activity, Award, BookOpen, Building2, Calendar, GitBranch, Globe, Link as LinkIcon, Mail, MapPin, Settings, Trash2, Users } from "lucide-react";
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
import { useSession } from "@/lib/auth-client";
import { parseAsStringLiteral, useQueryState } from "@/lib/hooks";

const ORG_MEMBER_ROLES = ["owner", "admin", "member"] as const;
type OrganizationRole = (typeof ORG_MEMBER_ROLES)[number];
const TEAM_PERMISSIONS = ["read", "write", "admin"] as const;
type TeamPermission = (typeof TEAM_PERMISSIONS)[number];

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
      <div className="border border-border rounded-lg bg-card divide-y divide-border overflow-hidden">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} variant="list" />
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
      <div className="border border-border rounded-lg bg-card divide-y divide-border overflow-hidden">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} showOwner variant="list" />
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
      <div className="border border-border rounded-lg bg-card divide-y divide-border overflow-hidden">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} variant="list" />
        ))}
      </div>
    </>
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
    canManageMembers &&
    !!username &&
    username !== currentUsername &&
    member.role !== "owner";

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
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarFallback>{member.user?.name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{member.user?.name || "Unknown"}</div>
          <div className="text-sm text-muted-foreground">@{member.user?.username || "unknown"}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground capitalize">{member.role}</div>
        {canRemove && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveMember}
            disabled={removeMember.isPending}
            className="text-destructive hover:text-destructive"
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
    <div className="border border-border rounded-lg bg-card divide-y divide-border">
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
    <div className="p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-10">
          <AvatarFallback>{member.user?.name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium truncate">{member.user?.name || "Unknown"}</div>
          <div className="text-sm text-muted-foreground truncate">@{member.user?.username || "unknown"}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-32 h-9" disabled={!canEditRole || updateMemberRole.isPending}>
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
          variant="outline"
          size="sm"
          onClick={handleRemoveMember}
          disabled={!canRemove || removeMember.isPending}
          className="text-destructive hover:text-destructive"
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
      <div className="border border-border rounded-lg bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Add Member</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3">
          <Input
            placeholder="Username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            disabled={addOrUpdateMember.isPending}
          />
          <Select value={newMemberRole} onValueChange={(value) => setNewMemberRole(value as OrganizationRole)}>
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
        <p className="text-xs text-muted-foreground">
          Enter an existing username to add them to this organization.
        </p>
      </div>

      <div className="border border-border rounded-lg bg-card divide-y divide-border">
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
  const assignedRepos = (selectedTeamData?.repositories || []) as Array<{ repository: any; permission: TeamPermission }>;

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
      <div className="border border-border rounded-lg bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Create Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
          <Input
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            disabled={createTeam.isPending}
          />
          <Select value={newTeamPermission} onValueChange={(value) => setNewTeamPermission(value as TeamPermission)}>
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
        />
        <div className="flex justify-end">
          <Button onClick={handleCreateTeam} disabled={createTeam.isPending}>
            Create team
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Team Repository Access</h3>
          {selectedTeamSlug && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTeam}
              disabled={deleteTeam.isPending}
            >
              Delete team
            </Button>
          )}
        </div>

        {isLoadingTeams ? (
          <p className="text-sm text-muted-foreground">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams yet. Create one to assign repository access.</p>
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
                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3">
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
                  <Select value={repoPermission} onValueChange={(value) => setRepoPermission(value as TeamPermission)}>
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

                <div className="border border-border rounded-lg divide-y divide-border">
                  {isLoadingSelectedTeam ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading team access...</div>
                  ) : assignedRepos.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No repositories assigned to this team yet.</div>
                  ) : (
                    assignedRepos.map((assigned) => (
                      <div key={assigned.repository?.id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{assigned.repository?.name}</div>
                          <div className="text-sm text-muted-foreground">Permission: {assigned.permission}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <div className="border border-border rounded-lg bg-card p-3 h-fit">
        <div className="space-y-1">
          <Button
            variant={section === "general" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setSection("general")}
          >
            General
          </Button>
          <Button
            variant={section === "members" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setSection("members")}
          >
            Members
          </Button>
          <Button
            variant={section === "teams" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setSection("teams")}
          >
            Teams
          </Button>
          <Button
            variant={section === "danger" ? "secondary" : "ghost"}
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => setSection("danger")}
          >
            Danger Zone
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {section === "general" && (
          <div className="border border-border rounded-lg bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">General</h3>
            <div className="space-y-2">
              <Label htmlFor="org-display-name">Display name</Label>
              <Input
                id="org-display-name"
                value={formData.displayName}
                onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                disabled={!isOwner || updateOrg.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                disabled={!isOwner || updateOrg.isPending}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex justify-end">
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
          <div className="border border-destructive/30 rounded-lg bg-card p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
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
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(["repositories", "starred", "members", "teams", "settings"]).withDefault("repositories"));
  const { data: session } = useSession();
  
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
  const currentUsername = (session?.user as { username?: string } | undefined)?.username;
  const currentOrgMembership = orgMembersData?.members?.find(
    (member) => (member as any)?.user?.username === currentUsername
  );
  const isOrgOwner = currentOrgMembership?.role === "owner";
  const canManageMembers = isOrgOwner;
  
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
            <Tabs value={tab} onValueChange={(value) => setTab(value === "repositories" ? null : (value as "members" | "teams" | "settings"))}>
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
                {isOrgOwner && (
                  <TabsTrigger value="settings" className="gap-2">
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
