import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";
import { useCurrentUserSummary } from "@sigmagit/hooks";
import { Link, useNavigate, useLocation, useParams } from "@tanstack/react-router";
import { Bell, BookOpen, Inbox, LogOut, Moon, Plus, Settings, Sun, User, FileText, Download, GitBranch, Search, Menu, X } from "lucide-react";
import { useTheme } from "tanstack-theme-kit";
import { NewRepositoryModal } from "@/components/new-repository-modal";
import { SearchBar } from "@/components/search";
import { NotificationDropdown } from "@/components/notifications";

export function Header() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const params = useParams({ strict: false });
  const [newRepoModalOpen, setNewRepoModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: session } = useSession();
  const { data: user } = useCurrentUserSummary(!!session?.user);
  const isAdmin = (session?.user as any)?.role === "admin";

  const isRepoPage = location.pathname.match(/\/[^/]+\/[^/]+/);
  const username = params.username as string | undefined;
  const repoName = params.repo as string | undefined;

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105">
              σ
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:inline-block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              sigmagit
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {isRepoPage && username && repoName ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                <Link
                  to="/$username"
                  params={{ username }}
                  className="text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  {username}
                </Link>
                <span className="text-muted-foreground/50">/</span>
                <Link
                  to="/$username/$repo"
                  params={{ username, repo: repoName }}
                  className="text-foreground hover:text-primary transition-colors font-semibold"
                >
                  {repoName}
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/explore"
                  className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  Explore
                </Link>
                <Link
                  to="/gists"
                  className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  Gists
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex-1 max-w-md hidden md:block">
            <SearchBar className="w-full" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => navigate({ to: "/search" })}
          >
            <Search className="size-5" />
          </Button>

          {session?.user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-lg"
                    title="Create new"
                  >
                    <Plus className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-2">
                  <DropdownMenuItem
                    onClick={() => setNewRepoModalOpen(true)}
                    className="cursor-pointer rounded-lg px-3 py-3"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shrink-0">
                        <GitBranch className="size-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium leading-none">New repository</span>
                        <span className="text-xs text-muted-foreground mt-1">Create a new repository</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-lg px-3 py-3"
                  >
                    <Link to="/new/import" className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400 shrink-0">
                        <Download className="size-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium leading-none">Import repository</span>
                        <span className="text-xs text-muted-foreground mt-1">Import from GitHub, GitLab, etc.</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <NotificationDropdown />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle theme"
                className="rounded-lg"
              >
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0 ml-1">
                    <Avatar className="h-9 w-9" size="sm">
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-muted to-muted/50 text-muted-foreground font-semibold text-sm">
                        {(user?.name || session.user.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <div className="flex items-center gap-3 px-3 py-3 border-b border-border/50 mb-2">
                    <Avatar className="h-10 w-10" size="default">
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-muted to-muted/50 text-muted-foreground font-semibold">
                        {(user?.name || session.user.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-semibold truncate leading-none mb-1">
                        {user?.name || session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{(session.user as { username?: string }).username}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5">
                      <Link
                        to="/$username"
                        params={{
                          username: (session.user as { username?: string }).username || "",
                        }}
                        className="flex items-center gap-3 w-full"
                      >
                        <User className="size-4 text-muted-foreground" />
                        <span>Your profile</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5">
                      <Link to="/settings" className="flex items-center gap-3 w-full">
                        <Settings className="size-4 text-muted-foreground" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-lg px-3 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-3"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle theme"
                className="rounded-lg"
              >
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-lg">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="rounded-lg">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <nav className="container py-4 flex flex-col gap-2">
            <Link
              to="/explore"
              className="px-4 py-3 rounded-xl text-foreground hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              to="/gists"
              className="px-4 py-3 rounded-xl text-foreground hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Gists
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-3 rounded-xl text-foreground hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      )}

      <NewRepositoryModal open={newRepoModalOpen} onOpenChange={setNewRepoModalOpen} />
    </header>
  );
}
