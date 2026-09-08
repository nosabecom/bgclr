import MiniSearch from 'minisearch';

export function createSearch(records) {
  const search = new MiniSearch({
    idField: 'objectID', fields: ['title', 'chapter', 'content'],
    storeFields: ['title', 'chapter', 'content', 'url'],
    searchOptions: { boost: { title: 12, chapter: 2 }, prefix: true, fuzzy: 0.15, combineWith: 'AND' },
  });
  search.addAll(records);
  return (query) => {
    const seen = new Set();
    const exact = query.trim().toLowerCase().replace(/[()]/g, '');
    return search.search(query).sort((a, b) => {
      const isExact = (hit) => hit.title.toLowerCase().split(/[^a-z0-9_]+/).includes(exact);
      return Number(isExact(b)) - Number(isExact(a)) || b.score - a.score;
    }).filter(hit => !seen.has(hit.url) && seen.add(hit.url));
  };
}

export function safeGuideUrl(value, origin) {
  const url = new URL(value, origin);
  if (url.origin !== origin || !/^\/bgclr\/[a-z0-9-]+\.html$/.test(url.pathname)) throw new Error('Invalid guide link');
  return url.pathname + url.hash;
}
