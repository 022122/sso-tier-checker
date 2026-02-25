// deno-lint-ignore-file no-explicit-any
/**
 * SSO Token 分级测试工具 (Deno 版)
 *
 * 用法：
 *   deno run --allow-net --allow-read --allow-env main.ts
 *
 * Deno Deploy: 直接部署此仓库即可
 */

const PORT = parseInt(Deno.env.get("PORT") ?? "8899", 10);
const PROXY = Deno.env.get("PROXY") ?? "";
const RATE_LIMITS_API = "https://grok.com/rest/rate-limits";
const HEAVY_THRESHOLD = 41;
const SUPER_THRESHOLD = 9;

// 读取同目录下的 page.html
const pageHtml = await Deno.readTextFile(new URL("./page.html", import.meta.url));

function classify(remaining: number | null): string {
  if (remaining === null || remaining === undefined) return "unknown";
  if (remaining >= HEAVY_THRESHOLD) return "heavy";
  if (remaining >= SUPER_THRESHOLD) return "super";
  return "basic";
}

function mask(token: string): string {
  if (token.length > 20) return `${token.slice(0, 8)}...${token.slice(-8)}`;
  return token.length > 4 ? token.slice(0, 4) + "..." : token;
}

function buildHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Cookie": `sso=${token}; sso-rw=${token}`,
    "Origin": "https://grok.com",
    "Referer": "https://grok.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  };
}

interface CheckResult {
  tier: string;
  ok: boolean;
  error: string;
  ms: number;
  remaining: number | null;
  token: string;
  masked: string;
}

async function checkOne(token: string): Promise<CheckResult> {
  const t0 = performance.now();
  try {
    const payload = JSON.stringify({
      requestKind: "DEFAULT",
      modelName: "grok-4-1-thinking-1129",
    });

    const fetchOptions: any = {
      method: "POST",
      headers: buildHeaders(token),
      body: payload,
    };

    // Deno 本地支持代理（Deploy 上不可用）
    let client: any;
    if (PROXY && typeof (Deno as any).createHttpClient === "function") {
      client = (Deno as any).createHttpClient({ proxy: { url: PROXY } });
      fetchOptions.client = client;
    }

    const response = await fetch(RATE_LIMITS_API, fetchOptions);
    const ms = Math.round(performance.now() - t0);
    if (client) client.close();

    if (response.status !== 200) {
      return { tier: "unknown", ok: false, error: `HTTP ${response.status}`, ms, remaining: null, token, masked: mask(token) };
    }

    const data = await response.json();
    const remaining: number | null = data.remainingQueries ?? data.remainingTokens ?? null;
    return { tier: classify(remaining), ok: true, error: "", ms, remaining, token, masked: mask(token) };
  } catch (e: any) {
    const ms = Math.round(performance.now() - t0);
    let err = String(e?.message ?? e);
    if (err.length > 200) err = err.slice(0, 200) + "...";
    return { tier: "unknown", ok: false, error: err, ms, remaining: null, token, masked: mask(token) };
  }
}

function parseTokens(raw: string[] | string): string[] {
  if (typeof raw === "string") {
    raw = raw.replace(/,/g, "\n").split("\n").map((t: string) => t.trim());
  }
  const tokens: string[] = [];
  for (let t of raw) {
    t = t.trim();
    if (!t) continue;
    if (t.startsWith("sso=")) t = t.slice(4);
    tokens.push(t);
  }
  // 去重
  return [...new Set(tokens)];
}

async function handleApiTest(req: Request): Promise<Response> {
  const body = await req.json();
  const tokens = parseTokens(body.tokens || []);
  if (!tokens.length) {
    return Response.json({ detail: "No tokens provided" }, { status: 400 });
  }

  const results: CheckResult[] = [];
  const counts: Record<string, number> = { heavy: 0, super: 0, basic: 0, unknown: 0 };

  for (const token of tokens) {
    const result = await checkOne(token);
    results.push(result);
    const tier = result.tier;
    counts[tier] = (counts[tier] || 0) + 1;
  }

  return Response.json({
    summary: { total: tokens.length, ...counts },
    results,
  });
}

function handler(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/" && req.method === "GET") {
    return new Response(pageHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (url.pathname === "/api/test" && req.method === "POST") {
    return handleApiTest(req);
  }

  return new Response("Not Found", { status: 404 });
}

console.log(`\n  SSO Token 分级测试工具 (Deno)`);
console.log(`  打开浏览器访问: http://localhost:${PORT}\n`);

Deno.serve({ port: PORT }, handler);