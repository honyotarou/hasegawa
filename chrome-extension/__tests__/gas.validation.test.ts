import { describe, expect, test } from 'vitest';
import { createGasContext } from './helpers/gasHarness';

describe('GAS validation contract', () => {
  test('gender=male/female を 男性/女性 に正規化する', () => {
    // Given
    const { context } = createGasContext([new Array(15).fill('header')]);

    // When
    const male = context.validateAndNormalize({
      age: 42,
      gender: 'male',
      diagnoses: ['腰痛'],
      rehab: true,
      remarks: '',
    });
    const female = context.validateAndNormalize({
      age: 42,
      gender: 'female',
      diagnoses: ['腰痛'],
      rehab: true,
      remarks: '',
    });

    // Then
    expect(male.valid).toBe(true);
    expect(male.normalized.gender).toBe('男性');
    expect(female.valid).toBe(true);
    expect(female.normalized.gender).toBe('女性');
  });
});
