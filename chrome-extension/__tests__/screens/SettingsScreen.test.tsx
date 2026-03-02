import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
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
});
