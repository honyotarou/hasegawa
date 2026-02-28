import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as moduleSetup from '../../src/popup/screens/SetupScreen';

describe('SetupScreen', () => {
  test('必須項目未入力で保存するとエラー表示する', async () => {
    // Given
    const SetupScreen = (moduleSetup as any).SetupScreen;
    expect(SetupScreen).toBeTypeOf('function');
    const saveSettings = vi.fn();
    const goToScreen = vi.fn();

    // When
    render(React.createElement(SetupScreen, { storage: { saveSettings }, goToScreen }));
    await userEvent.click(screen.getByRole('button', { name: /保存|始める/ }));

    // Then
    expect(screen.getByText(/必須|入力/)).toBeInTheDocument();
    expect(saveSettings).not.toHaveBeenCalled();
  });
});
