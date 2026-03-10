import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../app.module.css';

type DiagDropdownProps = {
  value: string;
  top5: string[];
  rest: string[];
  onChange: (value: string) => void;
  inputLabel?: string;
  sideLabel?: string;
};

type DiagnosisSide = '' | '右' | '左';

const DEFAULT_INPUT_LABEL = 'diag-input';
const DEFAULT_SIDE_LABEL = 'diag-side';
const MAX_SUGGESTIONS = 8;

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

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase('ja-JP');
}

function compareSuggestion(a: string, b: string, needle: string): number {
  const aText = normalizeSearchText(a);
  const bText = normalizeSearchText(b);
  const aRank = aText.startsWith(needle) ? 0 : 1;
  const bRank = bText.startsWith(needle) ? 0 : 1;

  if (aRank !== bRank) {
    return aRank - bRank;
  }
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  return a.localeCompare(b, 'ja');
}

export function DiagDropdown({
  value,
  top5,
  rest,
  onChange,
  inputLabel = DEFAULT_INPUT_LABEL,
  sideLabel = DEFAULT_SIDE_LABEL,
}: DiagDropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const parsed = useMemo(() => splitDiagnosis(value), [value]);
  const [keyword, setKeyword] = useState(parsed.name);
  const [side, setSide] = useState<DiagnosisSide>(parsed.side);
  const [open, setOpen] = useState(false);

  const merged = useMemo(() => Array.from(new Set([...top5, ...rest])), [top5, rest]);
  const trimmedKeyword = keyword.trim();
  const hasKeyword = trimmedKeyword.length > 0;

  useEffect(() => {
    setKeyword(parsed.name);
  }, [parsed.name]);

  useEffect(() => {
    setSide(parsed.side);
  }, [parsed.side]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  const options = useMemo(() => {
    if (!hasKeyword) {
      return top5.slice(0, 5);
    }

    const needle = normalizeSearchText(trimmedKeyword);
    return merged
      .filter((name) => normalizeSearchText(name).includes(needle))
      .sort((a, b) => compareSuggestion(a, b, needle))
      .slice(0, MAX_SUGGESTIONS);
  }, [hasKeyword, merged, top5, trimmedKeyword]);

  function applyDiagnosis(rawName: string): void {
    const nextName = rawName.trim();
    setKeyword(nextName);
    onChange(formatDiagnosis(nextName, side));
    setOpen(false);
  }

  function handleInputChange(nextName: string): void {
    setKeyword(nextName);
    onChange(formatDiagnosis(nextName, side));
    setOpen(true);
  }

  function handleSideChange(nextSide: DiagnosisSide): void {
    const currentName = keyword || parsed.name;
    setSide(nextSide);
    onChange(formatDiagnosis(currentName, nextSide));
  }

  return (
    <div
      ref={rootRef}
      className={`${styles['diag-wrap']} ${!value.trim() ? styles['diag-pending'] : ''}`}
    >
      <div className={styles['diag-inline']}>
        <select
          aria-label={sideLabel}
          className={styles['diag-side-select']}
          value={side}
          onChange={(e) => handleSideChange(e.target.value as DiagnosisSide)}
        >
          <option value="">指定なし</option>
          <option value="右">右</option>
          <option value="左">左</option>
        </select>
        <input
          aria-label={inputLabel}
          aria-autocomplete="list"
          aria-expanded={open ? 'true' : 'false'}
          aria-haspopup="listbox"
          className={styles['diag-input']}
          placeholder="診断名を入力"
          role="combobox"
          value={keyword}
          onFocus={() => setOpen(true)}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
      </div>

      {open ? (
        <div className={styles['diag-panel']} role="listbox">
          {!hasKeyword && options.length > 0 ? (
            <div className={styles['diag-section-label']}>よく使う</div>
          ) : null}
          {hasKeyword ? <div className={styles['diag-section-label']}>検索結果</div> : null}

          {options.length > 0 ? (
            <div className={styles['diag-list']}>
              {options.map((name, idx) => (
                <button
                  key={`${name}-${idx}`}
                  type="button"
                  className={`${styles['diag-item']} ${parsed.name === name ? styles['diag-item-active'] : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyDiagnosis(name)}
                >
                  {!hasKeyword ? `★ ${name}` : name}
                </button>
              ))}
            </div>
          ) : hasKeyword ? (
            <div className={styles['diag-empty']}>候補なし。そのまま自由入力で送信できます。</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
