"use client";

import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminUsers, useDeleteAdminUser, useUpdateAdminUser } from "@sigmagit/hooks";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  Shield,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/admin/users/")({
  head: () => ({
    meta: [
      { title: "Users | Admin Panel | Sigmagit" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsers,
});

const roleConfig = {
  admin: { color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Shield },
  moderator: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Shield },
  user: { color: "bg-muted text-muted-foreground", icon: User },
};

function AdminUsers() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const roleFilter = role === "all" ? undefined : role;
  const { data, isLoading, error } = useAdminUsers(search, roleFilter, limit, page * limit);
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
    await updateUser.mutateAsync({ id: userId, data: { role: newRole } });
      toast.success(`User role updated to ${newRole}`);
    } catch {
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete user @${username}? This action cannot be undone.`)) {
      try {
      await deleteUser.mutateAsync(userId);
        toast.success(`User @${username} deleted`);
      } catch {
        toast.error("Failed to delete user");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-40" />
            </div>
            <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
            ))}
          </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="size-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <XCircle className="size-10 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">Error loading users</h3>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage {data?.users.length || 0} platform users, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
                placeholder="Search by name, username, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
                className="pl-10 h-12"
          />
        </div>
            <div className="flex gap-2">
        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value);
            setPage(0);
          }}
        >
                <SelectTrigger className="w-44 h-12">
                  <Filter className="size-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User List</CardTitle>
              <CardDescription>
                Showing {data?.users.length || 0} users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px]">
            <thead>
                <tr className="bg-muted/50 border-b border-border">
                <th className="text-left p-4 font-semibold text-sm">User</th>
                <th className="text-left p-4 font-semibold text-sm">Email</th>
                <th className="text-left p-4 font-semibold text-sm">Role</th>
                <th className="text-left p-4 font-semibold text-sm">Joined</th>
                <th className="text-right p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-border">
              {data?.users && data.users.length > 0 ? (
                  data.users.map((user) => {
                    const roleStyle = roleConfig[user.role as keyof typeof roleConfig];
                    const RoleIcon = roleStyle.icon;
                    return (
                      <tr key={user.id} className="hover:bg-accent/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-muted to-muted/50">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                        <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                          <Badge
                            variant="outline"
                            className={cn("gap-1.5 font-medium", roleStyle.color)}
                          >
                            <RoleIcon className="size-3" />
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/users/${user.id}`}>
                              <Button variant="ghost" size="icon" className="size-9">
                                <Eye className="size-4" />
                          </Button>
                        </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-9">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="gap-2">
                                  <Eye className="size-4" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Change Role
                                </div>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(user.id, "user")}
                                  className={cn(user.role === "user" && "bg-accent")}
                        >
                                  <User className="size-4 mr-2" />
                                  User
                                  {user.role === "user" && <CheckCircle2 className="size-3 ml-auto" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(user.id, "moderator")}
                                  className={cn(user.role === "moderator" && "bg-accent")}
                                >
                                  <Shield className="size-4 mr-2" />
                                  Moderator
                                  {user.role === "moderator" && <CheckCircle2 className="size-3 ml-auto" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(user.id, "admin")}
                                  className={cn(user.role === "admin" && "bg-accent")}
                                >
                                  <Shield className="size-4 mr-2" />
                                  Admin
                                  {user.role === "admin" && <CheckCircle2 className="size-3 ml-auto" />}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id, user.username)}
                                  className="text-destructive focus:text-destructive gap-2"
                        >
                                  <Trash2 className="size-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                          <Users className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">No users found</p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>

      {/* Pagination */}
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
          <span className="text-sm text-muted-foreground">
            Page {page + 1}
            {data.hasMore && " of more"}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => (data.hasMore ? p + 1 : p))}
            disabled={!data.hasMore}
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
