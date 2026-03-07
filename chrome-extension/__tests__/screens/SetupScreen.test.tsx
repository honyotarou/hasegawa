import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledTimes(1);
      expect(goToScreen).toHaveBeenCalledWith('MAIN');
    });
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

  test('saveSettings失敗時はエラーを表示して遷移しない', async () => {
    // Given
    const SetupScreen = (moduleSetup as any).SetupScreen;
    expect(SetupScreen).toBeTypeOf('function');
    const saveSettings = vi.fn().mockRejectedValue(new Error('保存失敗'));
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
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('保存失敗');
    });
    expect(goToScreen).not.toHaveBeenCalled();
  });

  test('開発URLが許可ドメイン外の場合は保存しない', async () => {
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
    await userEvent.type(screen.getByLabelText('gasUrlDev'), 'https://example.com/dev');
    await userEvent.type(screen.getByLabelText('doctorId'), '12345');
    await userEvent.type(screen.getByLabelText('apiSecret'), 'secret');
    await userEvent.type(screen.getByLabelText('diagnosisMaster'), '腰痛');
    await userEvent.click(screen.getByRole('button', { name: /保存|始める/ }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'GAS URL（開発）は script.google.com / script.googleusercontent.com のHTTPS URLを入力してください',
      ),
    ).toBeInTheDocument();
  });

  test('シークレットが空の場合は保存しない', async () => {
    // Given
    const SetupScreen = (moduleSetup as any).SetupScreen;
    expect(SetupScreen).toBeTypeOf('function');
    const saveSettings = vi.fn().mockResolvedValue(undefined);

    // When
    render(React.createElement(SetupScreen, { storage: { saveSettings }, goToScreen: vi.fn() }));
    await userEvent.type(
      screen.getByLabelText('gasUrlProd'),
      'https://script.google.com/macros/s/xxx/exec',
    );
    await userEvent.type(screen.getByLabelText('doctorId'), '12345');
    await userEvent.type(screen.getByLabelText('diagnosisMaster'), '腰痛');
    await userEvent.click(screen.getByRole('button', { name: /保存|始める/ }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('送信用シークレット（API_SECRET）は必須です');
  });

  test('社員番号が空の場合は保存しない', async () => {
    // Given
    const SetupScreen = (moduleSetup as any).SetupScreen;
    expect(SetupScreen).toBeTypeOf('function');
    const saveSettings = vi.fn().mockResolvedValue(undefined);

    // When
    render(React.createElement(SetupScreen, { storage: { saveSettings }, goToScreen: vi.fn() }));
    await userEvent.type(
      screen.getByLabelText('gasUrlProd'),
      'https://script.google.com/macros/s/xxx/exec',
    );
    await userEvent.type(screen.getByLabelText('apiSecret'), 'secret');
    await userEvent.type(screen.getByLabelText('diagnosisMaster'), '腰痛');
    await userEvent.click(screen.getByRole('button', { name: /保存|始める/ }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('社員番号は必須です');
  });

  test('社員番号の形式が不正な場合は保存しない', async () => {
    // Given
    const SetupScreen = (moduleSetup as any).SetupScreen;
    expect(SetupScreen).toBeTypeOf('function');
    const saveSettings = vi.fn().mockResolvedValue(undefined);

    // When
    render(React.createElement(SetupScreen, { storage: { saveSettings }, goToScreen: vi.fn() }));
    await userEvent.type(
      screen.getByLabelText('gasUrlProd'),
      'https://script.google.com/macros/s/xxx/exec',
    );
    await userEvent.type(screen.getByLabelText('apiSecret'), 'secret');
    await userEvent.type(screen.getByLabelText('doctorId'), '12 345');
    await userEvent.type(screen.getByLabelText('diagnosisMaster'), '腰痛');
    await userEvent.click(screen.getByRole('button', { name: /保存|始める/ }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '社員番号（医師ID）は英数字・ハイフン・アンダースコアのみ3〜32文字で入力してください',
    );
  });

  test('診断名マスタが空の場合は保存しない', async () => {
    // Given
    const SetupScreen = (moduleSetup as any).SetupScreen;
    expect(SetupScreen).toBeTypeOf('function');
    const saveSettings = vi.fn().mockResolvedValue(undefined);

    // When
    render(React.createElement(SetupScreen, { storage: { saveSettings }, goToScreen: vi.fn() }));
    await userEvent.type(
      screen.getByLabelText('gasUrlProd'),
      'https://script.google.com/macros/s/xxx/exec',
    );
    await userEvent.type(screen.getByLabelText('apiSecret'), 'secret');
    await userEvent.type(screen.getByLabelText('doctorId'), '12345');
    await userEvent.click(screen.getByRole('button', { name: /保存|始める/ }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('診断名を1件以上入力してください');
  });
});
