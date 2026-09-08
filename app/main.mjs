import { liteClient } from 'algoliasearch/lite';
import { createSearch, safeGuideUrl } from './search.mjs';

const config = __ALGOLIA__;
const algolia = config.appId && config.apiKey ? liteClient(config.appId, config.apiKey) : null;
const query = document.querySelector('#query');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const reader = document.querySelector('#reader');
const standalone = document.querySelector('#standalone');
const title = document.querySelector('#current-title');
const engine = document.querySelector('#engine');
const clear = document.querySelector('#clear');
let localSearch, chapters = [], sequence = 0, visible = 30, currentHits = [], timer;

const getJson = async path => {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Could not load the reference');
  return response.json();
};
const localReady = getJson('/records.json').then(records => { localSearch = createSearch(records); });
// The error is displayed when search is used; don't leave an unhandled rejection.
localReady.catch(() => {});

function highlighted(text, needle) {
  const fragment = document.createDocumentFragment();
  const terms = needle.toLowerCase().match(/[a-z0-9_]+/g) || [];
  const expression = terms.length ? new RegExp(`(${terms.join('|')})`, 'gi') : null;
  for (const part of expression ? text.split(expression) : [text]) {
    if (terms.includes(part.toLowerCase())) {
      const mark = document.createElement('mark'); mark.textContent = part; fragment.append(mark);
    } else fragment.append(document.createTextNode(part));
  }
  return fragment;
}
function excerpt(content, needle) {
  const term = (needle.toLowerCase().match(/[a-z0-9_]+/g) || [])[0];
  const position = term ? content.toLowerCase().indexOf(term) : 0;
  const start = Math.max(0, position - 55);
  return (start ? '…' : '') + content.slice(start, start + 180) + (content.length > start + 180 ? '…' : '');
}
function openGuide(value, label, push = true) {
  let url;
  try { url = safeGuideUrl(value, location.origin); } catch { return; }
  reader.src = url;
  standalone.href = url;
  if (label) title.textContent = label;
  if (push) {
    const address = new URL(location.href);
    address.searchParams.set('page', url);
    history.pushState(null, '', address);
  }
  for (const link of results.querySelectorAll('.result')) {
    if (link.dataset.url === url) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  if (matchMedia('(max-width:760px)').matches) reader.scrollIntoView({ block: 'start' });
}
function resultLink(hit, browsing = false) {
  const link = document.createElement('a');
  link.className = 'result';
  try { link.href = safeGuideUrl(hit.url, location.origin); } catch { return document.createDocumentFragment(); }
  link.dataset.url = hit.url;
  link.target = 'reader';
  const strong = document.createElement('strong');
  strong.append(highlighted(hit.title, browsing ? '' : query.value));
  if (browsing) {
    link.classList.add('chapter-link');
    const number = document.createElement('span'); number.className = 'number'; number.textContent = String(hit.number).padStart(2, '0');
    link.append(number, strong);
  } else {
    const chapter = document.createElement('span'); chapter.className = 'chapter'; chapter.textContent = hit.chapter;
    const summary = document.createElement('p'); summary.append(highlighted(excerpt(hit.content || '', query.value), query.value));
    link.append(chapter, strong, summary);
  }
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); openGuide(hit.url, hit.title);
  });
  return link;
}
function renderHits() {
  results.replaceChildren(...currentHits.slice(0, visible).map(hit => resultLink(hit)));
  if (!currentHits.length) {
    const empty = document.createElement('p'); empty.className = 'empty';
    empty.textContent = 'No matches. Try a function name, header, or a shorter phrase.'; results.append(empty);
  }
  if (currentHits.length > visible) {
    const more = document.createElement('button'); more.id = 'more'; more.textContent = 'Show more results';
    more.addEventListener('click', () => { visible += 30; renderHits(); }); results.append(more);
  }
}
async function search() {
  const request = ++sequence;
  const value = query.value.trim(); clear.hidden = !value;
  const address = new URL(location.href);
  if (value) address.searchParams.set('q', value); else address.searchParams.delete('q');
  history.replaceState(null, '', address);
  if (!value) {
    status.textContent = `${chapters.length} chapters`;
    results.replaceChildren(...chapters.map(chapter => resultLink(chapter, true)));
    return;
  }
  status.textContent = 'Searching…';
  let hits;
  try {
    if (algolia) {
      try {
        const response = await algolia.searchSingleIndex({ indexName: config.indexName, searchParams: {
          query: value, hitsPerPage: 100, attributesToRetrieve: ['title', 'chapter', 'content', 'url'], distinct: 1,
        } });
        hits = response.hits;
        if (request === sequence) engine.textContent = 'Search by Algolia';
      } catch {
        await localReady; hits = localSearch(value);
        if (request === sequence) engine.textContent = 'Local search · Algolia unavailable';
      }
    } else {
      await localReady; hits = localSearch(value);
      if (request === sequence) engine.textContent = 'Local search';
    }
    if (request !== sequence) return;
    const seen = new Set(); currentHits = hits.filter(hit => !seen.has(hit.url) && seen.add(hit.url));
    visible = 30; status.textContent = `${currentHits.length}${algolia && currentHits.length === 100 ? '+' : ''} result${currentHits.length === 1 ? '' : 's'}`;
    renderHits();
  } catch {
    if (request !== sequence) return;
    status.textContent = 'Search could not load. Please refresh.';
    results.replaceChildren(...chapters.map(chapter => resultLink(chapter, true)));
  }
}
query.addEventListener('input', () => { ++sequence; clearTimeout(timer); timer = setTimeout(search, 160); });
query.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown') { event.preventDefault(); results.querySelector('a')?.focus(); }
  if (event.key === 'Enter') { event.preventDefault(); clearTimeout(timer); search(); }
  if (event.key === 'Escape') { query.value = ''; clearTimeout(timer); search(); }
});
results.addEventListener('keydown', event => {
  const links = [...results.querySelectorAll('a')]; const index = links.indexOf(document.activeElement);
  if (event.key === 'ArrowDown') { event.preventDefault(); links[Math.min(index + 1, links.length - 1)]?.focus(); }
  if (event.key === 'ArrowUp') { event.preventDefault(); if (index <= 0) query.focus(); else links[index - 1]?.focus(); }
  if (event.key === 'Escape') query.focus();
});
function shortcut(event) {
  if ((event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) && !event.target.isContentEditable) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
    event.preventDefault(); query.focus(); query.select();
  }
}
document.addEventListener('keydown', shortcut);
clear.addEventListener('click', () => { query.value = ''; clearTimeout(timer); search(); query.focus(); });
reader.addEventListener('load', () => {
  try {
    const doc = reader.contentDocument;
    const url = safeGuideUrl(reader.contentWindow.location.href, location.origin);
    standalone.href = url;
    doc.addEventListener('keydown', shortcut);
    doc.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = new URL(link.getAttribute('href'), reader.contentWindow.location.href);
      if (target.origin !== location.origin) { link.target = '_blank'; link.rel = 'noreferrer'; return; }
      try { safeGuideUrl(target.href, location.origin); } catch { return; }
      event.preventDefault(); openGuide(target.href, link.textContent.trim());
    });
  } catch { /* An external link can always be opened separately. */ }
});
function restorePage() {
  const params = new URLSearchParams(location.search);
  query.value = params.get('q') || '';
  openGuide(params.get('page') || '/bgclr/index.html', 'Beej’s Guide to C · Library Reference', false);
  search();
}
window.addEventListener('popstate', restorePage);
getJson('/chapters.json').then(data => {
  chapters = data; engine.textContent = algolia ? 'Search by Algolia' : 'Local search'; restorePage();
}).catch(() => { status.textContent = 'Contents could not load. Open the guide on the right.'; });
