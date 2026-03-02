import React from 'react';
import styles from '../app.module.css';

type RehabToggleProps = {
  value: boolean | null;
  onChange: (value: boolean) => void;
};

export function RehabToggle({ value, onChange }: RehabToggleProps) {
  const isPending = value === null;
  return (
    <div className={styles['rehab-wrap']}>
      <button
        type="button"
        aria-pressed={value === true}
        className={`${styles['rehab-btn']} ${
          value === true ? styles['rehab-btn-yes'] : isPending ? styles['rehab-btn-pending'] : ''
        }`}
        onClick={() => onChange(true)}
      >
        あり
      </button>
      <button
        type="button"
        aria-pressed={value === false}
        className={`${styles['rehab-btn']} ${
          value === false ? styles['rehab-btn-no'] : isPending ? styles['rehab-btn-pending'] : ''
        }`}
        onClick={() => onChange(false)}
      >
        なし
      </button>
    </div>
  );
}
