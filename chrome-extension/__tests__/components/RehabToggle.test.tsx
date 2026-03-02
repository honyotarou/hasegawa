import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as moduleToggle from '../../src/popup/components/RehabToggle';

describe('RehabToggle', () => {
  test('あり/なしクリックで onChange が呼ばれる', async () => {
    // Given
    const RehabToggle = (moduleToggle as any).RehabToggle;
    expect(RehabToggle).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(RehabToggle, { value: null, onChange }));
    await userEvent.click(screen.getByRole('button', { name: /あり/ }));
    await userEvent.click(screen.getByRole('button', { name: /なし/ }));

    // Then
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, false);
  });
});
