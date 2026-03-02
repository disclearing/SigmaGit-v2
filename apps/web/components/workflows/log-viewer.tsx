'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LogViewerProps {
  logs: string;
  className?: string;
  autoScroll?: boolean;
}

export function LogViewer({ logs, className, autoScroll = false }: LogViewerProps) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (autoScroll && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <pre
      ref={ref}
      className={cn(
        'overflow-auto rounded-md bg-black p-4 text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all',
        className
      )}
    >
      {logs || '(no output)'}
    </pre>
  );
}
