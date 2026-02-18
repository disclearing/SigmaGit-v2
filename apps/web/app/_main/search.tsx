import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Loader2 } from "lucide-react";
import { useSearch } from "@sigmagit/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchResultsList } from "@/components/search";

export const Route = createFileRoute("/_main/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
    type: (search.type as string) || "all",
  }),
});

const SEARCH_TYPES = [
  { value: "all", label: "All" },
  { value: "repositories", label: "Repositories" },
  { value: "issues", label: "Issues" },
  { value: "pulls", label: "Pull Requests" },
  { value: "users", label: "Users" },
];

function SearchPage() {
  const { q, type: initialType } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [query, setQuery] = useState(q);
  const [type, setType] = useState(initialType);

  const { data, isLoading, isFetching } = useSearch(q, {
    type: type as any,
    limit: 30,
    enabled: q.length >= 2,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate({ search: { q: query, type } });
    }
  }

  function handleTypeChange(newType: string) {
    setType(newType);
    if (q) {
      navigate({ search: { q, type: newType } });
    }
  }

  return (
    <div className="container max-w-[1280px] mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Search</h1>
          <p className="text-muted-foreground">Find repositories, issues, pull requests, and users</p>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search repositories, issues, pull requests, and users..."
                className="pl-10 h-12 text-base"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6" disabled={!query.trim()}>
              Search
            </Button>
          </div>
        </form>

        <div className="flex gap-2 mb-8 flex-wrap">
          {SEARCH_TYPES.map((t) => (
            <Button
              key={t.value}
              variant={type === t.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {q.length < 2 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/30">
            <Search className="size-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">Enter at least 2 characters to search</p>
          </div>
        ) : isLoading || isFetching ? (
          <div className="text-center py-20">
            <Loader2 className="size-8 mx-auto animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Searching...</p>
          </div>
        ) : data?.results && data.results.length > 0 ? (
          <>
            <div className="mb-6 text-sm text-muted-foreground">
              Found {data.results.length} result{data.results.length !== 1 ? "s" : ""} for <span className="font-medium text-foreground">"{q}"</span>
            </div>
            <div className="border border-border rounded-lg bg-card divide-y divide-border">
              <SearchResultsList results={data.results} />
            </div>
          </>
        ) : data?.results && data.results.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/30">
            <Search className="size-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">Try adjusting your search query or filters</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
