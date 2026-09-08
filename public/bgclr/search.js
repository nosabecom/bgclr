(() => {
  'use strict';

  // This browser key is the user-provided search-only key, never a write/admin key.
  const applicationId = '8T5IVMMF87';
  const searchKey = '50c18174d1827e90598eef3664b7346e';
  const indexName = 'c_nosa_dev_8t5ivmmf87_pages';
  const host = document.createElement('div');
  host.id = 'beej-search';
  // Isolate the widget's styles from the original book in both directions.
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <link rel="stylesheet" href="/search.css?v=2">
    <form role="search" autocomplete="off">
      <input type="search" aria-label="Search the guide" aria-keyshortcuts="Control+k Meta+k" title="Search (Ctrl+K or ⌘K)" placeholder="Search…" maxlength="256" spellcheck="false" aria-controls="search-panel" aria-expanded="false">
    </form>
    <section id="search-panel" aria-label="Search results" hidden>
      <div class="panel-heading"><span role="status" aria-live="polite"></span><button type="button" aria-label="Close search results">×</button></div>
      <nav aria-label="Matching guide pages"></nav>
      <footer><a href="https://www.algolia.com/" target="_blank" rel="noreferrer">Search by Algolia</a></footer>
    </section>`;
  document.body.append(host);

  const form = root.querySelector('form');
  const input = root.querySelector('input');
  const panel = root.querySelector('section');
  const status = root.querySelector('[role="status"]');
  const results = root.querySelector('nav');
  let timer;
  let controller;
  let generation = 0;

  function setOpen(open) {
    panel.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
  }

  function close() {
    generation++;
    clearTimeout(timer);
    controller?.abort();
    setOpen(false);
  }

  function safeUrl(hit) {
    try {
      const url = new URL(hit.url);
      if (url.protocol !== 'https:' || url.hostname !== 'c.nosa.dev') return null;
      if (url.pathname !== '/' && !/^\/[a-z0-9-]+\.html$/.test(url.pathname)) return null;
      return url.pathname + url.hash;
    } catch { return null; }
  }

  function excerpt(content, query) {
    const text = typeof content === 'string' ? content.replace(/\s+/g, ' ').trim() : '';
    const term = query.toLowerCase().match(/[a-z0-9_]+/)?.[0] || '';
    const start = Math.max(0, text.toLowerCase().indexOf(term) - 45);
    return (start ? '…' : '') + text.slice(start, start + 180) + (text.length > start + 180 ? '…' : '');
  }

  function render(hits, query) {
    const seen = new Set();
    results.replaceChildren();
    for (const hit of hits) {
      const url = safeUrl(hit);
      const canonical = url === '/' ? '/index.html' : url;
      if (!url || seen.has(canonical)) continue;
      seen.add(canonical);
      const link = document.createElement('a');
      link.href = url;
      const heading = document.createElement('strong');
      heading.textContent = hit.headers?.[0] || hit.title || 'Beej’s Guide to C';
      const summary = document.createElement('span');
      summary.textContent = excerpt(hit.content, query);
      link.append(heading, summary);
      results.append(link);
    }
    status.textContent = seen.size ? `${seen.size} matching page${seen.size === 1 ? '' : 's'}` : 'No matching pages. Try another term.';
  }

  async function search() {
    const query = input.value.trim();
    const request = ++generation;
    controller?.abort();
    if (!query) { results.replaceChildren(); setOpen(false); return; }
    const requestController = new AbortController();
    controller = requestController;
    const timeout = setTimeout(() => requestController.abort(), 10000);
    results.replaceChildren();
    status.textContent = 'Searching…';
    setOpen(true);
    try {
      const response = await fetch(`https://${applicationId}-dsn.algolia.net/1/indexes/${indexName}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Algolia-Application-Id': applicationId,
          'X-Algolia-API-Key': searchKey,
        },
        body: JSON.stringify({ query, hitsPerPage: 30, attributesToRetrieve: ['url', 'title', 'headers', 'content'], attributesToHighlight: [] }),
        signal: requestController.signal,
      });
      if (!response.ok) throw new Error('Search request failed');
      const data = await response.json();
      if (request !== generation) return;
      if (!Array.isArray(data.hits)) throw new Error('Invalid search response');
      render(data.hits, query);
    } catch {
      if (request === generation) status.textContent = 'Search is unavailable. Press Enter to retry.';
    } finally {
      clearTimeout(timeout);
    }
  }

  input.addEventListener('input', () => {
    generation++;
    controller?.abort();
    clearTimeout(timer);
    if (!input.value.trim()) { close(); return; }
    timer = setTimeout(search, 200);
  });
  form.addEventListener('submit', event => { event.preventDefault(); clearTimeout(timer); search(); });
  input.addEventListener('focus', () => { if (input.value.trim() && results.children.length) setOpen(true); });
  root.querySelector('button').addEventListener('click', () => { input.focus(); close(); });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') { input.focus(); close(); }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const links = [...results.querySelectorAll('a')];
    if (panel.hidden || !links.length) return;
    event.preventDefault();
    const position = links.indexOf(root.activeElement);
    if (event.key === 'ArrowDown') links[Math.min(position + 1, links.length - 1)].focus();
    else if (position <= 0) input.focus();
    else links[position - 1].focus();
  });
  document.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.isComposing || event.key.toLowerCase() !== 'k') return;
    event.preventDefault();
    input.focus();
    input.select();
  });
  document.addEventListener('pointerdown', event => { if (!event.composedPath().includes(host)) close(); });
})();
