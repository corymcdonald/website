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
