export interface NavItem {
  title: string;
  href: string;
  label?: string;
  disabled?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNav: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Quick Start', href: '/docs/quick-start' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Configuration', href: '/docs/configuration' },
    ],
  },
  {
    title: 'Core Features',
    items: [
      { title: 'Repositories', href: '/docs/features/repositories' },
      { title: 'Issues', href: '/docs/features/issues' },
      { title: 'Pull Requests', href: '/docs/features/pull-requests' },
      { title: 'Discussions', href: '/docs/features/discussions' },
      { title: 'Projects', href: '/docs/features/projects' },
      { title: 'Labels', href: '/docs/features/labels' },
      { title: 'Discord Bot', href: '/docs/features/discord-bot' },
      { title: 'Webhooks', href: '/docs/features/webhooks' },
      { title: 'Account Linking', href: '/docs/features/account-linking' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'Overview', href: '/docs/api' },
      { title: 'Authentication', href: '/docs/api/authentication' },
      { title: 'Repositories', href: '/docs/api/repositories' },
      { title: 'Issues', href: '/docs/api/issues' },
      { title: 'Discord', href: '/docs/api/discord' },
    ],
  },
  {
    title: 'Self Hosting',
    items: [
      { title: 'Overview', href: '/docs/self-hosting' },
      { title: 'Docker', href: '/docs/self-hosting/docker' },
      { title: 'VPS Deployment', href: '/docs/self-hosting/vps' },
      { title: 'Database Setup', href: '/docs/self-hosting/database' },
      { title: 'Storage (S3)', href: '/docs/self-hosting/storage' },
    ],
  },
  {
    title: 'Contributing',
    items: [
      { title: 'Development Setup', href: '/docs/contributing' },
      { title: 'Code Style', href: '/docs/contributing/code-style' },
    ],
  },
];
