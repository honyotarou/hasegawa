import React from 'react';
import styles from '../app.module.css';

type HeaderProps = {
  title?: string;
  dateText?: string;
  onSettings?: () => void;
};

export function Header({ title = '診療記録くん', dateText, onSettings }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles['header-left']}>
        <span className={styles['header-dot']} />
        <h1 className={styles['header-title']}>{title}</h1>
      </div>
      <div className={styles['header-right']}>
        {dateText ? <span className={styles['header-date']}>{dateText}</span> : null}
        {onSettings ? (
          <button
            type="button"
            className={styles['icon-btn']}
            onClick={onSettings}
            aria-label="settings"
          >
            ⚙
          </button>
        ) : null}
      </div>
    </header>
  );
}
