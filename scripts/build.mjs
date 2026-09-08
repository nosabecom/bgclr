import { readFile, writeFile, mkdir, cp, readdir } from 'node:fs/promises';
import { load } from 'cheerio';
import { build } from 'esbuild';

const compact = text => text.replace(/\s+/g, ' ').trim();
const records = [], chapters = [];
for (const file of (await readdir('public/bgclr')).filter(f => f.endsWith('.html') && f !== 'index.html').sort()) {
  const $ = load(await readFile(`public/bgclr/${file}`, 'utf8'));
  const heading = $('h1[data-number]').first();
  const chapter = compact(heading.text().replace(/^\s*[\d.]+\s*/, ''));
  chapters.push({ title: chapter, number: Number(heading.attr('data-number')), url: `/bgclr/${file}#${heading.attr('id')}` });
  $('script, style, nav, .footnote-back').remove();
  $('h1[id], h2[id], h3[data-number][id]').each((_, node) => {
    const h = $(node);
    const title = compact(h.text().replace(/^\s*[\d.]+\s*/, ''));
    const url = `/bgclr/${file}#${h.attr('id')}`;
    const pieces = [];
    let next = h.next();
    while (next.length && !next.is('h1, h2, h3[data-number]')) {
      if (!next.is('hr') && !next.find('a[rel="prev"], a[rel="next"]').length) pieces.push(next.text());
      next = next.next();
    }
    const content = compact(pieces.join(' '));
    // Keep records comfortably below Algolia's record-size limits.
    const words = content.split(' ');
    const chunks = [''];
    for (const word of words) {
      if (Buffer.byteLength(chunks.at(-1) + ' ' + word) > 5500) chunks.push('');
      chunks[chunks.length - 1] += (chunks.at(-1) ? ' ' : '') + word;
    }
    chunks.forEach((chunk, i) => records.push({ objectID: `${file}:${h.attr('id')}:${i}`, title, chapter, content: chunk, url }));
  });
}
chapters.sort((a, b) => a.number - b.number);
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await writeFile('dist/records.json', JSON.stringify(records));
await writeFile('dist/chapters.json', JSON.stringify(chapters));
await cp('app/index.html', 'dist/index.html');
await cp('app/style.css', 'dist/app.css');
await writeFile('dist/favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="6" fill="#162337"/><text x="24" y="34" text-anchor="middle" fill="white" font-family="monospace" font-size="34" font-weight="700">C</text></svg>');
await build({ entryPoints: ['app/main.mjs'], outfile: 'dist/app.js', bundle: true, minify: true, format: 'esm', target: 'es2022', define: {
  __ALGOLIA__: JSON.stringify({ appId: process.env.ALGOLIA_APP_ID || '', apiKey: process.env.ALGOLIA_SEARCH_API_KEY || '', indexName: process.env.ALGOLIA_INDEX_NAME || 'beej_c_reference' })
} });
console.log(`Built ${chapters.length} chapters and ${records.length} searchable records.`);
