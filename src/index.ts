#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://newsapi.org/v2";
const RATE_LIMIT_MS = 500;
let last = 0;

function getKey(): string {
  const k = process.env.NEWSAPI_KEY;
  if (!k) throw new Error("NEWSAPI_KEY required. Free at https://newsapi.org/register");
  return k;
}

async function newsFetch(path: string, params: URLSearchParams): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  params.set("apiKey", getKey());
  const res = await fetch(`${BASE}${path}?${params}`);
  if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
  return res.json();
}

const server = new McpServer({ name: "mcp-newsapi", version: "1.0.0" });

server.tool("get_headlines", "Get top headlines.", {
  country: z.string().optional().describe("2-letter country code (e.g. 'us', 'gb')"),
  category: z.enum(["business", "entertainment", "general", "health", "science", "sports", "technology"]).optional(),
  query: z.string().optional(),
  pageSize: z.number().min(1).max(100).default(10),
}, async ({ country, category, query, pageSize }) => {
  const p = new URLSearchParams({ pageSize: String(pageSize) });
  if (country) p.set("country", country);
  if (category) p.set("category", category);
  if (query) p.set("q", query);
  if (!country && !category && !query) p.set("country", "us");
  const d = await newsFetch("/top-headlines", p);
  const articles = d.articles?.map((a: any) => ({
    title: a.title, source: a.source?.name, author: a.author,
    description: a.description?.slice(0, 200), url: a.url, publishedAt: a.publishedAt,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.totalResults, articles }, null, 2) }] };
});

server.tool("search_news", "Search news articles.", {
  query: z.string(), language: z.string().default("en"),
  sortBy: z.enum(["relevancy", "popularity", "publishedAt"]).default("publishedAt"),
  from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  to: z.string().optional().describe("End date (YYYY-MM-DD)"),
  pageSize: z.number().min(1).max(100).default(10),
}, async ({ query, language, sortBy, from, to, pageSize }) => {
  const p = new URLSearchParams({ q: query, language, sortBy, pageSize: String(pageSize) });
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const d = await newsFetch("/everything", p);
  const articles = d.articles?.map((a: any) => ({
    title: a.title, source: a.source?.name, description: a.description?.slice(0, 200),
    url: a.url, publishedAt: a.publishedAt,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.totalResults, articles }, null, 2) }] };
});

server.tool("get_sources", "List available news sources.", {
  category: z.enum(["business", "entertainment", "general", "health", "science", "sports", "technology"]).optional(),
  language: z.string().optional(), country: z.string().optional(),
}, async ({ category, language, country }) => {
  const p = new URLSearchParams();
  if (category) p.set("category", category);
  if (language) p.set("language", language);
  if (country) p.set("country", country);
  const d = await newsFetch("/top-headlines/sources", p);
  const sources = d.sources?.map((s: any) => ({
    id: s.id, name: s.name, description: s.description?.slice(0, 150), url: s.url,
    category: s.category, language: s.language, country: s.country,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify(sources, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
