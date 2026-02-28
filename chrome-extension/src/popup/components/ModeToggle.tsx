import React from 'react';
import type { Mode } from '../../types';

type ModeToggleProps = {
  mode: Mode;
  onToggle: (mode: Mode) => void;
};

export function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <div>
      <button type="button" aria-pressed={mode === 'prod'} onClick={() => onToggle('prod')}>
        本番
      </button>
      <button type="button" aria-pressed={mode === 'dev'} onClick={() => onToggle('dev')}>
        開発
      </button>
    </div>
  );
}
