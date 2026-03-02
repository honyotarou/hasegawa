import type { Mode } from '../../types';
import styles from '../app.module.css';

type ModeToggleProps = {
  mode: Mode;
  onToggle: (mode: Mode) => void;
};

export function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <div className={styles['mode-toggle']}>
      <button
        type="button"
        aria-pressed={mode === 'prod'}
        className={`${styles['mode-item']} ${mode === 'prod' ? styles['mode-item-active'] : ''}`}
        onClick={() => onToggle('prod')}
      >
        本番
      </button>
      <button
        type="button"
        aria-pressed={mode === 'dev'}
        className={`${styles['mode-item']} ${mode === 'dev' ? styles['mode-item-active'] : ''}`}
        onClick={() => onToggle('dev')}
      >
        開発
      </button>
    </div>
  );
}
