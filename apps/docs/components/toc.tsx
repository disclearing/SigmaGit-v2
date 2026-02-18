'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items?: TocItem[];
}

export function TableOfContents({ items = [] }: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>('');

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0% -70% 0%' },
    );

    const headings = document.querySelectorAll('h2[id], h3[id]');
    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="hidden xl:block">
      <div className="sticky top-20 w-56 space-y-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </p>
        <ul className="space-y-1 text-sm">
          {items.map((item) => (
            <li key={item.id} style={{ paddingLeft: item.level === 3 ? '0.75rem' : '0' }}>
              <a
                href={`#${item.id}`}
                className={cn(
                  'block py-0.5 text-muted-foreground transition-colors hover:text-foreground',
                  activeId === item.id && 'font-medium text-foreground',
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
