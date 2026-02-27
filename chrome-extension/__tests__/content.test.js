/* @vitest-environment jsdom */
import { describe, expect, test } from "vitest";
import * as content from "../content.js";

function makeDoc(html) {
  document.body.innerHTML = html;
  return document;
}

describe("content.js extractPatientsFromDocument", () => {
  test("pre>code の配列JSONを抽出できる", () => {
    // Given
    const doc = makeDoc('<pre><code>[{"age":75,"gender":"男性"}]</code></pre>');

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 75, gender: "男性" }]);
  });

  test("pre>code が複数ある場合は最後の有効JSONを採用する", () => {
    // Given
    const doc = makeDoc(
      '<pre><code>[{"age":60,"gender":"男性"}]</code></pre>' +
        '<pre><code>[{"age":61,"gender":"女性"}]</code></pre>',
    );

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 61, gender: "女性" }]);
  });

  test("code 単体から抽出できる", () => {
    // Given
    const doc = makeDoc('<code>[{"age":54,"gender":"女性"}]</code>');

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 54, gender: "女性" }]);
  });

  test("pre 単体から抽出できる", () => {
    // Given
    const doc = makeDoc('<pre>[{"age":40,"gender":"男性"}]</pre>');

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 40, gender: "男性" }]);
  });

  test("pre>code と code 両方ある場合は pre>code を優先する", () => {
    // Given
    const doc = makeDoc(
      '<pre><code>[{"age":70,"gender":"男性"}]</code></pre>' +
        '<code>[{"age":20,"gender":"女性"}]</code>',
    );

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 70, gender: "男性" }]);
  });

  test("JSONが存在しない場合は失敗する", () => {
    // Given
    const doc = makeDoc("<div>hello</div>");

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain("JSON");
  });

  test("空配列は失敗する", () => {
    // Given
    const doc = makeDoc("<pre><code>[]</code></pre>");

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain("空");
  });

  test("age が 0 の場合は失敗する", () => {
    // Given
    const doc = makeDoc('<pre><code>[{"age":0,"gender":"男性"}]</code></pre>');

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain("age");
  });

  test("age が 150 は成功する", () => {
    // Given
    const doc = makeDoc('<pre><code>[{"age":150,"gender":"女性"}]</code></pre>');

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 150, gender: "女性" }]);
  });

  test("age が小数の場合は失敗する", () => {
    // Given
    const doc = makeDoc('<pre><code>[{"age":1.5,"gender":"男性"}]</code></pre>');

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain("age");
  });

  test("gender が 男 の場合は 男性 に正規化する", () => {
    // Given
    const doc = makeDoc('<pre><code>[{"age":40,"gender":"男"}]</code></pre>');

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 40, gender: "男性" }]);
  });

  test("gender が female の場合は その他 に正規化する", () => {
    // Given
    const doc = makeDoc('<pre><code>[{"age":40,"gender":"female"}]</code></pre>');

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 40, gender: "その他" }]);
  });

  test("壊れたJSONは次候補を試行する", () => {
    // Given
    const doc = makeDoc(
      "<pre><code>[{age: 75</code></pre>" +
        '<code>[{"age":41,"gender":"女性"}]</code>',
    );

    // When
    expect(content.extractPatientsFromDocument).toBeTypeOf("function");
    const result = content.extractPatientsFromDocument(doc);

    // Then
    expect(result.success).toBe(true);
    expect(result.patients).toEqual([{ age: 41, gender: "女性" }]);
  });
});
