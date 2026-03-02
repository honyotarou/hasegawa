import { useMemo, useState } from 'react';
import styles from '../app.module.css';

type DiagDropdownProps = {
  value: string;
  top5: string[];
  rest: string[];
  onChange: (value: string) => void;
};

export function DiagDropdown({ value, top5, rest, onChange }: DiagDropdownProps) {
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);

  const merged = useMemo(() => [...top5, ...rest], [top5, rest]);

  const options = useMemo(() => {
    if (!keyword.trim()) return merged;
    return merged.filter((name) => name.includes(keyword.trim()));
  }, [merged, keyword]);

  function handleSelect(name: string): void {
    onChange(name);
    setOpen(false);
    setKeyword('');
  }

  return (
    <div className={`${styles['diag-wrap']} ${!value.trim() ? styles['diag-pending'] : ''}`}>
      <button
        type="button"
        aria-label="diag-trigger"
        className={styles['diag-trigger']}
        onClick={() => setOpen((v) => !v)}
      >
        {value || '診断名を選択...'}
      </button>
      {open ? (
        <div className={styles['diag-panel']}>
          <input
            aria-label="diag-search"
            className={styles['diag-search']}
            placeholder="診断名検索..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {!keyword.trim() && top5.length > 0 ? (
            <>
              <div className={styles['diag-section-label']}>よく使う</div>
              <div className={styles['diag-list']}>
                {top5.map((name, idx) => (
                  <button
                    key={`top-${name}-${idx}`}
                    type="button"
                    className={`${styles['diag-item']} ${value === name ? styles['diag-item-active'] : ''}`}
                    onClick={() => handleSelect(name)}
                  >
                    ★ {name}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <div className={styles['diag-section-label']}>一覧</div>
          <div className={styles['diag-list']}>
            {options.map((name, idx) => (
              <button
                key={`${name}-${idx}`}
                type="button"
                className={`${styles['diag-item']} ${value === name ? styles['diag-item-active'] : ''}`}
                onClick={() => handleSelect(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles['diag-selected']}>選択中: {value || '未選択'}</div>
      )}
      <div className={styles['diag-selected']}>
        候補: {merged.length}件
      </div>
    </div>
  );
}
