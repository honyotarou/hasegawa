import { describe, expect, test } from 'vitest';
import { createGasContext } from './helpers/gasHarness';

function row(
  timestamp: string,
  age: number,
  gender: string,
  diagnosis0: string,
  rehab: boolean,
): any[] {
  return [
    timestamp,
    `hash-${timestamp}`,
    '12345',
    'batch-x',
    `client-${timestamp}`,
    age,
    gender,
    diagnosis0,
    '',
    '',
    '',
    '',
    '',
    rehab,
    '',
  ];
}

describe('GAS report contracts', () => {
  test('overallはN列を使ってリハ率を集計する', () => {
    // Given
    const rows = [
      row('2026-03-07T09:00:00', 42, '男性', '腰痛', true),
      row('2026-03-07T09:01:00', 55, '女性', '肩痛', false),
      row('2026-03-08T09:02:00', 33, '男性', '腰痛', true),
    ];
    const { context } = createGasContext([new Array(15).fill('header'), ...rows]);

    // When
    const result = context.calcOverallRehabRateForNewPatients(rows);

    // Then
    expect(result).toEqual({ total: 3, rehabTrue: 2, rate: 2 / 3 });
  });

  test('byDiagnosisはH列主診断ごとに集計する', () => {
    // Given
    const rows = [
      row('2026-03-07T09:00:00', 42, '男性', '腰痛', true),
      row('2026-03-07T09:01:00', 55, '女性', '腰痛', false),
      row('2026-03-08T09:02:00', 33, '男性', '肩痛', true),
    ];
    const { context } = createGasContext([new Array(15).fill('header'), ...rows]);

    // When
    const result = context.calcRehabRateByDiagnosis(rows);

    // Then
    expect(result).toEqual(
      expect.arrayContaining([
        { diagnosis: '腰痛', total: 2, rehabTrue: 1, rate: 0.5 },
        { diagnosis: '肩痛', total: 1, rehabTrue: 1, rate: 1 },
      ]),
    );
  });

  test('dailyはA列の日付でフィルタする', () => {
    // Given
    const rows = [
      row('2026-03-07T09:00:00', 42, '男性', '腰痛', true),
      row('2026-03-07T09:01:00', 55, '女性', '肩痛', false),
      row('2026-03-08T09:02:00', 33, '男性', '腰痛', true),
    ];
    const { context } = createGasContext([new Array(15).fill('header'), ...rows]);

    // When
    const result = context.calcDailyRehabRateForNewPatients('2026-03-07', rows);

    // Then
    expect(result).toEqual({ date: '2026-03-07', total: 2, rehabTrue: 1, rate: 0.5 });
  });

  test('byAgeAndSexはF列/G列/N列で年代順に集計する', () => {
    // Given
    const rows = [
      row('2026-03-07T09:00:00', 42, '男性', '腰痛', true),
      row('2026-03-07T09:01:00', 45, '男', '肩痛', false),
      row('2026-03-08T09:02:00', 91, '女性', '腰痛', true),
      row('2026-03-08T09:03:00', -1, 'unknown', '腰痛', false),
    ];
    const { context } = createGasContext([new Array(15).fill('header'), ...rows]);

    // When
    const result = context.calcRehabRateByAgeAndSex(rows);

    // Then
    expect(result).toEqual([
      { ageBand: '40代', sex: '男性', total: 2, rehabTrue: 1, rate: 0.5 },
      { ageBand: '90代+', sex: '女性', total: 1, rehabTrue: 1, rate: 1 },
      { ageBand: '不明', sex: 'その他', total: 1, rehabTrue: 0, rate: 0 },
    ]);
  });
});
