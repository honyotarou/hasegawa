import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as moduleDiag from '../../src/popup/components/DiagDropdown';

describe('DiagDropdown', () => {
  test('候補クリックで onChange を呼ぶ', async () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange }));
    await userEvent.click(screen.getByRole('button', { name: /腰痛/ }));

    // Then
    expect(onChange).toHaveBeenCalledWith('腰痛');
  });
});
