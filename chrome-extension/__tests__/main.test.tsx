import { describe, expect, test, vi } from 'vitest';

describe('popup main entry', () => {
  test('rootがある場合はcreateRoot().render()を呼ぶ', async () => {
    // Given
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    const renderMock = vi.fn();
    const createRootMock = vi.fn().mockReturnValue({ render: renderMock });

    vi.doMock('react-dom/client', () => ({
      default: {
        createRoot: createRootMock,
      },
    }));
    vi.doMock('../src/popup/App', () => ({ App: () => null }));

    // When
    await import('../src/popup/main');

    // Then
    expect(createRootMock).toHaveBeenCalledTimes(1);
    expect(renderMock).toHaveBeenCalledTimes(1);
  });

  test('rootがない場合は何もしない', async () => {
    // Given
    vi.resetModules();
    document.body.innerHTML = '<div id="other"></div>';
    const createRootMock = vi.fn();

    vi.doMock('react-dom/client', () => ({
      default: {
        createRoot: createRootMock,
      },
    }));
    vi.doMock('../src/popup/App', () => ({ App: () => null }));

    // When
    await import('../src/popup/main');

    // Then
    expect(createRootMock).not.toHaveBeenCalled();
  });
});
