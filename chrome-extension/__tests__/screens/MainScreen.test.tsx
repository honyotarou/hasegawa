import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as moduleMain from '../../src/popup/screens/MainScreen';

function baseProps(overrides: any = {}) {
  return {
    state: {
      patients: [
        { age: 50, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' },
      ],
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
  });

  test('診断名未入力がある場合は送信ボタンが無効', () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');

    // When
    render(
      React.createElement(
        MainScreen,
        baseProps({ pendingCount: 1, pendingDiag: 1, canSubmit: false }),
      ),
    );

    // Then
    expect(screen.getByRole('button', { name: /全件送信/ })).toBeDisabled();
    expect(screen.getByText(/診断名未入力/)).toBeInTheDocument();
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
        baseProps({ storage: { settings: { gasUrlProd: 'https://prod', gasUrlDev: 'https://dev', diagnosisMaster: ['腰痛'] } } }),
      ),
    );

    // Then
    expect(screen.getByText(/開発/)).toBeInTheDocument();
  });

  test('次の未選択へボタンで scrollIntoView を呼ぶ', async () => {
    // Given
    const MainScreen = (moduleMain as any).MainScreen;
    expect(MainScreen).toBeTypeOf('function');
    const spy = vi.fn();
    Element.prototype.scrollIntoView = spy;

    // When
    render(
      React.createElement(
        MainScreen,
        baseProps({ pendingCount: 1, pendingRehab: 1, canSubmit: false }),
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: /次の未選択へ/ }));

    // Then
    expect(spy).toHaveBeenCalled();
  });
});
