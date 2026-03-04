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
    await userEvent.click(screen.getByLabelText('diag-trigger'));
    await userEvent.click(screen.getByRole('button', { name: /★\s*腰痛/ }));

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
    await userEvent.click(screen.getByLabelText('diag-trigger'));
    await userEvent.type(screen.getByLabelText('diag-search'), '肩');
    await userEvent.click(screen.getByRole('button', { name: /肩痛/ }));

    // Then
    expect(onChange).toHaveBeenCalledWith('肩痛');
    expect(screen.queryByRole('button', { name: /腰痛/ })).not.toBeInTheDocument();
  });

  test('キーワード未入力時は一覧を出さず、よく使うのみ表示する', async () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange }));
    await userEvent.click(screen.getByLabelText('diag-trigger'));

    // Then
    expect(screen.getByText('よく使う')).toBeInTheDocument();
    expect(screen.queryByText('一覧')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '肩痛' })).not.toBeInTheDocument();
  });

  test('左右指定を選んで候補を選択すると主診断へ反映する', async () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange }));
    await userEvent.click(screen.getByLabelText('diag-trigger'));
    await userEvent.selectOptions(screen.getByLabelText('diag-side'), '右');
    await userEvent.click(screen.getByRole('button', { name: /★\s*腰痛/ }));

    // Then
    expect(onChange).toHaveBeenCalledWith('腰痛（右）');
  });

  test('検索欄へ入力した病名を自由入力として反映できる', async () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange }));
    await userEvent.click(screen.getByLabelText('diag-trigger'));
    await userEvent.type(screen.getByLabelText('diag-search'), '腓骨筋腱炎');
    await userEvent.click(screen.getByRole('button', { name: '「腓骨筋腱炎」を入力' }));

    // Then
    expect(onChange).toHaveBeenCalledWith('腓骨筋腱炎');
  });
});
