'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { docsNav } from '@/lib/docs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-[var(--sidebar-width)] shrink-0 border-r border-border/50 bg-background md:flex md:flex-col">
      <ScrollArea className="h-full py-6 pr-4">
        <div className="space-y-6">
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
                        'flex w-full items-center rounded-lg px-4 py-1.5 text-sm transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        item.disabled && 'pointer-events-none opacity-60',
                      )}
                    >
                      {item.title}
                      {item.label && (
                        <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
