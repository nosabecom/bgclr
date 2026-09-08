# Nosa’s C reference

A personal search and reading interface for Beej’s Guide to C Programming,
Library Reference. The original guide is preserved in `public/bgclr/` and displayed
in the reader. The upstream Markdown and examples remain in `src/` and `source/`.
See the upstream [README](README.md) for building the book itself.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:4173. Search works immediately using a local full-text index,
including prefix matching and typo tolerance. `/` or Ctrl/Cmd+K focuses search;
arrow keys move through results. Links can be bookmarked with their section and query.

## Vercel

Deploy this repository as its own Vercel project with the repository root as the
root directory. `vercel.json` selects `npm run build` and publishes only `dist/`.
Attach `c.nosa.dev` to this project; the apex domain stays on the portfolio project.

## Algolia

The integration is optional until an Algolia application is configured. It uses
the Search API directly, so a crawler and permission to crawl beej.us are unnecessary.

1. Create a dedicated index named `beej_c_reference` in your Algolia application.
2. Copy `.env.example` to `.env.local`. Set the application ID, index name, a
   search-only key restricted to this index, and a local write key with permission
   to add objects and configure this index. `.env.local` is ignored by Git.
3. Run `npm run build`, then `npm run index:algolia`. This uploads the guide sections
   with stable IDs, gives headings priority, and groups chunks into one result per section.
4. In Vercel, set `ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_API_KEY`, and `ALGOLIA_INDEX_NAME`
   for Production and redeploy. Only these three values are bundled for the browser.
   Never set the write/admin key in client code.

The UI labels the current search provider and falls back to local search if Algolia
is unavailable. The upload script updates/adds records; if a future book version removes
sections, use a new dedicated index and switch the configured index name to avoid stale hits.

If you prefer Algolia’s crawler, crawl `https://c.nosa.dev/bgclr/index.html` and its
chapter links, not the app’s iframe shell. Crawler-generated schemas may differ from
the app’s `title`, `chapter`, `content`, `url` schema; the included upload script
produces the exact records expected by the app.

## Provenance

- Upstream: https://github.com/beejjorgensen/bgclr
- Fork: https://github.com/nosabecom/bgclr
- Initial upstream commit: `6f45f77a19feddf9425634fa6cad5a641569f8a9`
- Published HTML snapshot: https://beej.us/guide/bgclr/html/bgclr.zip
- Downloaded: 2026-09-08 UTC. HTML and source may represent different upstream revisions.
- Guide attribution and license: `LICENSE.md` and the guide’s Foreword.

The reader and search interface are separate from the mirrored book. The Vercel
Content Security Policy permits the guide’s MathJax dependency and blocks its obsolete
third-party polyfill script. No C learning exercises in the parent repository are changed.

This fork is included in the parent learning repository as the `reference` Git submodule.
After cloning that repository, run `git submodule update --init --recursive` to retrieve it.
