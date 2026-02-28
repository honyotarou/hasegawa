import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as moduleConfirm from '../../src/popup/screens/ConfirmScreen';

describe('ConfirmScreen', () => {
  test('戻るボタン押下で MAIN へ戻る dispatch が呼ばれる', async () => {
    // Given
    const ConfirmScreen = (moduleConfirm as any).ConfirmScreen;
    expect(ConfirmScreen).toBeTypeOf('function');
    const dispatch = vi.fn();

    // When
    render(
      React.createElement(ConfirmScreen, {
        state: {
          patients: [{ age: 10, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' }],
          currentBatchId: 'b1',
          mode: 'prod',
        },
        dispatch,
        storage: { settings: { gasUrlProd: 'https://prod', gasUrlDev: '' }, apiSecret: 's' },
        diagnosis: { incrementCounts: vi.fn() },
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: /戻って修正/ }));

    // Then
    expect(dispatch).toHaveBeenCalled();
  });
});
