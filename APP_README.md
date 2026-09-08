# Beej’s C library reference mirror

https://c.nosa.dev serves the original published HTML guide directly, with its
original layout, contents, and navigation. No wrapper or custom interface is added.
Search will be added separately later.

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
blocks its obsolete third-party polyfill script. The HTML itself is unchanged.

This fork is the parent learning repository’s `reference` Git submodule.
Run `git submodule update --init --recursive` after cloning the parent repository.
