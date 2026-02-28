import React from 'react';

type HeaderProps = {
  title?: string;
  dateText?: string;
  onSettings?: () => void;
};

export function Header({ title = '診療記録くん', dateText, onSettings }: HeaderProps) {
  return (
    <header>
      <div>{title}</div>
      <div>
        {dateText ? <span>{dateText}</span> : null}
        {onSettings ? (
          <button type="button" onClick={onSettings} aria-label="settings">
            ⚙
          </button>
        ) : null}
      </div>
    </header>
  );
}
