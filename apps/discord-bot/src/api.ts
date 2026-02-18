interface SigmagitApiResponse<T> {
  data?: T;
  error?: string;
}

// @ts-ignore - Discord.js v14 type definitions have some inconsistencies
interface Repository {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  starCount: number;
  starred: boolean;
  forkCount: number;
}

interface Issue {
  id: string;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  labels: Label[];
  assignees: Assignee[];
}

interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    name: string;
  avatarUrl: string | null;
  };
  baseRepo: {
    id: string;
    name: string;
  };
  headRepo: {
    id: string;
    name: string;
  };
}

interface Label {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

interface Assignee {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

interface Commit {
  oid: string;
  message: string;
  author: {
    name: string;
    email: string;
    username?: string;
    avatarUrl?: string | null;
  };
  timestamp: number;
}

export class SigmagitApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<SigmagitApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || `HTTP ${response.status}` };
      }

      return { data };
    } catch (error) {
      console.error('[API] Request failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getRepository(owner: string, name: string): Promise<SigmagitApiResponse<{ repo: Repository; isOwner: boolean }>> {
    return this.fetch(`/api/repositories/${owner}/${name}`);
  }

  async getRepositoryWithStars(owner: string, name: string): Promise<SigmagitApiResponse<Repository>> {
    return this.fetch(`/api/repositories/${owner}/${name}/with-stars`);
  }

  async getRepositoryForks(owner: string, name: string, limit = 20, offset = 0): Promise<SigmagitApiResponse<{ forks: Repository[] }>> {
    return this.fetch(`/api/repositories/${owner}/${name}/forks?limit=${limit}&offset=${offset}`);
  }

  async getIssue(owner: string, repo: string, number: number): Promise<SigmagitApiResponse<Issue>> {
    return this.fetch(`/api/repositories/${owner}/${repo}/issues/${number}`);
  }

  async getPullRequest(owner: string, repo: string, number: number): Promise<SigmagitApiResponse<PullRequest>> {
    return this.fetch(`/api/repositories/${owner}/${repo}/pulls/${number}`);
  }

  async getCommits(owner: string, repo: string, branch = 'main', limit = 10, skip = 0): Promise<SigmagitApiResponse<{ commits: Commit[]; hasMore: boolean }>> {
    return this.fetch(`/api/repositories/${owner}/${repo}/commits?branch=${branch}&limit=${limit}&skip=${skip}`);
  }

  async searchRepositories(query: string, limit = 10, offset = 0): Promise<SigmagitApiResponse<{ results: any[]; hasMore: boolean }>> {
    return this.fetch(`/api/search?q=${encodeURIComponent(query)}&type=repositories&limit=${limit}&offset=${offset}`);
  }

  async getIssues(owner: string, repo: string, state: 'open' | 'closed' = 'open', limit = 30, offset = 0): Promise<SigmagitApiResponse<{ issues: Issue[]; hasMore: boolean }>> {
    return this.fetch(`/api/repositories/${owner}/${repo}/issues?state=${state}&limit=${limit}&offset=${offset}`);
  }

  async getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open', limit = 30, offset = 0): Promise<SigmagitApiResponse<{ pullRequests: PullRequest[]; hasMore: boolean }>> {
    return this.fetch(`/api/repositories/${owner}/${repo}/pulls?state=${state}&limit=${limit}&offset=${offset}`);
  }

  async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]): Promise<SigmagitApiResponse<Issue>> {
    return this.fetch(`/api/repositories/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body, labels }),
    });
  }

  async createPullRequest(owner: string, repo: string, title: string, headRepo: string, headBranch: string, baseBranch: string, body?: string): Promise<SigmagitApiResponse<PullRequest>> {
    return this.fetch(`/api/repositories/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title, headRepo, headBranch, baseBranch, body }),
    });
  }

  async forkRepository(owner: string, repo: string, name?: string, description?: string): Promise<SigmagitApiResponse<{ repo: Repository; isOwner: boolean }>> {
    return this.fetch(`/api/repositories/${owner}/${repo}/fork`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }
}
