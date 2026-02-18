'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { docsNav } from '@/lib/docs';

interface SearchResult {
  title: string;
  href: string;
  section: string;
}

function getAllPages(): SearchResult[] {
  return docsNav.flatMap((section) =>
    section.items.map((item) => ({
      title: item.title,
      href: item.href,
      section: section.title,
    })),
  );
}

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const router = useRouter();

  const allPages = React.useMemo(() => getAllPages(), []);
  const results = React.useMemo(() => {
    if (!query.trim()) return allPages.slice(0, 8);
    const q = query.toLowerCase();
    return allPages.filter(
      (p) => p.title.toLowerCase().includes(q) || p.section.toLowerCase().includes(q),
    );
  }, [query, allPages]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    setQuery('');
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground md:w-52 lg:w-64"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden md:inline">Search docs...</span>
        <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs md:flex">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-[560px]">
          <div className="flex items-center border-b px-4">
            <Search className="mr-3 size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documentation..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {results.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto py-2">
              {results.map((result) => (
                <button
                  key={result.href}
                  onClick={() => handleSelect(result.href)}
                  className="flex w-full cursor-pointer flex-col items-start px-4 py-2.5 text-left hover:bg-accent"
                >
                  <span className="text-xs text-muted-foreground">{result.section}</span>
                  <span className="text-sm font-medium">{result.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">No results found.</div>
          )}

          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>
              <kbd className="rounded border border-border bg-muted px-1">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1">↵</kbd> open
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1">esc</kbd> close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <button
      onClick={() => setOpen(true)}
      className={cn(
        'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <Search className="size-4" />
      Search...
    </button>
  );
}
