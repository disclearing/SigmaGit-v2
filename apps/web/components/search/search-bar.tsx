import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Loader2 } from "lucide-react";
import { useSearch } from "@sigmagit/hooks";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useSearch(query, { enabled: isOpen && query.length >= 2 });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === "/" || (e.metaKey && e.key === "k")) && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate({ to: "/search", search: { q: query } });
      setIsOpen(false);
    }
  }

  function handleResultClick(url: string) {
    navigate({ to: url });
    setIsOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search or jump to... (/ or ⌘K)"
            className="pl-9 pr-8 py-1.5 w-full max-w-xl bg-muted/50 border-border focus-visible:ring-2"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </form>

      {isOpen && query.length >= 2 && data?.results && data.results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-popover border border-border shadow-lg max-h-96 overflow-y-auto z-50">
          {data.results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result.url)}
              className="w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs text-muted-foreground uppercase shrink-0 mt-0.5">
                  {result.type.replace("_", " ")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{result.title}</div>
                  {result.description && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {result.description}
                    </div>
                  )}
                  {result.repository && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {result.repository.owner}/{result.repository.name}
                      {result.number && ` #${result.number}`}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => handleSubmit({ preventDefault: () => { } } as React.FormEvent)}
            className="w-full p-3 text-left hover:bg-muted/50 text-sm text-primary"
          >
            See all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
}
