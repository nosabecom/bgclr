import { readFile } from 'node:fs/promises';
import { algoliasearch } from 'algoliasearch';
const { ALGOLIA_APP_ID: appId, ALGOLIA_WRITE_API_KEY: apiKey, ALGOLIA_INDEX_NAME: indexName } = process.env;
if (!appId || !apiKey || !indexName) throw new Error('Set ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY, and ALGOLIA_INDEX_NAME in .env.local first.');
const records = JSON.parse(await readFile('dist/records.json', 'utf8'));
const client = algoliasearch(appId, apiKey);
// Use a dedicated index. Stable IDs let subsequent runs update the same records.
const { taskID } = await client.setSettings({ indexName, indexSettings: {
  searchableAttributes: ['title', 'chapter', 'content'],
  attributesForFaceting: ['filterOnly(url)'],
  attributeForDistinct: 'url', distinct: 1,
  attributesToHighlight: ['title', 'content'],
  attributesToSnippet: ['content:35'],
} });
await client.waitForTask({ indexName, taskID });
await client.saveObjects({ indexName, objects: records, waitForTasks: true });
console.log(`Uploaded ${records.length} records to ${indexName}.`);
