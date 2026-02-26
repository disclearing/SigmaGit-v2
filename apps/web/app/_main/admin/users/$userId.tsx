import { createFileRoute } from "@tanstack/react-router";
import { useAdminUser, useUpdateAdminUser } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/admin/users/$userId")({
  head: () => ({
    meta: [
      { title: "User Details | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "View and manage user account details, roles, and permissions.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "User Details | Admin Panel | Sigmagit" },
      {
        property: "og:description",
        content: "View and manage user account details, roles, and permissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "User Details | Admin Panel | Sigmagit" },
      {
        name: "twitter:description",
        content: "View and manage user account details, roles, and permissions.",
      },
    ],
  }),
  component: AdminUserDetail,
});

function AdminUserDetail() {
  const { userId } = Route.useParams();
  const { data: user, isLoading, error } = useAdminUser(userId);
  const updateUser = useUpdateAdminUser();

  const handleUpdateRole = async (newRole: string) => {
    await updateUser.mutateAsync({ id: userId, data: { role: newRole } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading user...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading user</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <p className="mt-1">@{user.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="mt-2">
                  <Select
                    defaultValue={user.role}
                    onValueChange={handleUpdateRole}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                <div className="mt-1">
                  <Badge variant={user.emailVerified ? "default" : "secondary"}>
                    {user.emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              {user.bio && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                  <p className="mt-1">{user.bio}</p>
                </div>
              )}
              {user.location && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="mt-1">{user.location}</p>
                </div>
              )}
              {user.website && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Website</label>
                  <p className="mt-1">
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {user.website}
                    </a>
                  </p>
                </div>
              )}
              {user.company && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <p className="mt-1">{user.company}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Repositories</label>
                <p className="mt-1 text-2xl font-bold">{user.repoCount || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Joined</label>
                <p className="mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              {user.lastActiveAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Active</label>
                  <p className="mt-1">{new Date(user.lastActiveAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Default Repository Visibility</label>
                <div className="mt-1">
                  <Badge variant={user.defaultRepositoryVisibility === "public" ? "default" : "secondary"}>
                    {user.defaultRepositoryVisibility}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Git Email</label>
                <p className="mt-1">{user.gitEmail || "Not set"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
