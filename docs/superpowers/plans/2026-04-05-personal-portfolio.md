# Personal Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Astro blog starter boilerplate with a minimal single-page portfolio for Cory McDonald, featuring an aggregated GitHub contributions graph across 3 work GitHub accounts.

**Architecture:** Single-page Astro 5 site on Cloudflare Workers. Homepage renders hero, bio, experience timeline, and a server-rendered SVG contributions graph. Graph data is fetched at request time from GitHub's GraphQL API (3 users, merged), cached 24h via Cloudflare Cache API. No client-side JavaScript.

**Tech Stack:** Astro 5, TypeScript, Cloudflare Workers, GitHub GraphQL API v4, Vitest (tests)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/consts.ts` | Modify | Site title + description constants |
| `src/styles/global.css` | Rewrite | Minimal typography, layout, dark mode, graph color tokens |
| `src/components/BaseHead.astro` | Modify | Remove font preloads, remove default OG image |
| `src/lib/github.ts` | Create | Types, GraphQL query, `aggregateCalendars()` pure fn, `getAggregatedContributions()` cached fetcher |
| `src/lib/github.test.ts` | Create | Unit tests for `aggregateCalendars()` |
| `src/components/ContributionsGraph.astro` | Create | Server-rendered SVG calendar grid |
| `src/components/Experience.astro` | Create | Timeline of work experience |
| `src/components/Footer.astro` | Rewrite | Links footer (email, LinkedIn, resume, GitHub accounts) |
| `src/pages/index.astro` | Rewrite | Single-page homepage composing all sections |
| `astro.config.mjs` | Modify | Remove mdx/rss integrations, set site URL |
| `package.json` | Modify | Remove mdx/rss deps, add vitest, add test script |
| `wrangler.json` | No change | Already configured correctly |
| `src/env.d.ts` | No change | Runtime type already set up |

**Files to delete** (Task 1): `src/pages/about.astro`, `src/pages/blog/` (directory), `src/pages/rss.xml.js`, `src/content/blog/` (directory), `src/content.config.ts`, `src/layouts/BlogPost.astro`, `src/components/FormattedDate.astro`, `src/components/Header.astro`, `src/components/HeaderLink.astro`, `public/blog-placeholder-*.jpg`, `public/fonts/` (Atkinson fonts no longer used)

---

### Task 1: Remove boilerplate files and dependencies

**Files:**
- Delete: `src/pages/about.astro`, `src/pages/blog/`, `src/pages/rss.xml.js`, `src/content/blog/`, `src/content.config.ts`, `src/layouts/BlogPost.astro`, `src/components/FormattedDate.astro`, `src/components/Header.astro`, `src/components/HeaderLink.astro`, `public/blog-placeholder-*.jpg`, `public/fonts/`
- Modify: `package.json`, `astro.config.mjs`, `src/consts.ts`, `src/components/BaseHead.astro`

- [ ] **Step 1: Delete all boilerplate files**

```bash
rm src/pages/about.astro
rm src/pages/rss.xml.js
rm -rf src/pages/blog
rm -rf src/content/blog
rm src/content.config.ts
rm src/layouts/BlogPost.astro
rm src/components/FormattedDate.astro
rm src/components/Header.astro
rm src/components/HeaderLink.astro
rm public/blog-placeholder-*.jpg
rm -rf public/fonts
```

- [ ] **Step 2: Remove mdx and rss from astro.config.mjs**

Replace the entire file with:

```js
// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://corywmcdonald.com",
  integrations: [sitemap()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
```

- [ ] **Step 3: Update src/consts.ts**

Replace the entire file with:

```ts
export const SITE_TITLE = "Cory McDonald";
export const SITE_DESCRIPTION =
  "Software Engineering Leader building high-scale distributed systems across subscription and payment infrastructure.";
```

- [ ] **Step 4: Update src/components/BaseHead.astro**

Replace the entire file with:

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const { title, description } = Astro.props;
---

<!-- Global Metadata -->
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta name="generator" content={Astro.generator} />

<!-- Canonical URL -->
<link rel="canonical" href={canonicalURL} />

<!-- Primary Meta Tags -->
<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content={Astro.url} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />

<!-- Twitter -->
<meta property="twitter:card" content="summary" />
<meta property="twitter:url" content={Astro.url} />
<meta property="twitter:title" content={title} />
<meta property="twitter:description" content={description} />
```

- [ ] **Step 5: Remove @astrojs/mdx and @astrojs/rss from package.json**

```bash
npm uninstall @astrojs/mdx @astrojs/rss
```

- [ ] **Step 6: Create a minimal placeholder index.astro so the site builds**

Replace `src/pages/index.astro` with:

```astro
---
import BaseHead from '../components/BaseHead.astro';
import Footer from '../components/Footer.astro';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
---

<!doctype html>
<html lang="en">
  <head>
    <BaseHead title={SITE_TITLE} description={SITE_DESCRIPTION} />
  </head>
  <body>
    <main>
      <h1>Cory McDonald</h1>
      <p>Site under construction.</p>
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 7: Create a minimal placeholder Footer.astro**

Replace `src/components/Footer.astro` with:

```astro
<footer>
  <p>&copy; {new Date().getFullYear()} Cory McDonald</p>
</footer>
<style>
  footer {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 8: Verify the site builds**

```bash
npx astro build
```

Expected: Clean build with no errors. The `dist/` folder is produced.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: remove blog boilerplate, strip to minimal portfolio shell"
```

---

### Task 2: Rewrite global.css for minimal portfolio

**Files:**
- Rewrite: `src/styles/global.css`

- [ ] **Step 1: Replace global.css**

Replace the entire file with:

```css
:root {
  --color-bg: #fafafa;
  --color-text: #1a1a1a;
  --color-text-muted: #6b7280;
  --color-link: #2563eb;
  --color-link-hover: #1d4ed8;
  --color-border: #e5e7eb;

  /* Contributions graph — 5 levels, light mode */
  --graph-0: #ebedf0;
  --graph-1: #9be9a8;
  --graph-2: #40c463;
  --graph-3: #30a14e;
  --graph-4: #216e39;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #111111;
    --color-text: #e5e5e5;
    --color-text-muted: #9ca3af;
    --color-link: #60a5fa;
    --color-link-hover: #93bbfd;
    --color-border: #2d2d2d;

    --graph-0: #161b22;
    --graph-1: #0e4429;
    --graph-2: #006d32;
    --graph-3: #26a641;
    --graph-4: #39d353;
  }
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial,
    sans-serif;
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 18px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

main {
  width: 720px;
  max-width: calc(100% - 2rem);
  margin: 0 auto;
  padding: 4rem 1rem;
}

h1, h2, h3 {
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

h1 {
  font-size: 2.5rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 3rem;
  margin-bottom: 1rem;
  color: var(--color-text-muted);
}

a {
  color: var(--color-link);
  text-decoration: none;
}

a:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

p {
  margin: 0 0 1rem 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 720px) {
  body {
    font-size: 16px;
  }
  main {
    padding: 2rem 1rem;
  }
  h1 {
    font-size: 2rem;
  }
}
```

- [ ] **Step 2: Verify the site still builds**

```bash
npx astro build
```

Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "style: rewrite global.css for minimal portfolio with dark mode"
```

---

### Task 3: Build GitHub contributions lib — types and aggregation

**Files:**
- Create: `src/lib/github.ts`
- Create: `src/lib/github.test.ts`
- Modify: `package.json` (add vitest)

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

Then add to the `"scripts"` section of `package.json`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing test file**

Create `src/lib/github.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { aggregateCalendars, type UserCalendar } from "./github";

function makeCalendar(
  days: Array<{ date: string; contributionCount: number }>
): UserCalendar {
  // Group days into weeks of 7
  const weeks: UserCalendar["weeks"] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push({ contributionDays: days.slice(i, i + 7) });
  }
  return {
    totalContributions: days.reduce((s, d) => s + d.contributionCount, 0),
    weeks,
  };
}

describe("aggregateCalendars", () => {
  it("sums contributions across users for the same dates", () => {
    const userA = makeCalendar([
      { date: "2025-01-01", contributionCount: 3 },
      { date: "2025-01-02", contributionCount: 0 },
    ]);
    const userB = makeCalendar([
      { date: "2025-01-01", contributionCount: 2 },
      { date: "2025-01-02", contributionCount: 5 },
    ]);

    const result = aggregateCalendars([userA, userB]);

    expect(result.total).toBe(10);
    expect(result.days).toHaveLength(2);

    const jan1 = result.days.find((d) => d.date === "2025-01-01")!;
    expect(jan1.count).toBe(5);

    const jan2 = result.days.find((d) => d.date === "2025-01-02")!;
    expect(jan2.count).toBe(5);
  });

  it("includes dates that only appear in one user", () => {
    const userA = makeCalendar([
      { date: "2025-03-01", contributionCount: 4 },
    ]);
    const userB = makeCalendar([
      { date: "2025-03-02", contributionCount: 1 },
    ]);

    const result = aggregateCalendars([userA, userB]);

    expect(result.total).toBe(5);
    expect(result.days).toHaveLength(2);
    expect(result.days.find((d) => d.date === "2025-03-01")!.count).toBe(4);
    expect(result.days.find((d) => d.date === "2025-03-02")!.count).toBe(1);
  });

  it("assigns level 0 to days with zero contributions", () => {
    const calendar = makeCalendar([
      { date: "2025-06-01", contributionCount: 0 },
      { date: "2025-06-02", contributionCount: 10 },
    ]);

    const result = aggregateCalendars([calendar]);

    expect(result.days.find((d) => d.date === "2025-06-01")!.level).toBe(0);
    expect(result.days.find((d) => d.date === "2025-06-02")!.level).toBe(4);
  });

  it("buckets levels correctly across a range", () => {
    const calendar = makeCalendar([
      { date: "2025-07-01", contributionCount: 0 },
      { date: "2025-07-02", contributionCount: 1 },
      { date: "2025-07-03", contributionCount: 3 },
      { date: "2025-07-04", contributionCount: 6 },
      { date: "2025-07-05", contributionCount: 10 },
    ]);

    const result = aggregateCalendars([calendar]);
    const levels = result.days.map((d) => d.level);

    // 0 -> level 0
    // 1/10 = 10% -> level 1 (1-25%)
    // 3/10 = 30% -> level 2 (26-50%)
    // 6/10 = 60% -> level 3 (51-75%)
    // 10/10 = 100% -> level 4 (76-100%)
    expect(levels).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns days sorted by date ascending", () => {
    const calendar = makeCalendar([
      { date: "2025-02-03", contributionCount: 1 },
      { date: "2025-02-01", contributionCount: 1 },
      { date: "2025-02-02", contributionCount: 1 },
    ]);

    const result = aggregateCalendars([calendar]);
    const dates = result.days.map((d) => d.date);

    expect(dates).toEqual(["2025-02-01", "2025-02-02", "2025-02-03"]);
  });

  it("handles empty input", () => {
    const result = aggregateCalendars([]);
    expect(result.total).toBe(0);
    expect(result.days).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run
```

Expected: FAIL — `./github` module doesn't exist yet.

- [ ] **Step 4: Write the implementation**

Create `src/lib/github.ts`:

```ts
export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface UserCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface AggregatedDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface AggregatedResult {
  days: AggregatedDay[];
  total: number;
  error?: boolean;
}

const GITHUB_USERS = ["corymcdonald", "bark-cmcdonald", "unrivaled-cmcdonald"];

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

function computeLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function aggregateCalendars(calendars: UserCalendar[]): AggregatedResult {
  const dayCounts = new Map<string, number>();

  for (const calendar of calendars) {
    for (const week of calendar.weeks) {
      for (const day of week.contributionDays) {
        dayCounts.set(day.date, (dayCounts.get(day.date) ?? 0) + day.contributionCount);
      }
    }
  }

  const total = Array.from(dayCounts.values()).reduce((s, c) => s + c, 0);
  const max = Math.max(0, ...dayCounts.values());

  const days: AggregatedDay[] = Array.from(dayCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date,
      count,
      level: computeLevel(count, max),
    }));

  return { days, total };
}

async function fetchUserCalendar(
  login: string,
  token: string
): Promise<UserCalendar> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "corywmcdonald-portfolio",
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${login}`);
  }

  const json = (await response.json()) as {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: UserCalendar;
        };
      };
    };
  };

  return json.data.user.contributionsCollection.contributionCalendar;
}

