import * as React from 'react';
import Link from 'next/link';
import type { MDXComponents } from 'mdx/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function Callout({
  children,
  type = 'info',
}: {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'danger' | 'success';
}) {
  const styles = {
    info: 'border-blue-500/30 bg-blue-500/5 text-blue-900 dark:text-blue-300',
    warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-900 dark:text-yellow-300',
    danger: 'border-red-500/30 bg-red-500/5 text-red-900 dark:text-red-300',
    success: 'border-green-500/30 bg-green-500/5 text-green-900 dark:text-green-300',
  };
  return (
    <div className={cn('my-4 rounded-lg border px-4 py-3 text-sm', styles[type])}>
      {children}
    </div>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return <div className="[&>h3]:step ml-4 space-y-4 border-l pl-6 [counter-reset:step]">{children}</div>;
}

export const CustomMDXComponents: MDXComponents = {
  // Headings
  h1: ({ className, ...props }) => (
    <h1 className={cn('mt-2 scroll-m-20 text-4xl font-bold tracking-tight', className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        'mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn('mt-8 scroll-m-20 text-xl font-semibold tracking-tight', className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn('mt-6 scroll-m-20 text-lg font-semibold tracking-tight', className)}
      {...props}
    />
  ),

  // Paragraphs
  p: ({ className, ...props }) => (
    <p className={cn('leading-7 [&:not(:first-child)]:mt-4', className)} {...props} />
  ),

  // Links
  a: ({ className, href, ...props }) => {
    const isExternal = href?.startsWith('http');
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('font-medium text-primary underline underline-offset-4 hover:text-primary/80', className)}
          {...props}
        />
      );
    }
    return (
      <Link
        href={href ?? '#'}
        className={cn('font-medium text-primary underline underline-offset-4 hover:text-primary/80', className)}
        {...props}
      />
    );
  },

  // Lists
  ul: ({ className, ...props }) => (
    <ul className={cn('my-4 ml-6 list-disc [&>li]:mt-2', className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn('my-4 ml-6 list-decimal [&>li]:mt-2', className)} {...props} />
  ),
  li: ({ className, ...props }) => <li className={cn('text-sm leading-7', className)} {...props} />,

  // Code
  code: ({ className, ...props }) => (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre className={cn('my-4 overflow-x-auto rounded-lg border bg-muted/50 py-4', className)} {...props} />
  ),

  // Blockquote
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn('mt-4 border-l-4 border-primary/40 pl-4 italic text-muted-foreground', className)}
      {...props}
    />
  ),

  // Table
  table: ({ className, ...props }) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }) => (
    <tr className={cn('m-0 border-t p-0 even:bg-muted/50', className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        'border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        'border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),

  // HR
  hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,

  // Custom components
  Callout,
  Steps,
  Badge,
};
