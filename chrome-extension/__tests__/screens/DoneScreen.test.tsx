import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as moduleDone from '../../src/popup/screens/DoneScreen';

describe('DoneScreen', () => {
  test('written/skipped/batchId を表示する', () => {
    // Given
    const DoneScreen = (moduleDone as any).DoneScreen;
    expect(DoneScreen).toBeTypeOf('function');

    // When
    render(
      React.createElement(DoneScreen, {
        result: {
          written: 6,
          skipped: 2,
          submittedAt: '2026/02/28 18:00:00',
          batchId: 'abcdefg-123',
        },
        dispatch: vi.fn(),
      }),
    );

    // Then
    expect(screen.getByText(/6件/)).toBeInTheDocument();
    expect(screen.getByText(/スキップ/)).toBeInTheDocument();
    expect(screen.getByText(/batchId/)).toBeInTheDocument();
  });

  test('resultがnullなら送信完了文言を表示する', () => {
    // Given
    const DoneScreen = (moduleDone as any).DoneScreen;
    expect(DoneScreen).toBeTypeOf('function');

    // When
    render(
      React.createElement(DoneScreen, {
        result: null,
        dispatch: vi.fn(),
      }),
    );

    // Then
    expect(screen.getByText('送信完了')).toBeInTheDocument();
  });

  test('ChatGPTから取得ボタン押下でMAIN遷移dispatchを呼ぶ', async () => {
    // Given
    const DoneScreen = (moduleDone as any).DoneScreen;
    expect(DoneScreen).toBeTypeOf('function');
    const dispatch = vi.fn();

    // When
    render(
      React.createElement(DoneScreen, {
        result: null,
        dispatch,
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'ChatGPTから取得' }));

    // Then
    expect(dispatch).toHaveBeenCalledWith({ type: 'GOTO_SCREEN', screen: 'MAIN' });
  });
});
