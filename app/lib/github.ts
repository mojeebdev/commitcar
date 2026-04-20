// CommitCar — GitHub fetcher
// Uses a server-side PAT so users don't have to connect GitHub.
// Only reads public data.

import type { StatsSnapshot } from './traits';

const GITHUB_API = 'https://api.github.com';

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repos: number;
  created_at: string;
}

interface GitHubRepo {
  name: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
}

interface CommitDateSearchResponse {
  total_count: number;
  items: Array<{
    commit: { author: { date: string } };
  }>;
}

function githubHeaders() {
  const pat = process.env.GITHUB_PAT;
  if (!pat) throw new Error('GITHUB_PAT is not set');
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export function normalizeUsername(input: string): string {
  const trimmed = input.trim();
  // Handle full URLs
  const urlMatch = trimmed.match(/github\.com\/([a-zA-Z0-9-]+)/);
  if (urlMatch) return urlMatch[1];
  // Handle @ prefix
  return trimmed.replace(/^@/, '').replace(/\/$/, '');
}

export async function fetchUser(username: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/users/${username}`, {
    headers: githubHeaders(),
    next: { revalidate: 3600 },
  });
  if (res.status === 404) throw new Error(`GitHub user "${username}" not found`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  while (page < 4) { // cap at ~300 repos to control rate limits
    const res = await fetch(
      `${GITHUB_API}/users/${username}/repos?per_page=100&page=${page}&sort=updated`,
      { headers: githubHeaders(), next: { revalidate: 3600 } }
    );
    if (!res.ok) break;
    const batch: GitHubRepo[] = await res.json();
    if (batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return repos;
}

// Use the commits search API to count user's authored commits in the last 365 days
export async function fetchCommitCount365d(username: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 365);
  const sinceISO = since.toISOString().split('T')[0];

  const q = encodeURIComponent(`author:${username} committer-date:>${sinceISO}`);
  const res = await fetch(`${GITHUB_API}/search/commits?q=${q}&per_page=1`, {
    headers: {
      ...githubHeaders(),
      Accept: 'application/vnd.github.cloak-preview+json',
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return 0;
  const data: CommitDateSearchResponse = await res.json();
  return Math.min(data.total_count, 10000); // cap to prevent absurd numbers
}

// Sample recent commits to detect time-of-day pattern + streak
export async function fetchRecentCommitTimestamps(username: string): Promise<string[]> {
  const q = encodeURIComponent(`author:${username}`);
  const res = await fetch(`${GITHUB_API}/search/commits?q=${q}&sort=author-date&order=desc&per_page=100`, {
    headers: {
      ...githubHeaders(),
      Accept: 'application/vnd.github.cloak-preview+json',
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data: CommitDateSearchResponse = await res.json();
  return data.items.map((i) => i.commit.author.date);
}

function computePeakHour(timestamps: string[]): number {
  if (timestamps.length === 0) return 14; // default sunset
  const bins = new Array(24).fill(0);
  for (const ts of timestamps) {
    const hour = new Date(ts).getUTCHours();
    bins[hour]++;
  }
  let peak = 0;
  for (let i = 1; i < 24; i++) if (bins[i] > bins[peak]) peak = i;
  return peak;
}

function computeLongestStreak(timestamps: string[]): number {
  if (timestamps.length === 0) return 0;
  const days = new Set(timestamps.map((ts) => ts.split('T')[0]));
  const sorted = [...days].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

function computeTopLanguage(repos: GitHubRepo[]): string {
  const counts: Record<string, number> = {};
  for (const r of repos) {
    if (!r.language || r.fork) continue;
    counts[r.language] = (counts[r.language] || 0) + 1;
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return 'Misc';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export async function buildStatsSnapshot(username: string): Promise<{
  user: GitHubUser;
  stats: StatsSnapshot;
}> {
  const user = await fetchUser(username);
  const [repos, commits365d, timestamps] = await Promise.all([
    fetchRepos(username),
    fetchCommitCount365d(username),
    fetchRecentCommitTimestamps(username),
  ]);

  const totalStars = repos.reduce((sum, r) => sum + (r.fork ? 0 : r.stargazers_count), 0);
  const accountAgeYears =
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);

  const stats: StatsSnapshot = {
    commits365d,
    publicRepos: repos.filter((r) => !r.fork).length,
    longestStreak: computeLongestStreak(timestamps),
    totalStars,
    accountAgeYears: Math.round(accountAgeYears * 10) / 10,
    topLanguage: computeTopLanguage(repos),
    peakCommitHour: computePeakHour(timestamps),
  };

  return { user, stats };
}
