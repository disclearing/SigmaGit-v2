import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, Loader2, Plus } from "lucide-react";
import { useProjects, useCreateProject } from "@sigmagit/hooks";
import { formatRelativeTime } from "@sigmagit/lib";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_main/$username/$repo/projects/")({
  component: ProjectsListPage,
});

function ProjectsListPage() {
  const { username, repo } = Route.useParams();
  const { data, isLoading } = useProjects(username, repo);
  const createProject = useCreateProject(username, repo);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const projects = data?.projects || [];

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();

    if (!newProjectName.trim()) return;

    try {
      await createProject.mutateAsync({ name: newProjectName });
      toast.success("Project created");
      setNewProjectName("");
      setIsDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    }
  }

  return (
    <div className="container max-w-[1280px] mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Projects</h1>
            <p className="text-muted-foreground">Organize your work with project boards</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project name</Label>
                  <Input
                    id="name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Project"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProject.isPending || !newProjectName.trim()}>
                    {createProject.isPending ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create project"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="size-8 mx-auto animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/30">
          <LayoutGrid className="size-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground mb-6">
            Create a project board to organize your work.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Create a project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/$username/$repo/projects/$projectId"
              params={{ username, repo, projectId: project.id }}
              className="block p-6 border border-border rounded-lg bg-card hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted">
                  <LayoutGrid className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Created {formatRelativeTime(project.createdAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
