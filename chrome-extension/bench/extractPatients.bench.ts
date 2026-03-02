/* @vitest-environment jsdom */
import { bench, describe } from 'vitest';
import { extractPatientsFromDOM } from '../src/content/extractPatients';

const json40 = JSON.stringify(
  Array.from({ length: 40 }, (_, i) => ({
    age: 20 + (i % 70),
    gender: i % 2 === 0 ? '男' : '女',
  })),
);

describe('extractPatients benchmarks', () => {
  bench('parse latest pre>code json (40 records)', () => {
    document.body.innerHTML = `<pre><code>${json40}</code></pre>`;
    extractPatientsFromDOM();
  });
});
