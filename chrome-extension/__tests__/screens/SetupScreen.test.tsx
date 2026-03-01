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
    expect(screen.getByRole('alert')).toHaveTextContent('GAS URL（本番）は必須です');
    expect(saveSettings).not.toHaveBeenCalled();
  });

  test('必須項目を入力して保存するとMAINへ遷移する', async () => {
    // Given
    const SetupScreen = (moduleSetup as any).SetupScreen;
    expect(SetupScreen).toBeTypeOf('function');
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const goToScreen = vi.fn();

    // When
    render(React.createElement(SetupScreen, { storage: { saveSettings }, goToScreen }));
    await userEvent.type(
      screen.getByLabelText('gasUrlProd'),
      'https://script.google.com/macros/s/xxx/exec',
    );
    await userEvent.type(screen.getByLabelText('doctorId'), '12345');
    await userEvent.type(screen.getByLabelText('apiSecret'), 'secret');
    await userEvent.type(screen.getByLabelText('diagnosisMaster'), '腰痛');
    await userEvent.click(screen.getByRole('button', { name: /保存|始める/ }));

    // Then
    expect(saveSettings).toHaveBeenCalledTimes(1);
    expect(goToScreen).toHaveBeenCalledWith('MAIN');
  });

  test('URL形式が不正な場合は保存せずエラー表示する', async () => {
    // Given
    const SetupScreen = (moduleSetup as any).SetupScreen;
    expect(SetupScreen).toBeTypeOf('function');
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const goToScreen = vi.fn();

    // When
    render(React.createElement(SetupScreen, { storage: { saveSettings }, goToScreen }));
    await userEvent.type(screen.getByLabelText('gasUrlProd'), 'http://example.com');
    await userEvent.type(screen.getByLabelText('doctorId'), '12345');
    await userEvent.type(screen.getByLabelText('apiSecret'), 'secret');
    await userEvent.type(screen.getByLabelText('diagnosisMaster'), '腰痛');
    await userEvent.click(screen.getByRole('button', { name: /保存|始める/ }));

    // Then
    expect(screen.getByText(/script\.google\.com/)).toBeInTheDocument();
    expect(saveSettings).not.toHaveBeenCalled();
  });

  test('シークレット表示切替ボタンで入力typeが変わる', async () => {
    // Given
    const SetupScreen = (moduleSetup as any).SetupScreen;
    expect(SetupScreen).toBeTypeOf('function');

    // When
    render(React.createElement(SetupScreen, { storage: { saveSettings: vi.fn() }, goToScreen: vi.fn() }));
    const secretInput = screen.getByLabelText('apiSecret');
    expect(secretInput).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: '表示' }));

    // Then
    expect(secretInput).toHaveAttribute('type', 'text');
  });
});
