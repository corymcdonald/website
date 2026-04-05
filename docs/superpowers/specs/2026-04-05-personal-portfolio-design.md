# Personal Portfolio — Design Spec

**Date:** 2026-04-05
**Owner:** Cory McDonald
**Status:** Approved for implementation planning

## Goal

Replace the Astro blog starter boilerplate in this repo with a minimal, single-page personal portfolio for Cory McDonald. The site is expected to be deployed and then left alone for long stretches (years), so it must degrade gracefully and avoid components that silently break over time. The one dynamic feature is an aggregated GitHub contributions graph that sums public contributions across multiple work GitHub accounts into a single GitHub-style calendar.

## Non-Goals

- No blog, RSS, or writing surface of any kind.
- No dedicated resume page — the external web resume (https://standardresume.co/r/40NRLzJUnOEbnmotqcuHk) is linked, not mirrored.
- No CMS, no MDX, no content collections.
- No client-side framework (React/Vue/etc.). No client-side JavaScript for the graph.
- No custom brand system — use clean, minimal, system-font styling.
- No analytics integration in this iteration.

## Stack

Unchanged from the current repo:

- Astro 5 + `@astrojs/cloudflare` adapter
- Cloudflare Workers runtime
- TypeScript
- Deployment via `wrangler`

Dependencies to remove: `@astrojs/mdx`, `@astrojs/rss`.

## Site Structure

Single page at `/`. No other routes except the contributions API endpoint.

### Homepage Sections (top to bottom)

1. **Hero**
   - Name: "Cory McDonald"
   - Title: "Senior Software Engineer"
   - Location: "San Francisco Bay Area"

2. **Bio**
   - 2–3 sentences adapted from the resume summary: software engineering leader with 8+ years building high-scale distributed systems across subscription and payment infrastructure; experience migrating production payment platforms, integrating third-party processors, and leading cross-functional technical projects.

3. **Experience** — compact timeline, most recent first:
   - **Unrivaled Basketball** — Senior Software Engineer, Aug 2025 – Present. 1–2 line summary (Shopify ecommerce/PoS, data pipelines, user accounts, bracket product).
   - **Bark** — Sr. Engineering Manager (Payments, Assignment), Aug 2023 – Aug 2025. 1–2 line summary (managed two teams, Shopify subscription migration, fraud migration).
   - **Bark** — Engineering Manager, Payments, Oct 2020 – Aug 2023. 1–2 line summary (scaled team 1→8, Apple Pay/Venmo, subscription change workflow).
   - **Brave** — Senior Software Engineer, Nov 2018 – Oct 2020. 1–2 line summary (Creators payments platform, Golang/Rails, EKS migration).
   - **Cerner (acquired by Oracle)** — Software Engineer, May 2016 – Nov 2018. 1–2 line summary (Ruby on Rails across 8 apps, mentoring, operations review).
   - **J.B. Hunt Transport Services** — Software Engineering Intern, Jan 2012 – Jun 2016. 1–2 line summary (hired as high school student, hackathon winner, WYSIWYG editor).

4. **GitHub Contributions**
   - Aggregated calendar graph (53 weeks × 7 days, GitHub color scale).
   - Caption below: "Aggregated across personal and work GitHub accounts. Excludes Cerner (private enterprise)."
   - Small legend listing the three included accounts with their role labels:
     - Personal: `corymcdonald`
     - Bark: `bark-cmcdonald`
     - Unrivaled: `unrivaled-cmcdonald`

5. **Links Footer**
   - Email: `cory@corywmcdonald.com`
   - LinkedIn: `linkedin.com/in/corywmcdonald`
   - Web resume: `standardresume.co/r/40NRLzJUnOEbnmotqcuHk`
   - GitHub (Personal): `github.com/corymcdonald`
   - GitHub (Bark): `github.com/bark-cmcdonald`
   - GitHub (Unrivaled): `github.com/unrivaled-cmcdonald`

Phone number is intentionally omitted.

## Visual Design

- Single-column, max content width ~720px, generous vertical spacing.
- System font stack (no custom webfont downloads).
- Light + dark mode via `prefers-color-scheme`, no toggle.
- Neutral palette: near-black on near-white (light), near-white on near-black (dark). One subtle accent color reserved for links.
- No animations, no hero imagery, no decorative graphics.

## Contributions Graph — Technical Design

### Data Source

GitHub GraphQL API v4 (`https://api.github.com/graphql`), authenticated with a classic Personal Access Token stored as the Cloudflare Worker secret `GITHUB_TOKEN`. The token only needs the `read:user` scope because we are reading public contribution data of other users; the token authenticates the API caller, not the target user.

### Query

For each of the three users:

```graphql
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
```

All three users fetched in parallel via `Promise.all`.

### Aggregation

Pure function in `src/lib/github.ts` that takes an array of per-user calendar responses and returns a single merged calendar:

1. Build a `Map<string, number>` keyed by ISO date, summing `contributionCount` across users.
2. Determine the max merged daily count.
3. Bucket each day into one of 5 levels (0, 1–25%, 26–50%, 51–75%, 76–100% of max) to match GitHub's color scale semantics.
4. Return a sorted array of `{ date, count, level }` objects spanning the full last-year window, plus the merged total.

This function must be pure and deterministic so it can be unit tested without hitting the network.

### Caching

A single exported function in `src/lib/github.ts` — `getAggregatedContributions(env)` — handles caching internally using the Cloudflare Cache API:

1. Check Cache API for key `https://internal.cache/contributions-v1`. If hit, return the cached JSON.
2. On miss: fetch the GraphQL query for all three users in parallel, call the pure `aggregateCalendars()` function, stash the result in Cache API with `Cache-Control: public, max-age=86400` (24h), and return.
3. On fetch/parse failure: return `{ days: [], total: 0, error: true }` and cache it with a short TTL (5 minutes) so transient failures don't hammer the upstream.

No HTTP API route is created — the graph component calls this function directly during server render. If a JSON endpoint is ever needed later, it's one file to add.

### Rendering

`src/components/ContributionsGraph.astro` renders an inline SVG grid server-side during the request:

- The component imports `getAggregatedContributions` from `src/lib/github.ts` and awaits it in the component frontmatter, passing the Astro `locals.runtime.env` so the function can access `GITHUB_TOKEN` and the Cache API.
- 53 columns (weeks), 7 rows (days of week).
- Each cell is a `<rect>` with a `<title>` child for native-tooltip hover showing date and count.
- CSS custom properties drive the 5-level color scale so it themes correctly in light/dark mode.
- If the endpoint returns `error: true` or an empty day array, render the grid with all level-0 cells plus small caption text "Contributions graph temporarily unavailable."
- No client-side JavaScript.

### Configuration

- `GITHUB_TOKEN` — Cloudflare Worker secret, already set via `npx wrangler secret put GITHUB_TOKEN`.
- The three GitHub usernames are hardcoded in `src/lib/github.ts` as a constant array. This is acceptable because they change rarely (new job ~every few years) and the site is expected to be rebuilt+redeployed at that time anyway.

## File Changes

### To Remove

- `src/pages/about.astro`
- `src/pages/blog/` (entire directory)
- `src/pages/rss.xml.js`
- `src/content/blog/` (entire directory)
- `src/content.config.ts`
- `src/layouts/BlogPost.astro`
- `src/components/FormattedDate.astro`
- `public/blog-placeholder-*.jpg` (6 files)
- `@astrojs/mdx` and `@astrojs/rss` from `package.json`

### To Update

- `src/consts.ts` — `SITE_TITLE = "Cory McDonald"`, new `SITE_DESCRIPTION`.
- `src/components/Header.astro` — simplify or remove. Since the site is one page, a header with nav is unnecessary; keep only as a thin name/home link or delete and inline the hero in `index.astro`. Decision: **remove** the Header component entirely to reduce files.
- `src/components/Footer.astro` — replace content with the Links Footer described above.
- `src/components/BaseHead.astro` — keep as-is (handles meta tags and favicon).
- `src/pages/index.astro` — replace body with the homepage sections above.
- `src/styles/global.css` — new or rewritten minimal stylesheet (typography, layout, dark mode, graph color tokens).
- `README.md` — replace the Astro starter content with a brief note about what this repo is.

### To Add

- `src/components/ContributionsGraph.astro`
- `src/components/Experience.astro` (small presentational component rendering the timeline from a local constant)
- `src/lib/github.ts` (GraphQL query, types, pure `aggregateCalendars()` function, cache-wrapping `getAggregatedContributions()` function)
- `src/lib/github.test.ts` (unit tests for `aggregateCalendars`)

## Testing

- **Unit test** for `aggregateCalendars()` in `src/lib/github.ts`:
  - Given three hand-crafted per-user calendar responses, assert merged per-date totals.
  - Assert level-bucketing against known inputs.
  - Assert that dates missing from some users still appear if present in others.
- **Build check**: `npm run check` (astro build + tsc + wrangler dry-run) must pass.
- **Manual smoke test**: `npm run dev`, load `/`, verify all sections render, graph shows data, light/dark mode both look correct.
- **Failure path manual test**: temporarily set an invalid `GITHUB_TOKEN`, verify the page still renders with the "temporarily unavailable" caption and the rest of the site is intact.

## Open Questions Resolved During Brainstorming

- Data approach: GraphQL API at runtime with Cloudflare Cache API, not build-time scraping (rationale: site is redeployed rarely, so build-time data would go stale).
- Authentication: classic PAT with `read:user` scope, stored as Worker secret.
- Phone number: not published.
- Work GitHub accounts: linked publicly.
- Skills/tech list: omitted — experience section speaks for itself.
- Visual treatment: minimal/clean (option A), not distinctive/designed.
- Cerner: excluded from graph (inaccessible), noted in caption.

## Risks & Mitigations

- **GitHub API schema change** — Low risk; the `contributionsCollection` API has been stable for years. Mitigation: graceful degradation means a schema break shows a caption, not a broken page.
- **PAT expiration** — If the token expires, the graph stops updating (cached data continues to serve until TTL, then degrades). Mitigation: create the token with no expiration, or set a long expiration plus a calendar reminder.
- **Rate limits** — 5000 req/hour per token; with 24h cache we make at most a handful of calls per day. Not a concern.
- **Stale cache on redeploy** — Cache API is not automatically purged on deploy. Acceptable; cache key includes `v1` so bumping the version invalidates.
