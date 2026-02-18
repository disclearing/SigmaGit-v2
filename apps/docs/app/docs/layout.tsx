import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 md:pl-[var(--sidebar-width)]">
          <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
