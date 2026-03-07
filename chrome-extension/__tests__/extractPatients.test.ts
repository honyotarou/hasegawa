/* @vitest-environment jsdom */
import { describe, expect, test } from 'vitest';
import * as extractModule from '../src/content/extractPatients';

function runWithDom(html: string) {
  document.body.innerHTML = html;
  const extract = (extractModule as any).extractPatientsFromDOM;
  expect(extract).toBeTypeOf('function');
  return extract();
}

describe('extractPatientsFromDOM', () => {
  test('pre>code に配列JSONがある場合に抽出できる', () => {
    // Given
    const html = '<pre><code>[{"age":75,"gender":"男性"}]</code></pre>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 75, gender: '男性' }]);
  });

  test('code 単体から抽出できる', () => {
    // Given
    const html = '<code>[{"age":54,"gender":"女性"}]</code>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 54, gender: '女性' }]);
  });

  test('pre 単体から抽出できる', () => {
    // Given
    const html = '<pre>[{"age":40,"gender":"男性"}]</pre>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 40, gender: '男性' }]);
  });

  test('同一グループに複数ブロックがある場合は末尾を採用する', () => {
    // Given
    const html = [
      '<pre><code>[{"age":70,"gender":"男性"}]</code></pre>',
      '<pre><code>[{"age":71,"gender":"女性"}]</code></pre>',
    ].join('');

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 71, gender: '女性' }]);
  });

  test('グループ優先順は pre>code を優先する', () => {
    // Given
    const html = [
      '<code>[{"age":20,"gender":"男性"}]</code>',
      '<pre><code>[{"age":80,"gender":"女性"}]</code></pre>',
    ].join('');

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 80, gender: '女性' }]);
  });

  test('pre>code が無い場合 code 群の末尾を採用する', () => {
    // Given
    const html = [
      '<code>[{"age":31,"gender":"男性"}]</code>',
      '<code>[{"age":32,"gender":"女性"}]</code>',
    ].join('');

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 32, gender: '女性' }]);
  });

  test('JSONが存在しない場合は失敗する', () => {
    // Given
    const html = '<div>plain text</div>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON');
  });

  test('空配列は失敗する', () => {
    // Given
    const html = '<pre><code>[]</code></pre>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain('空');
  });

  test('age=0 は失敗する', () => {
    // Given
    const html = '<pre><code>[{"age":0,"gender":"男性"}]</code></pre>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain('age');
  });

  test('age=150 は成功する', () => {
    // Given
    const html = '<pre><code>[{"age":150,"gender":"女性"}]</code></pre>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 150, gender: '女性' }]);
  });

  test('age=1.5 は失敗する', () => {
    // Given
    const html = '<pre><code>[{"age":1.5,"gender":"女性"}]</code></pre>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain('age');
  });

  test('gender=男 は 男性 に正規化される', () => {
    // Given
    const html = '<pre><code>[{"age":40,"gender":"男"}]</code></pre>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 40, gender: '男性' }]);
  });

  test('gender=female は 女性 に正規化される', () => {
    // Given
    const html = '<pre><code>[{"age":40,"gender":"female"}]</code></pre>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 40, gender: '女性' }]);
  });

  test('gender=male は 男性 に正規化される', () => {
    // Given
    const html = '<pre><code>[{"age":40,"gender":"male"}]</code></pre>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 40, gender: '男性' }]);
  });

  test('壊れたJSONがある場合は同グループの次候補へ進む', () => {
    // Given
    const html = [
      '<pre><code>[{"age":75</code></pre>',
      '<pre><code>[{"age":42,"gender":"女性"}]</code></pre>',
    ].join('');

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 42, gender: '女性' }]);
  });

  test('pre/code がなく本文テキストにJSON配列がある場合も抽出できる', () => {
    // Given
    const html = '<main><article>診断メモ [{"age":27,"gender":"female"}] end</article></main>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 27, gender: '女性' }]);
  });

  test('fallback本文で患者配列でない候補は飛ばして後続の患者配列を採用する', () => {
    // Given
    const html = '<main><article>noise [1,2,3] text [{"age":28,"gender":"male"}]</article></main>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 28, gender: '男性' }]);
  });

  test('fallback本文で壊れた候補しかない場合はJSON未検出で失敗する', () => {
    // Given
    const html = '<main><article>broken [{"age":28,"gender":"male"</article></main>';

    // When
    const result = runWithDom(html);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toBe('JSONが見つかりません');
  });
});
