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

  test('検索キーワードで候補を絞り込む', async () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange }));
    await userEvent.type(screen.getByLabelText('diag-search'), '肩');
    await userEvent.click(screen.getByRole('button', { name: /肩痛/ }));

    // Then
    expect(onChange).toHaveBeenCalledWith('肩痛');
    expect(screen.queryByRole('button', { name: /腰痛/ })).not.toBeInTheDocument();
  });
});
