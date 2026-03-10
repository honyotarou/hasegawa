import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { PatientRow } from '../../src/popup/components/PatientRow';

describe('PatientRow', () => {
  test('ageエラー表示と各入力のpatch反映', async () => {
    // Given
    const onPatch = vi.fn();
    render(
      <PatientRow
        index={0}
        patient={{ age: 0, gender: '男性', diagnoses: [''], rehab: null, remarks: '' }}
        top5={['腰痛']}
        rest={['肩痛']}
        onPatch={onPatch}
      />,
    );

    // When
    await userEvent.clear(screen.getByLabelText('age-0'));
    await userEvent.type(screen.getByLabelText('age-0'), '40');
    await userEvent.selectOptions(screen.getByLabelText('gender-0'), '女性');
    await userEvent.click(screen.getByLabelText('diag-trigger'));
    await userEvent.click(screen.getByRole('button', { name: /★\s*腰痛/ }));
    await userEvent.click(screen.getByRole('button', { name: 'あり' }));

    // Then
    expect(screen.getByText('年齢エラー')).toBeInTheDocument();
    expect(onPatch).toHaveBeenCalled();
    expect(screen.getByTestId('patient-row-0').getAttribute('data-pending')).toBe('true');
  });

  test('ageエラー単独でもpending行として扱う', () => {
    // Given
    const onPatch = vi.fn();

    // When
    render(
      <PatientRow
        index={0}
        patient={{ age: 0, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' }}
        top5={['腰痛']}
        rest={[]}
        onPatch={onPatch}
      />,
    );

    // Then
    expect(screen.getByText('年齢エラー')).toBeInTheDocument();
    expect(screen.getByTestId('patient-row-0').getAttribute('data-pending')).toBe('true');
  });

  test('削除ボタン押下で対象indexの削除を通知する', async () => {
    // Given
    const onPatch = vi.fn();
    const onRemove = vi.fn();
    render(
      <PatientRow
        {...({
          index: 1,
          patient: { age: 40, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' },
          top5: ['腰痛'],
          rest: [],
          onPatch,
          onRemove,
        } as any)}
      />,
    );

    // When
    await userEvent.click(screen.getByRole('button', { name: 'remove-1' }));

    // Then
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
