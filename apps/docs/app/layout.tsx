import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Sigmagit Docs',
    template: '%s | Sigmagit Docs',
  },
  description: 'Official documentation for Sigmagit — the open-source Git hosting platform.',
  keywords: ['sigmagit', 'git', 'self-hosted', 'documentation', 'open-source'],
  authors: [{ name: 'Sigmagit Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://docs.sigmagit.com',
    title: 'Sigmagit Docs',
    description: 'Official documentation for Sigmagit — the open-source Git hosting platform.',
    siteName: 'Sigmagit Docs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sigmagit Docs',
    description: 'Official documentation for Sigmagit — the open-source Git hosting platform.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
