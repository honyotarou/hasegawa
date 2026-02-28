import React, { useMemo, useState } from 'react';

type DiagDropdownProps = {
  value: string;
  top5: string[];
  rest: string[];
  onChange: (value: string) => void;
};

export function DiagDropdown({ value, top5, rest, onChange }: DiagDropdownProps) {
  const [keyword, setKeyword] = useState('');

  const options = useMemo(() => {
    const merged = [...top5, ...rest];
    if (!keyword.trim()) return merged;
    return merged.filter((name) => name.includes(keyword.trim()));
  }, [top5, rest, keyword]);

  return (
    <div>
      <input
        aria-label="diag-search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div>選択中: {value || '未選択'}</div>
      <div>
        {options.map((name) => (
          <button key={name} type="button" onClick={() => onChange(name)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
