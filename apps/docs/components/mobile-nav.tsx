'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, GitBranch } from 'lucide-react';
import { docsNav } from '@/lib/docs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg hover:bg-muted/50 md:hidden transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-[280px] bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-sm shadow-sm">
                  σ
                </div>
                <span className="font-semibold">Docs</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <ScrollArea className="h-[calc(100vh-57px)]">
              <div className="space-y-6 py-6 pr-4">
                {docsNav.map((section) => (
                  <div key={section.title}>
                    <h4 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.title}
                    </h4>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.disabled ? '#' : item.href}
                            className={cn(
                              'flex w-full items-center rounded-lg px-4 py-2 text-sm transition-all duration-200',
                              isActive
                                ? 'bg-primary/10 font-medium text-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                            )}
                          >
                            {item.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  );
}
