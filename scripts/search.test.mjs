import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { createSearch, safeGuideUrl } from '../app/search.mjs';
const records = JSON.parse(await readFile('dist/records.json', 'utf8'));
const search = createSearch(records);
test('common C names rank their own sections first', () => {
  for (const name of ['malloc', 'printf', 'fopen', 'strlen', 'realloc', 'memcpy']) {
    assert.ok(search(name)[0].title.includes(`${name}()`), name);
  }
});
test('prefixes, typos, phrases, and empty results', () => {
  assert.ok(search('mallo')[0].title.includes('malloc'));
  assert.ok(search('maloc').some(hit => hit.title.includes('malloc')));
  assert.ok(search('memory allocation').length);
  assert.equal(search('zzqzzqzzqzzqzzq').length, 0);
});
test('every search result points to an existing anchor and fits Algolia', async () => {
  const pages = new Map();
  for (const record of records) {
    assert.ok(Buffer.byteLength(JSON.stringify(record)) < 10000, record.objectID);
    const [file, anchor] = record.url.split('#');
    if (!pages.has(file)) pages.set(file, load(await readFile(`dist${file}`, 'utf8')));
    assert.ok(pages.get(file)(`[id="${anchor}"]`).length, record.url);
  }
});
test('guide links cannot navigate the reader outside the mirrored guide', () => {
  assert.equal(safeGuideUrl('/bgclr/stdlib.html#man-malloc', 'https://c.nosa.dev'), '/bgclr/stdlib.html#man-malloc');
  for (const value of ['https://evil.example/bgclr/stdlib.html', 'javascript:alert(1)', '/other.html']) {
    assert.throws(() => safeGuideUrl(value, 'https://c.nosa.dev'));
  }
});
