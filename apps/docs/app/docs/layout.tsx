import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 md:pl-[var(--sidebar-width)]">
          <div className="mx-auto max-w-5xl px-6 py-12">{children}</div>
        </main>
      </div>
    </div>
  );
}
