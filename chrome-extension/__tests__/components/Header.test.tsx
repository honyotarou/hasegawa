import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { Header } from '../../src/popup/components/Header';

describe('Header', () => {
  test('title/date/settingsボタンを表示しクリックイベントを呼ぶ', async () => {
    // Given
    const onSettings = vi.fn();

    // When
    render(<Header title="診療記録くん" dateText="2026/02/28" onSettings={onSettings} />);
    await userEvent.click(screen.getByRole('button', { name: 'settings' }));

    // Then
    expect(screen.getByText('診療記録くん')).toBeInTheDocument();
    expect(screen.getByText('2026/02/28')).toBeInTheDocument();
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});
