import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminUsers, useUpdateAdminUser, useDeleteAdminUser } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_main/admin/users/")({
  head: () => ({
    meta: [
      { title: "Users | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "Manage platform users, roles, permissions, and user accounts.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Users | Admin Panel | Sigmagit" },
      {
        property: "og:description",
        content: "Manage platform users, roles, permissions, and user accounts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Users | Admin Panel | Sigmagit" },
      {
        name: "twitter:description",
        content: "Manage platform users, roles, permissions, and user accounts.",
      },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useAdminUsers(search, role, limit, page * limit);
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await updateUser.mutateAsync({ id: userId, data: { role: newRole } });
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete user @${username}?`)) {
      await deleteUser.mutateAsync(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive text-lg font-semibold">Error loading users</div>
        <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-2">Manage platform users, roles, and permissions</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-sm">User</th>
                <th className="text-left p-4 font-semibold text-sm">Email</th>
                <th className="text-left p-4 font-semibold text-sm">Role</th>
                <th className="text-left p-4 font-semibold text-sm">Joined</th>
                <th className="text-right p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users && data.users.length > 0 ? (
                data.users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback className="text-sm">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{user.email}</td>
                    <td className="p-4">
                      <Badge variant={user.role === "admin" ? "default" : user.role === "moderator" ? "secondary" : "outline"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/users/${user.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="size-3" />
                            View
                          </Button>
                        </Link>
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) => handleUpdateRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="gap-2"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="text-muted-foreground">No users found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {data && data.users.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => (data?.hasMore ? p + 1 : p))}
            disabled={!data?.hasMore}
            className="gap-2"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
