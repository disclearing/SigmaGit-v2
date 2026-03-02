import type { RepositoryWithStars } from "@sigmagit/hooks";
import RepositoryCard from "@/components/repository-card";

type Repository = RepositoryWithStars & {
  updatedAt: Date | string;
  language?: string;
};

export function RepoList({ repos }: { repos: Array<Repository> }) {
  return (
    <div className="divide-y divide-border border-t border-border">
      {repos.map((repo) => (
        <RepositoryCard key={repo.id} repository={repo} showOwner={false} />
      ))}
    </div>
  );
}
