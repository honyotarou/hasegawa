import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as moduleConfirm from '../../src/popup/screens/ConfirmScreen';
import * as sendBatchModule from '../../src/sendBatch';

function baseProps(overrides: any = {}) {
  return {
    state: {
      patients: [
        { age: 10, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' },
      ],
      currentBatchId: 'b1',
      mode: 'prod',
      isSubmitting: false,
      ...overrides.state,
    },
    dispatch: vi.fn(),
    storage: {
      settings: { gasUrlProd: 'https://prod', gasUrlDev: 'https://dev', doctorId: '12345' },
      apiSecret: 's',
      ...overrides.storage,
    },
    diagnosis: {
      incrementCounts: vi.fn().mockResolvedValue(undefined),
      ...overrides.diagnosis,
    },
  };
}

describe('ConfirmScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('戻るボタン押下で MAIN へ戻る dispatch が呼ばれる', async () => {
    // Given
    const ConfirmScreen = (moduleConfirm as any).ConfirmScreen;
    expect(ConfirmScreen).toBeTypeOf('function');
    const props = baseProps();

    // When
    render(React.createElement(ConfirmScreen, props));
    await userEvent.click(screen.getByRole('button', { name: /戻って修正/ }));

    // Then
    expect(props.dispatch).toHaveBeenCalledWith({ type: 'GOTO_SCREEN', screen: 'MAIN' });
  });

  test('送信成功時は診断名カウント更新後にSUBMIT_SUCCESSをdispatchする', async () => {
    // Given
    const ConfirmScreen = (moduleConfirm as any).ConfirmScreen;
    expect(ConfirmScreen).toBeTypeOf('function');
    vi.spyOn(sendBatchModule, 'sendBatch').mockResolvedValue({ success: true, written: 1, skipped: 0 });
    const props = baseProps();

    // When
    render(React.createElement(ConfirmScreen, props));
    await userEvent.click(screen.getByRole('button', { name: '送信する' }));

    // Then
    await waitFor(() => {
      expect(sendBatchModule.sendBatch).toHaveBeenCalled();
      expect(props.diagnosis.incrementCounts).toHaveBeenCalledWith(['腰痛']);
      const submitSuccessCall = props.dispatch.mock.calls.find((c: any[]) => c[0]?.type === 'SUBMIT_SUCCESS');
      expect(submitSuccessCall).toBeTruthy();
    });
  });

  test('GAS success:false の場合はSUBMIT_ERRORをdispatchする', async () => {
    // Given
    const ConfirmScreen = (moduleConfirm as any).ConfirmScreen;
    expect(ConfirmScreen).toBeTypeOf('function');
    vi.spyOn(sendBatchModule, 'sendBatch').mockResolvedValue({ success: false, error: 'NG' });
    const props = baseProps();

    // When
    render(React.createElement(ConfirmScreen, props));
    await userEvent.click(screen.getByRole('button', { name: '送信する' }));

    // Then
    expect(props.dispatch).toHaveBeenCalledWith({ type: 'SUBMIT_ERROR', error: 'NG' });
  });

  test('AbortError の場合はタイムアウト文言でSUBMIT_ERRORをdispatchする', async () => {
    // Given
    const ConfirmScreen = (moduleConfirm as any).ConfirmScreen;
    expect(ConfirmScreen).toBeTypeOf('function');
    const err: any = new Error('abort');
    err.name = 'AbortError';
    vi.spyOn(sendBatchModule, 'sendBatch').mockRejectedValue(err);
    const props = baseProps();

    // When
    render(React.createElement(ConfirmScreen, props));
    await userEvent.click(screen.getByRole('button', { name: '送信する' }));

    // Then
    await waitFor(() => {
      const submitErrorCall = props.dispatch.mock.calls.find((c: any[]) => c[0]?.type === 'SUBMIT_ERROR');
      expect(submitErrorCall).toBeDefined();
      expect(submitErrorCall![0].error).toContain('タイムアウト');
    });
  });

  test('isSubmitting=true のとき送信ボタンはdisabled', () => {
    // Given
    const ConfirmScreen = (moduleConfirm as any).ConfirmScreen;
    expect(ConfirmScreen).toBeTypeOf('function');

    // When
    render(React.createElement(ConfirmScreen, baseProps({ state: { isSubmitting: true } })));

    // Then
    expect(screen.getByRole('button', { name: '送信中...' })).toBeDisabled();
  });
});
