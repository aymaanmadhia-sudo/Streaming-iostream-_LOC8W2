import { NextRequest, NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

/**
 * Parse owner/repo from GitHub URL.
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (!/^(https?:\/\/)?(www\.)?github\.com$/i.test(u.origin)) return null;
    const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts.length >= 2) {
      const [owner, repo] = parts;
      if (owner && repo && !repo.includes(".")) return { owner, repo };
    }
    return null;
  } catch {
    return null;
  }
}

export type GitHubVerifyResponse =
  | { ok: true; repo: string; owner: string; createdAt: string; commits: number; contributors: number }
  | { ok: false; error: string };

/**
 * POST: Verify a GitHub repository URL. Uses GITHUB_TOKEN from env when set.
 */
export async function POST(request: NextRequest): Promise<NextResponse<GitHubVerifyResponse>> {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "Invalid GitHub repository URL" },
      { status: 400 }
    );
  }
  const { owner, repo } = parsed;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Hackathon360",
  };
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  try {
    const [repoRes, commitsRes, contributorsRes] = await Promise.all([
      fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers }),
      fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=1`, { headers }),
      fetch(`${GITHUB_API}/repos/${owner}/${repo}/contributors?per_page=1`, { headers }),
    ]);

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return NextResponse.json({ ok: false, error: "Repository not found" }, { status: 404 });
      }
      const msg = (await repoRes.json().catch(() => ({}))).message ?? repoRes.statusText;
      return NextResponse.json({ ok: false, error: msg }, { status: repoRes.status });
    }

    const repoData = await repoRes.json();
    const createdAt = repoData.created_at ?? "";

    let commits = 0;
    if (commitsRes.ok) {
      const link = commitsRes.headers.get("Link");
      const lastMatch = link?.match(/<[^>]+page=(\d+)>;\s*rel="last"/);
      commits = lastMatch ? parseInt(lastMatch[1], 10) : (await commitsRes.json()).length;
    }

    let contributors = 0;
    if (contributorsRes.ok) {
      const link = contributorsRes.headers.get("Link");
      const lastMatch = link?.match(/<[^>]+page=(\d+)>;\s*rel="last"/);
      contributors = lastMatch ? parseInt(lastMatch[1], 10) : (await contributorsRes.json()).length;
    }

    return NextResponse.json({
      ok: true,
      repo,
      owner,
      createdAt,
      commits,
      contributors,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "GitHub API error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
