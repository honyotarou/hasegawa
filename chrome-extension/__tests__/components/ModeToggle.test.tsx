import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ModeToggle } from '../../src/popup/components/ModeToggle';

describe('ModeToggle', () => {
  test('本番/開発のトグル押下でonToggleが呼ばれる', async () => {
    // Given
    const onToggle = vi.fn();

    // When
    render(<ModeToggle mode="prod" onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: '開発' }));
    await userEvent.click(screen.getByRole('button', { name: '本番' }));

    // Then
    expect(onToggle).toHaveBeenNthCalledWith(1, 'dev');
    expect(onToggle).toHaveBeenNthCalledWith(2, 'prod');
  });
});
