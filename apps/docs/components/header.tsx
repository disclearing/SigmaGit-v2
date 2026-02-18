import Link from 'next/link';
import { Github, ExternalLink } from 'lucide-react';
import { SearchDialog } from '@/components/search';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/mobile-nav';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-2 shrink-0">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            σ
          </div>
          <span className="hidden font-semibold sm:inline-block">sigmagit</span>
          <span className="hidden text-muted-foreground sm:inline-block">/</span>
          <span className="hidden text-muted-foreground sm:inline-block text-sm">docs</span>
        </Link>

        {/* Mobile nav toggle */}
        <MobileNav />

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link
            href="/docs"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Documentation
          </Link>
          <Link
            href="/docs/api"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            API
          </Link>
          <Link
            href="/docs/self-hosting"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Self Hosting
          </Link>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <SearchDialog />
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/sigmagit/sigmagit"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github className="size-4" />
              </a>
            </Button>
            <ThemeToggle />
          </div>
          <ThemeToggle />
          <Button asChild size="sm" className="hidden md:flex">
            <a href="https://sigmagit.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              sigmagit.com
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
