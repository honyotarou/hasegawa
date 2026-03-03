import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { SettingsScreen } from '../../src/popup/screens/SettingsScreen';

describe('SettingsScreen', () => {
  test('保存で設定を保存しMAINへ戻る', async () => {
    // Given
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const goToScreen = vi.fn();

    const { container, getByRole } = render(
      <SettingsScreen
        storage={{
          settings: {
            gasUrlProd: 'https://script.google.com/macros/s/prod/exec',
            gasUrlDev: 'https://script.google.com/macros/s/dev/exec',
            doctorId: '123',
            diagnosisMaster: ['腰痛'],
          },
          apiSecret: 'secret',
          saveSettings,
        }}
        goToScreen={goToScreen}
      />,
    );

    const fields = container.querySelectorAll('input, textarea');

    // When
    await userEvent.clear(fields[0]);
    await userEvent.type(fields[0], 'https://script.google.com/macros/s/prod2/exec');
    await userEvent.click(getByRole('button', { name: '保存' }));

    // Then
    expect(saveSettings).toHaveBeenCalledTimes(1);
    expect(goToScreen).toHaveBeenCalledWith('MAIN');
  });

  test('保存失敗時は画面遷移しない', async () => {
    // Given
    const saveSettings = vi.fn().mockRejectedValue(new Error('save failed'));
    const goToScreen = vi.fn();

    const { getByRole } = render(
      <SettingsScreen
        storage={{
          settings: {
            gasUrlProd: 'https://script.google.com/macros/s/prod/exec',
            gasUrlDev: 'https://script.google.com/macros/s/dev/exec',
            doctorId: '123',
            diagnosisMaster: ['腰痛'],
          },
          apiSecret: 'secret',
          saveSettings,
        }}
        goToScreen={goToScreen}
      />,
    );

    // When
    await userEvent.click(getByRole('button', { name: '保存' }));

    // Then
    expect(saveSettings).toHaveBeenCalledTimes(1);
    expect(goToScreen).not.toHaveBeenCalled();
  });

  test('本番URLが空の場合は保存しない', async () => {
    // Given
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const goToScreen = vi.fn();

    render(
      <SettingsScreen
        storage={{
          settings: {
            gasUrlProd: '',
            gasUrlDev: 'https://script.google.com/macros/s/dev/exec',
            doctorId: '123',
            diagnosisMaster: ['腰痛'],
          },
          apiSecret: 'secret',
          saveSettings,
        }}
        goToScreen={goToScreen}
      />,
    );

    // When
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(goToScreen).not.toHaveBeenCalled();
    expect(screen.getByText('GAS URL（本番）は必須です')).toBeInTheDocument();
  });

  test('URLが許可ドメイン外の場合は保存しない', async () => {
    // Given
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const goToScreen = vi.fn();

    render(
      <SettingsScreen
        storage={{
          settings: {
            gasUrlProd: 'https://example.com',
            gasUrlDev: '',
            doctorId: '123',
            diagnosisMaster: ['腰痛'],
          },
          apiSecret: 'secret',
          saveSettings,
        }}
        goToScreen={goToScreen}
      />,
    );

    // When
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(goToScreen).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'GAS URL（本番）は script.google.com / script.googleusercontent.com のHTTPS URLを入力してください',
      ),
    ).toBeInTheDocument();
  });

  test('開発URLが許可ドメイン外の場合は保存しない', async () => {
    // Given
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const goToScreen = vi.fn();

    render(
      <SettingsScreen
        storage={{
          settings: {
            gasUrlProd: 'https://script.google.com/macros/s/prod/exec',
            gasUrlDev: 'https://example.com/dev',
            doctorId: '123',
            diagnosisMaster: ['腰痛'],
          },
          apiSecret: 'secret',
          saveSettings,
        }}
        goToScreen={goToScreen}
      />,
    );

    // When
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(goToScreen).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'GAS URL（開発）は script.google.com / script.googleusercontent.com のHTTPS URLを入力してください',
      ),
    ).toBeInTheDocument();
  });

  test('シークレットが空の場合は保存しない', async () => {
    // Given
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const goToScreen = vi.fn();

    render(
      <SettingsScreen
        storage={{
          settings: {
            gasUrlProd: 'https://script.google.com/macros/s/prod/exec',
            gasUrlDev: '',
            doctorId: '123',
            diagnosisMaster: ['腰痛'],
          },
          apiSecret: '',
          saveSettings,
        }}
        goToScreen={goToScreen}
      />,
    );

    // When
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(goToScreen).not.toHaveBeenCalled();
    expect(screen.getByText('送信用シークレット（API_SECRET）は必須です')).toBeInTheDocument();
  });

  test('社員番号が空の場合は保存しない', async () => {
    // Given
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const goToScreen = vi.fn();

    render(
      <SettingsScreen
        storage={{
          settings: {
            gasUrlProd: 'https://script.google.com/macros/s/prod/exec',
            gasUrlDev: '',
            doctorId: '',
            diagnosisMaster: ['腰痛'],
          },
          apiSecret: 'secret',
          saveSettings,
        }}
        goToScreen={goToScreen}
      />,
    );

    // When
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(goToScreen).not.toHaveBeenCalled();
    expect(screen.getByText('社員番号は必須です')).toBeInTheDocument();
  });

  test('診断名マスタが空の場合は保存しない', async () => {
    // Given
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const goToScreen = vi.fn();

    render(
      <SettingsScreen
        storage={{
          settings: {
            gasUrlProd: 'https://script.google.com/macros/s/prod/exec',
            gasUrlDev: '',
            doctorId: '123',
            diagnosisMaster: [],
          },
          apiSecret: 'secret',
          saveSettings,
        }}
        goToScreen={goToScreen}
      />,
    );

    // When
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    // Then
    expect(saveSettings).not.toHaveBeenCalled();
    expect(goToScreen).not.toHaveBeenCalled();
    expect(screen.getByText('診断名を1件以上入力してください')).toBeInTheDocument();
  });
});
