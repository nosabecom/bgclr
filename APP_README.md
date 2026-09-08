# Beej’s C library reference mirror

https://c.nosa.dev serves the original published HTML guide directly, with its
original layout, contents, and navigation. A small corner search box queries
Algolia; the book has no wrapper or redesigned layout.

Vercel publishes `public/bgclr/` without a build or dependency installation.
For a local preview, run `python -m http.server 4173 --directory public/bgclr`.

The original Markdown and C examples remain in `src/` and `source/`.
See [README.md](README.md) for the upstream book build instructions and
[LICENSE.md](LICENSE.md) for attribution and license terms.

## Source

- Upstream: https://github.com/beejjorgensen/bgclr
- Fork: https://github.com/nosabecom/bgclr
- Initial upstream commit: `6f45f77a19feddf9425634fa6cad5a641569f8a9`
- Unmodified HTML: https://beej.us/guide/bgclr/html/bgclr.zip
- Original tab icon: https://beej.us/favicon.ico (served at `/favicon.ico`).
- Downloaded: 2026-09-08 UTC. Published HTML and source may represent different revisions.

The Vercel Content Security Policy permits the guide’s MathJax dependency and
blocks its obsolete third-party polyfill script. The only HTML additions are an
explicit favicon link and the deferred search widget script. The search widget
uses a shadow root so its styles do not change the book.

## Search

`public/bgclr/search.js` uses application `8T5IVMMF87`, the supplied search-only
key, and the crawler index `c_nosa_dev_8t5ivmmf87_pages`. No write/admin key is
included. Results link to the pages indexed by Algolia. The search box supports
arrow-key navigation, Escape to close, and Enter to retry a failed request.

At initial integration the crawler index held 23 records and omitted several
large chapters, including `stdio.html` and `stdlib.html`. These need to be
resolved in the Algolia crawler for full guide coverage. The UI does not replace
Algolia with a different search provider.

This fork is the parent learning repository’s `reference` Git submodule.
Run `git submodule update --init --recursive` after cloning the parent repository.
