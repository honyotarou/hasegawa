import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as moduleMain from '../../src/popup/screens/MainScreen';

function baseProps(overrides: any = {}) {
  return {
    state: {
      patients: [{ age: 50, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' }],
      mode: 'prod',
      selectedDate: '2026-02-28',
    },
    dispatch: vi.fn(),
    storage: {
      settings: { gasUrlProd: 'https://prod', gasUrlDev: '', diagnosisMaster: ['腰痛'] },
    },
    pendingCount: 0,
    pendingRehab: 0,
    pendingDiag: 0,
    pendingAge: 0,
    canSubmit: true,
    diagnosis: { top5: ['腰痛'], rest: [], counts: {}, incrementCounts: vi.fn() },
    ...overrides,
  };
}

describe('MainScreen', () => {
  test('全員入力済みなら送信ボタンが有効', () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');

    // When
    render(React.createElement(MainScreen, baseProps()));

    // Then
    expect(screen.getByRole('button', { name: /全件送信/ })).toBeEnabled();
    expect(screen.getByText('未解決リスクを0件にしてから送信してください。')).toBeInTheDocument();
  });

  test('診断名未入力がある場合は送信ボタンが無効', () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');

    // When
    render(
      React.createElement(
        MainScreen,
        baseProps({ pendingCount: 1, pendingDiag: 1, pendingAge: 0, canSubmit: false }),
      ),
    );

    // Then
    expect(screen.getByRole('button', { name: /全件送信/ })).toBeDisabled();
    expect(screen.getByText(/未解決リスク: 1件/)).toBeInTheDocument();
    expect(screen.getByText(/診断名未入力: 1件/)).toBeInTheDocument();
  });

  test('gasUrlDev が空なら mode toggle を表示しない', () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');

    // When
    render(React.createElement(MainScreen, baseProps()));

    // Then
    expect(screen.queryByText(/開発/)).not.toBeInTheDocument();
  });

  test('gasUrlDev があるなら mode toggle を表示する', () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');

    // When
    render(
      React.createElement(
        MainScreen,
        baseProps({
          storage: {
            settings: {
              gasUrlProd: 'https://prod',
              gasUrlDev: 'https://dev',
              diagnosisMaster: ['腰痛'],
            },
          },
        }),
      ),
    );

    // Then
    expect(screen.getByText(/開発/)).toBeInTheDocument();
  });

  test('次の未解決へボタンで scrollIntoView を呼ぶ', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const spy = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = spy;

    // When
    render(
      React.createElement(
        MainScreen,
        baseProps({ pendingCount: 1, pendingRehab: 1, pendingDiag: 0, pendingAge: 0, canSubmit: false }),
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: /次の未解決へ/ }));

    // Then
    expect(spy).toHaveBeenCalled();
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  test('年齢エラー件数を未解決リスクに表示する', () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');

    // When
    render(
      React.createElement(
        MainScreen,
        baseProps({ pendingCount: 2, pendingRehab: 1, pendingDiag: 0, pendingAge: 1, canSubmit: false }),
      ),
    );

    // Then
    expect(screen.getByText(/未解決リスク: 2件/)).toBeInTheDocument();
    expect(screen.getByText(/年齢エラー: 1件/)).toBeInTheDocument();
  });

  test('ChatGPTから取得が失敗した場合はSUBMIT_ERRORをdispatchする', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();
    const chromeAny = (globalThis as any).chrome;
    chromeAny.tabs.query = vi.fn().mockResolvedValue([{ id: 99 }]);
    chromeAny.scripting.executeScript = vi.fn().mockResolvedValue([
      { result: { success: false, error: 'JSONが見つかりません' } },
    ]);

    // When
    render(React.createElement(MainScreen, baseProps({ dispatch })));
    await userEvent.click(screen.getByRole('button', { name: 'ChatGPTから取得' }));

    // Then
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'SUBMIT_ERROR',
        error: 'JSONが見つかりません',
      });
    });
  });

  test('アクティブタブがない場合はSUBMIT_ERRORをdispatchする', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();
    const chromeAny = (globalThis as any).chrome;
    chromeAny.tabs.query = vi.fn().mockResolvedValue([{}]);

    // When
    render(React.createElement(MainScreen, baseProps({ dispatch })));
    await userEvent.click(screen.getByRole('button', { name: 'ChatGPTから取得' }));

    // Then
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'SUBMIT_ERROR',
        error: 'アクティブなタブが見つかりません',
      });
    });
  });

  test('ChatGPTから取得が成功した場合はSET_PATIENTSをdispatchする', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();
    const chromeAny = (globalThis as any).chrome;
    chromeAny.tabs.query = vi.fn().mockResolvedValue([{ id: 99 }]);
    chromeAny.storage.session.set = vi.fn().mockResolvedValue(undefined);
    chromeAny.scripting.executeScript = vi.fn().mockResolvedValue([
      { result: { success: true, patients: [{ age: 72, gender: '男性' }] } },
    ]);

    // When
    render(React.createElement(MainScreen, baseProps({ dispatch })));
    await userEvent.click(screen.getByRole('button', { name: 'ChatGPTから取得' }));

    // Then
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalled();
    });
    const call = dispatch.mock.calls.find((c: any[]) => c[0]?.type === 'SET_PATIENTS');
    expect(call).toBeTruthy();
    expect(call[0].patients).toEqual([
      { age: 72, gender: '男性', diagnoses: [''], rehab: null, remarks: '' },
    ]);
  });

  test('restricted URL では executeScript を呼ばずに案内文言をdispatchする', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();
    const chromeAny = (globalThis as any).chrome;
    chromeAny.tabs.query = vi.fn().mockResolvedValue([{ id: 99, url: 'chrome://settings' }]);
    chromeAny.scripting.executeScript = vi.fn();

    // When
    render(React.createElement(MainScreen, baseProps({ dispatch })));
    await userEvent.click(screen.getByRole('button', { name: 'ChatGPTから取得' }));

    // Then
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'SUBMIT_ERROR',
        error: 'このページでは取得できません。ChatGPTの会話ページかJSON表示ページを開いてください。',
      });
    });
    expect(chromeAny.scripting.executeScript).not.toHaveBeenCalled();
  });

  test('日付変更でSET_DATEをdispatchする', () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();

    // When
    render(React.createElement(MainScreen, baseProps({ dispatch })));
    fireEvent.change(screen.getByLabelText('selected-date'), {
      target: { value: '2026-03-01' },
    });

    // Then
    const call = dispatch.mock.calls.find((c: any[]) => c[0]?.type === 'SET_DATE');
    expect(call).toBeTruthy();
  });

  test('年齢入力変更でUPDATE_PATIENTをdispatchする', () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();

    // When
    render(React.createElement(MainScreen, baseProps({ dispatch })));
    fireEvent.change(screen.getByLabelText('age-0'), { target: { value: '55' } });

    // Then
    const call = dispatch.mock.calls.find((c: any[]) => c[0]?.type === 'UPDATE_PATIENT');
    expect(call).toBeTruthy();
    expect(call[0]).toEqual({ type: 'UPDATE_PATIENT', index: 0, patch: { age: 55 } });
  });

  test('削除確認でOKしたときだけREMOVE_PATIENTをdispatchする', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    // When
    render(
      React.createElement(
        MainScreen,
        baseProps({
          dispatch,
          state: {
            patients: [
              { age: 50, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' },
              { age: 32, gender: '女性', diagnoses: ['肩痛'], rehab: false, remarks: '' },
            ],
            mode: 'prod',
            selectedDate: '2026-02-28',
          },
        }),
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: 'remove-1' }));

    // Then
    expect(confirmSpy).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_PATIENT', index: 1 });
    confirmSpy.mockRestore();
  });

  test('削除確認でキャンセルしたときはREMOVE_PATIENTをdispatchしない', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    // When
    render(
      React.createElement(
        MainScreen,
        baseProps({
          dispatch,
          state: {
            patients: [
              { age: 50, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' },
              { age: 32, gender: '女性', diagnoses: ['肩痛'], rehab: false, remarks: '' },
            ],
            mode: 'prod',
            selectedDate: '2026-02-28',
          },
        }),
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: 'remove-1' }));

    // Then
    expect(confirmSpy).toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'REMOVE_PATIENT', index: 1 });
    confirmSpy.mockRestore();
  });

  test('削除後にtoastを表示し元に戻すでINSERT_PATIENTをdispatchする', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const removedPatient = {
      age: 32,
      gender: '女性',
      diagnoses: ['肩痛'],
      rehab: false,
      remarks: '',
    };

    // When
    render(
      React.createElement(
        MainScreen,
        baseProps({
          dispatch,
          state: {
            patients: [
              { age: 50, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' },
              removedPatient,
            ],
            mode: 'prod',
            selectedDate: '2026-02-28',
          },
        }),
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: 'remove-1' }));

    // Then
    expect(screen.getByText('患者02を削除しました')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'undo-remove' })).toBeInTheDocument();

    // When
    await userEvent.click(screen.getByRole('button', { name: 'undo-remove' }));

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: 'INSERT_PATIENT',
      index: 1,
      patient: removedPatient,
    });
    expect(screen.queryByText('患者02を削除しました')).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  test('タブ取得処理で例外時はSUBMIT_ERRORをdispatchする', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const dispatch = vi.fn();
    const chromeAny = (globalThis as any).chrome;
    chromeAny.tabs.query = vi.fn().mockRejectedValue(new Error('query failed'));

    // When
    render(React.createElement(MainScreen, baseProps({ dispatch })));
    await userEvent.click(screen.getByRole('button', { name: 'ChatGPTから取得' }));

    // Then
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'SUBMIT_ERROR',
        error: 'query failed',
      });
    });
  });
});
