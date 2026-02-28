import React from 'react';

type RehabToggleProps = {
  value: boolean | null;
  onChange: (value: boolean) => void;
};

export function RehabToggle({ value, onChange }: RehabToggleProps) {
  return (
    <div>
      <button
        type="button"
        aria-pressed={value === true}
        onClick={() => onChange(true)}
      >
        あり
      </button>
      <button
        type="button"
        aria-pressed={value === false}
        onClick={() => onChange(false)}
      >
        なし
      </button>
    </div>
  );
}
