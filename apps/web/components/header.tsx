import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";
import { useCurrentUserSummary } from "@sigmagit/hooks";
import { Link, useNavigate, useLocation, useParams } from "@tanstack/react-router";
import { Bell, BookOpen, Inbox, LogOut, Moon, Plus, Settings, Sun, User } from "lucide-react";
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

  const { data: session } = useSession();
  const { data: user } = useCurrentUserSummary(!!session?.user);

  const isRepoPage = location.pathname.match(/\/[^/]+\/[^/]+/);
  const username = params.username as string | undefined;
  const repoName = params.repo as string | undefined;

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-[1280px] mx-auto px-4 flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm group-hover:shadow transition-shadow">
              σ
            </div>
            <span className="text-lg font-semibold tracking-tight hidden sm:inline-block">sigmagit</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {isRepoPage && username && repoName ? (
              <>
                <Link 
                  to="/$username" 
                  params={{ username }} 
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {username}
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link 
                  to="/$username/$repo" 
                  params={{ username, repo: repoName }} 
                  className="text-foreground hover:text-primary transition-colors font-semibold"
                >
                  {repoName}
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/explore" 
                  className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Explore
                </Link>
              </>
            )}
          </nav>

          <div className="flex-1 max-w-xl">
            <SearchBar className="hidden md:block" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {session?.user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => setNewRepoModalOpen(true)}
                title="New repository"
              >
                <Plus className="size-4" />
              </Button>
              <NotificationDropdown />
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8 rounded-full border border-border">
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                        {(user?.name || session.user.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-1">
                  <div className="flex items-center gap-3 px-3 py-3 border-b border-border/50 mb-1">
                    <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
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
                    <DropdownMenuItem asChild className="cursor-pointer rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
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
                    
                    <DropdownMenuItem asChild className="cursor-pointer rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                      <Link to="/settings" className="flex items-center gap-3 w-full">
                        <Settings className="size-4 text-muted-foreground" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="my-1 bg-border/50" />
                  
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-sm px-3 py-2 text-sm text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <NewRepositoryModal open={newRepoModalOpen} onOpenChange={setNewRepoModalOpen} />
    </header>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
    </svg>
  );
}
