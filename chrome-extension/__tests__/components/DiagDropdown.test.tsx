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
    await userEvent.click(screen.getByLabelText('diag-input'));
    await userEvent.click(screen.getByRole('button', { name: /★\s*腰痛/ }));

    // Then
    expect(onChange).toHaveBeenLastCalledWith('腰痛');
  });

  test('入力中に候補を絞り込む', async () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange }));
    await userEvent.type(screen.getByLabelText('diag-input'), '肩');
    await userEvent.click(screen.getByRole('button', { name: /肩痛/ }));

    // Then
    expect(onChange).toHaveBeenLastCalledWith('肩痛');
    expect(screen.queryByRole('button', { name: /腰痛/ })).not.toBeInTheDocument();
  });

  test('未入力でフォーカスした時はよく使う候補のみ表示する', async () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange }));
    await userEvent.click(screen.getByLabelText('diag-input'));

    // Then
    expect(screen.getByText('よく使う')).toBeInTheDocument();
    expect(screen.queryByText('検索結果')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '肩痛' })).not.toBeInTheDocument();
  });

  test('左右指定を選んで候補を選択すると主診断へ反映する', async () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange }));
    await userEvent.click(screen.getByLabelText('diag-input'));
    await userEvent.selectOptions(screen.getByLabelText('diag-side'), '右');
    await userEvent.click(screen.getByRole('button', { name: /★\s*腰痛/ }));

    // Then
    expect(onChange).toHaveBeenLastCalledWith('腰痛（右）');
  });

  test('入力した病名を自由入力としてそのまま反映できる', async () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');
    const onChange = vi.fn();

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange }));
    await userEvent.type(screen.getByLabelText('diag-input'), '腓骨筋腱炎');

    // Then
    expect(onChange).toHaveBeenLastCalledWith('腓骨筋腱炎');
  });

  test('閉じた状態では補助テキストを増やさず入力欄だけを表示する', () => {
    // Given
    const DiagDropdown = (moduleDiag as any).DiagDropdown;
    expect(DiagDropdown).toBeTypeOf('function');

    // When
    render(React.createElement(DiagDropdown, { value: '', top5: ['腰痛'], rest: ['肩痛'], onChange: vi.fn() }));

    // Then
    expect(screen.getByLabelText('diag-input')).toBeInTheDocument();
    expect(screen.queryByText(/^選択中:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^候補:/)).not.toBeInTheDocument();
  });
});
