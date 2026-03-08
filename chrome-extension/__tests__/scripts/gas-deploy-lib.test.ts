import { describe, expect, test } from 'vitest';
// @ts-ignore mjs utility module is loaded at runtime in tests.
import {
  normalizeDeploymentId,
  parseCreatedVersion,
  parseManagedDeploymentConfig,
  resolveManagedDeploymentId,
  serializeManagedDeploymentConfig,
} from '../../scripts/gas-deploy-lib.mjs';

describe('gas-deploy-lib', () => {
  test('deployment id は英数字と記号のみを許可して trim する', () => {
    // Given
    const raw = '  AKfycbx_123-ABC  ';
    const invalid = 'AKfyc bw';

    // When
    const normalized = normalizeDeploymentId(raw);
    const rejected = normalizeDeploymentId(invalid);

    // Then
    expect(normalized).toBe('AKfycbx_123-ABC');
    expect(rejected).toBe('');
  });

  test('managed deployment config から deploymentId を読み取る', () => {
    // Given
    const text = JSON.stringify({
      deploymentId: 'AKfycbxManaged123',
      updatedAt: '2026-03-08T12:00:00.000Z',
    });

    // When
    const result = parseManagedDeploymentConfig(text);

    // Then
    expect(result).toEqual({
      deploymentId: 'AKfycbxManaged123',
      updatedAt: '2026-03-08T12:00:00.000Z',
    });
  });

  test('managed deployment config が壊れていても null 扱いにする', () => {
    // Given
    const invalidJson = '{';
    const invalidShape = JSON.stringify({ deploymentId: 'bad id' });

    // When
    const broken = parseManagedDeploymentConfig(invalidJson);
    const shape = parseManagedDeploymentConfig(invalidShape);

    // Then
    expect(broken).toEqual({ deploymentId: null, updatedAt: null });
    expect(shape).toEqual({ deploymentId: null, updatedAt: null });
  });

  test('env の deployment id を config より優先する', () => {
    // Given
    const configText = JSON.stringify({
      deploymentId: 'AKfycbxManaged123',
      updatedAt: '2026-03-08T12:00:00.000Z',
    });

    // When
    const envFirst = resolveManagedDeploymentId({
      envDeploymentId: 'AKfycbxEnv999',
      configText,
    });
    const configFallback = resolveManagedDeploymentId({
      envDeploymentId: '',
      configText,
    });
    const none = resolveManagedDeploymentId({
      envDeploymentId: '',
      configText: '',
    });

    // Then
    expect(envFirst).toEqual({ deploymentId: 'AKfycbxEnv999', source: 'env' });
    expect(configFallback).toEqual({ deploymentId: 'AKfycbxManaged123', source: 'config' });
    expect(none).toEqual({ deploymentId: null, source: null });
  });

  test('clasp version 出力から version number を抽出する', () => {
    // Given
    const output = 'Created version 12';

    // When
    const version = parseCreatedVersion(output);

    // Then
    expect(version).toBe('12');
  });

  test('clasp version 出力が想定外ならエラーにする', () => {
    // Given
    const output = 'version created';

    // When / Then
    expect(() => parseCreatedVersion(output)).toThrow('Failed to parse clasp version output');
  });

  test('managed deployment config は安定フォーマットで保存する', () => {
    // Given
    const before = '2026-03-08T12:00:00.000Z';

    // When
    const serialized = serializeManagedDeploymentConfig({
      deploymentId: 'AKfycbxManaged123',
      updatedAt: before,
    });

    // Then
    expect(serialized).toContain('"deploymentId": "AKfycbxManaged123"');
    expect(serialized).toContain('"updatedAt": "2026-03-08T12:00:00.000Z"');
    expect(serialized.endsWith('\n')).toBe(true);
  });
});