export async function getAggregatedContributions(env: {
  GITHUB_TOKEN: string;
}): Promise<AggregatedResult> {
  const cacheKey = "https://internal.cache/contributions-v1";
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached.json() as Promise<AggregatedResult>;
  }

  try {
    const calendars = await Promise.all(
      GITHUB_USERS.map((login) => fetchUserCalendar(login, env.GITHUB_TOKEN))
    );

    const result = aggregateCalendars(calendars);

    const response = new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
    await cache.put(cacheKey, response.clone());

    return result;
  } catch (e) {
    const errorResult: AggregatedResult = { days: [], total: 0, error: true };

    const response = new Response(JSON.stringify(errorResult), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
    await cache.put(cacheKey, response.clone());

    return errorResult;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run
```

Expected: All 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/github.ts src/lib/github.test.ts package.json package-lock.json
git commit -m "feat: add GitHub contributions aggregation lib with tests"
```

---

### Task 4: Build the ContributionsGraph component

**Files:**
- Create: `src/components/ContributionsGraph.astro`

- [ ] **Step 1: Create the component**

Create `src/components/ContributionsGraph.astro`:

```astro
---
import { getAggregatedContributions } from "../lib/github";
import type { AggregatedDay } from "../lib/github";

const env = Astro.locals.runtime.env as { GITHUB_TOKEN: string };
const { days, total, error } = await getAggregatedContributions(env);

// Build a 53×7 grid. GitHub's graph runs Sun(0)–Sat(6) top-to-bottom,
// weeks left-to-right, most recent week on the right.
// We need to map each day to (weekColumn, dayRow).
const cellSize = 11;
const cellGap = 3;
const cellStep = cellSize + cellGap;
const labelWidth = 28;

interface Cell {
  x: number;
  y: number;
  level: 0 | 1 | 2 | 3 | 4;
  date: string;
  count: number;
}

const cells: Cell[] = [];

if (days.length > 0) {
  // Find the date range: last 53 weeks ending on the most recent Saturday
  // or the last date in the data.
  const lastDate = new Date(days[days.length - 1].date);
  // Walk back to fill 53 weeks (371 days)
  const startDate = new Date(lastDate);
  startDate.setDate(startDate.getDate() - 364);
  // Align startDate to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const dayMap = new Map<string, AggregatedDay>();
  for (const d of days) {
    dayMap.set(d.date, d);
  }

  const cursor = new Date(startDate);
  let weekCol = 0;
  while (cursor <= lastDate) {
    const dayOfWeek = cursor.getDay();
    const iso = cursor.toISOString().split("T")[0];
    const dayData = dayMap.get(iso);

    cells.push({
      x: labelWidth + weekCol * cellStep,
      y: dayOfWeek * cellStep,
      level: dayData?.level ?? 0,
      date: iso,
      count: dayData?.count ?? 0,
    });

    if (dayOfWeek === 6) {
      weekCol++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
}

const svgWidth = labelWidth + 53 * cellStep;
const svgHeight = 7 * cellStep + 20; // extra space for month labels

// Month labels: find the first occurrence of each month in the grid
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabels: Array<{ text: string; x: number }> = [];
let lastMonth = -1;
for (const cell of cells) {
  const d = new Date(cell.date);
  const m = d.getMonth();
  if (m !== lastMonth && d.getDay() === 0) {
    monthLabels.push({ text: months[m], x: cell.x });
    lastMonth = m;
  }
}

const dayLabels = [
  { text: "Mon", y: 1 * cellStep + cellSize / 2 },
  { text: "Wed", y: 3 * cellStep + cellSize / 2 },
  { text: "Fri", y: 5 * cellStep + cellSize / 2 },
];
---

<section class="contributions">
  <h2>Contributions</h2>

  {error ? (
    <p class="error-caption">Contributions graph temporarily unavailable.</p>
  ) : (
    <>
      <div class="graph-scroll">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label={`GitHub contribution graph showing ${total} contributions in the last year`}
        >
          {dayLabels.map(({ text, y }) => (
            <text x="0" y={y} class="graph-label" dominant-baseline="central">
              {text}
            </text>
          ))}

          {monthLabels.map(({ text, x }) => (
            <text x={x} y={7 * cellStep + 14} class="graph-label">
              {text}
            </text>
          ))}

          {cells.map(({ x, y, level, date, count }) => (
            <rect
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx="2"
              ry="2"
              class={`level-${level}`}
            >
              <title>{`${date}: ${count} contribution${count !== 1 ? "s" : ""}`}</title>
            </rect>
          ))}
        </svg>
      </div>

      <p class="graph-total">{total.toLocaleString()} contributions in the last year</p>
    </>
  )}

  <p class="graph-caption">
    Aggregated across personal and work GitHub accounts. Excludes Cerner (private enterprise).
  </p>
  <ul class="graph-accounts">
    <li><a href="https://github.com/corymcdonald">Personal (corymcdonald)</a></li>
    <li><a href="https://github.com/bark-cmcdonald">Bark (bark-cmcdonald)</a></li>
    <li><a href="https://github.com/unrivaled-cmcdonald">Unrivaled (unrivaled-cmcdonald)</a></li>
  </ul>
</section>

<style>
  .contributions {
    margin-top: 3rem;
  }

  .graph-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  svg {
    display: block;
  }

  .graph-label {
    fill: var(--color-text-muted);
    font-size: 10px;
    font-family: inherit;
  }

  rect.level-0 { fill: var(--graph-0); }
  rect.level-1 { fill: var(--graph-1); }
  rect.level-2 { fill: var(--graph-2); }
  rect.level-3 { fill: var(--graph-3); }
  rect.level-4 { fill: var(--graph-4); }

  .graph-total {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  .graph-caption {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
  }

  .error-caption {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .graph-accounts {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.85rem;
  }
</style>
```

- [ ] **Step 2: Verify the site builds** (the component isn't imported yet, but the file should have no syntax errors)

```bash
npx astro build
```

Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/ContributionsGraph.astro
git commit -m "feat: add ContributionsGraph component (SVG, server-rendered)"
```

---

### Task 5: Build the Experience component

**Files:**
- Create: `src/components/Experience.astro`

- [ ] **Step 1: Create the component**

Create `src/components/Experience.astro`:

```astro
---
interface Job {
  company: string;
  role: string;
  period: string;
  summary: string;
}

const jobs: Job[] = [
  {
    company: "Unrivaled Basketball",
    role: "Senior Software Engineer",
    period: "Aug 2025 \u2013 Present",
    summary:
      "Led Shopify ecommerce and PoS implementation driving $3M in sales. Built data pipelines, user account system (60K users in 4 months), and a fan bracket product (168K unique visitors).",
  },
  {
    company: "Bark",
    role: "Sr. Engineering Manager, Payments & Assignment",
    period: "Aug 2023 \u2013 Aug 2025",
    summary:
      "Managed two teams. Migrated 1M active subscriptions to Shopify. Led fraud platform migration from Kount to Signifyd, reducing chargeback fees by $1.1M/year.",
  },
  {
    company: "Bark",
    role: "Engineering Manager, Payments",
    period: "Oct 2020 \u2013 Aug 2023",
    summary:
      "Scaled a fully remote team from 1 to 8 engineers across 5 timezones. Led Apple Pay and Venmo integration achieving 35% subscriber adoption.",
  },
  {
    company: "Brave",
    role: "Senior Software Engineer",
    period: "Nov 2018 \u2013 Oct 2020",
    summary:
      "Team Lead for Creators payments platform. Built privacy-preserving e-commerce system in Golang. Led Heroku to AWS EKS migration. Maintained endpoints serving 6M daily browsers at 1K RPS.",
  },
  {
    company: "Cerner (acquired by Oracle)",
    role: "Software Engineer",
    period: "May 2016 \u2013 Nov 2018",
    summary:
      "Built and maintained 8 Ruby on Rails applications. Mentored 8+ engineers in development academy. Led weekly operations review uncovering previously undetected defects.",
  },
  {
    company: "J.B. Hunt Transport Services",
    role: "Software Engineering Intern",
    period: "Jan 2012 \u2013 Jun 2016",
    summary:
      "Youngest hire in the technology department. Won 2015 Hackathon with a Rails recruitment app. Built a WYSIWYG editor integrated into the company knowledge sharing system.",
  },
];
---

<section class="experience">
  <h2>Experience</h2>
  <div class="timeline">
    {jobs.map((job) => (
      <div class="job">
        <div class="job-header">
          <strong>{job.role}</strong>
          <span class="job-meta">
            {job.company} &middot; {job.period}
          </span>
        </div>
        <p class="job-summary">{job.summary}</p>
      </div>
    ))}
  </div>
</section>

<style>
  .experience {
    margin-top: 3rem;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .job-header {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .job-meta {
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }

  .job-summary {
    margin-top: 0.35rem;
    font-size: 0.95rem;
    color: var(--color-text);
  }
</style>
```

- [ ] **Step 2: Verify the site builds**

```bash
npx astro build
```

Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/Experience.astro
git commit -m "feat: add Experience timeline component"
```

---

### Task 6: Build the Footer and assemble the homepage

**Files:**
- Rewrite: `src/components/Footer.astro`
- Rewrite: `src/pages/index.astro`

- [ ] **Step 1: Write the final Footer.astro**

Replace `src/components/Footer.astro` with:

```astro
---
const links = [
  { label: "Email", href: "mailto:cory@corywmcdonald.com" },
  { label: "LinkedIn", href: "https://linkedin.com/in/corywmcdonald" },
  { label: "Resume", href: "https://standardresume.co/r/40NRLzJUnOEbnmotqcuHk" },
  { label: "GitHub (Personal)", href: "https://github.com/corymcdonald" },
  { label: "GitHub (Bark)", href: "https://github.com/bark-cmcdonald" },
  { label: "GitHub (Unrivaled)", href: "https://github.com/unrivaled-cmcdonald" },
];
---

<footer>
  <nav class="footer-links" aria-label="Contact and profiles">
    {links.map(({ label, href }) => (
      <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}>
        {label}
      </a>
    ))}
  </nav>
  <p class="copyright">&copy; {new Date().getFullYear()} Cory McDonald</p>
</footer>

<style>
  footer {
    text-align: center;
    padding: 3rem 1rem 2rem;
    border-top: 1px solid var(--color-border);
    max-width: 720px;
    margin: 0 auto;
  }

  .footer-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem 1.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
  }

  .copyright {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin: 0;
  }
</style>
```

- [ ] **Step 2: Write the final index.astro**

Replace `src/pages/index.astro` with:

```astro
---
import BaseHead from "../components/BaseHead.astro";
import Footer from "../components/Footer.astro";
import Experience from "../components/Experience.astro";
import ContributionsGraph from "../components/ContributionsGraph.astro";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";
---

<!doctype html>
<html lang="en">
  <head>
    <BaseHead title={SITE_TITLE} description={SITE_DESCRIPTION} />
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Cory McDonald</h1>
        <p class="subtitle">Senior Software Engineer</p>
        <p class="location">San Francisco Bay Area</p>
      </section>

      <section class="bio">
        <p>
          Software engineering leader with 8+ years building high-scale,
          distributed systems across subscription and payment infrastructure.
          Proven track record migrating production payment platforms, integrating
          third-party processors, and leading cross-functional technical
          projects.
        </p>
      </section>

      <Experience />
      <ContributionsGraph />
    </main>
    <Footer />
  </body>
</html>

<style>
  .hero {
    margin-bottom: 2rem;
  }

  .subtitle {
    font-size: 1.25rem;
    color: var(--color-text-muted);
    margin: 0.25rem 0;
  }

  .location {
    font-size: 1rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  .bio {
    margin-bottom: 1rem;
  }

  .bio p {
    font-size: 1.05rem;
    line-height: 1.8;
  }
</style>
```

- [ ] **Step 3: Verify the site builds**

```bash
npx astro build
```

Expected: Clean build. The contributions graph will fail to fetch data during build (no Worker runtime), but the build should still succeed because the component handles errors gracefully.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.astro src/pages/index.astro
git commit -m "feat: assemble homepage with hero, bio, experience, graph, and footer"
```

---

### Task 7: Update README and final cleanup

**Files:**
- Rewrite: `README.md`

- [ ] **Step 1: Replace README.md**

Replace the entire file with:

```markdown
# corywmcdonald.com

Personal portfolio site for Cory McDonald. Built with [Astro](https://astro.build/) and deployed on [Cloudflare Workers](https://workers.cloudflare.com/).

## Development

```bash
npm install
npm run dev
```

## Deployment

Requires a Cloudflare account and a `GITHUB_TOKEN` Worker secret (classic PAT with `read:user` scope) for the contributions graph.

```bash
npx wrangler secret put GITHUB_TOKEN
npm run deploy
```
```

- [ ] **Step 2: Run full check**

```bash
npm run check
```

Expected: `astro build` succeeds, `tsc` passes, `wrangler deploy --dry-run` succeeds.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Start dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:4321` in a browser. Verify:
- Hero shows "Cory McDonald", "Senior Software Engineer", "San Francisco Bay Area"
- Bio paragraph renders below
- Experience timeline shows all 6 positions in chronological order (most recent first)
- Contributions graph renders an SVG calendar (may show "temporarily unavailable" in dev if no Worker runtime; that's OK — it will work on Cloudflare)
- Footer shows all 6 links and copyright
- Dark mode works (check via browser devtools or OS setting)
- Mobile viewport (~375px) layout is readable

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: replace boilerplate README with project-specific docs"
```
