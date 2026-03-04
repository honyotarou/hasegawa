import { useEffect, useMemo, useState } from 'react';
import styles from '../app.module.css';

type DiagDropdownProps = {
  value: string;
  top5: string[];
  rest: string[];
  onChange: (value: string) => void;
};

type DiagnosisSide = '' | '右' | '左';

function splitDiagnosis(value: string): { name: string; side: DiagnosisSide } {
  const trimmed = value.trim();
  if (!trimmed) return { name: '', side: '' };
  if (trimmed.endsWith('（右）')) {
    return { name: trimmed.slice(0, -3).trim(), side: '右' };
  }
  if (trimmed.endsWith('（左）')) {
    return { name: trimmed.slice(0, -3).trim(), side: '左' };
  }
  return { name: trimmed, side: '' };
}

function formatDiagnosis(name: string, side: DiagnosisSide): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return side ? `${trimmed}（${side}）` : trimmed;
}

export function DiagDropdown({ value, top5, rest, onChange }: DiagDropdownProps) {
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => splitDiagnosis(value), [value]);
  const [side, setSide] = useState<DiagnosisSide>(parsed.side);

  const merged = useMemo(() => [...top5, ...rest], [top5, rest]);
  const hasKeyword = keyword.trim().length > 0;

  useEffect(() => {
    setSide(parsed.side);
  }, [parsed.side]);

  const options = useMemo(() => {
    if (!hasKeyword) return [];
    const needle = keyword.trim();
    return merged.filter((name) => name.includes(needle));
  }, [merged, keyword, hasKeyword]);

  function applyDiagnosis(rawName: string): void {
    const next = formatDiagnosis(rawName, side);
    if (!next) return;
    onChange(next);
    setOpen(false);
    setKeyword('');
  }

  function handleSideChange(nextSide: DiagnosisSide): void {
    setSide(nextSide);
    if (parsed.name) {
      onChange(formatDiagnosis(parsed.name, nextSide));
    }
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
          <div className={styles['diag-side-row']}>
            <span className={styles['diag-side-label']}>左右</span>
            <select
              aria-label="diag-side"
              className={styles['diag-side-select']}
              value={side}
              onChange={(e) => handleSideChange(e.target.value as DiagnosisSide)}
            >
              <option value="">指定なし</option>
              <option value="右">右</option>
              <option value="左">左</option>
            </select>
          </div>
          <input
            aria-label="diag-search"
            className={styles['diag-search']}
            placeholder="診断名検索 / 自由入力..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {hasKeyword ? (
            <button
              type="button"
              className={styles['diag-free-btn']}
              onClick={() => applyDiagnosis(keyword)}
            >
              「{keyword.trim()}」を入力
            </button>
          ) : null}
          {!hasKeyword && top5.length > 0 ? (
            <>
              <div className={styles['diag-section-label']}>よく使う</div>
              <div className={styles['diag-list']}>
                {top5.map((name, idx) => (
                  <button
                    key={`top-${name}-${idx}`}
                    type="button"
                    className={`${styles['diag-item']} ${parsed.name === name ? styles['diag-item-active'] : ''}`}
                    onClick={() => applyDiagnosis(name)}
                  >
                    ★ {name}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {hasKeyword ? (
            <>
              <div className={styles['diag-section-label']}>検索結果</div>
              <div className={styles['diag-list']}>
                {options.map((name, idx) => (
                  <button
                    key={`${name}-${idx}`}
                    type="button"
                    className={`${styles['diag-item']} ${parsed.name === name ? styles['diag-item-active'] : ''}`}
                    onClick={() => applyDiagnosis(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {options.length === 0 ? <div className={styles['diag-selected']}>該当なし</div> : null}
            </>
          ) : null}
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
