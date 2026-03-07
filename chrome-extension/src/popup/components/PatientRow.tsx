import { memo } from 'react';
import type { Patient } from '../../types';
import { DiagDropdown } from './DiagDropdown';
import { RehabToggle } from './RehabToggle';
import styles from '../app.module.css';

export function isValidAge(age: number): boolean {
  return Number.isInteger(age) && age >= 1 && age <= 150;
}

type PatientRowProps = {
  index: number;
  patient: Patient;
  top5: string[];
  rest: string[];
  onPatch: (index: number, patch: Partial<Patient>) => void;
};

function PatientRowInner({ index, patient, top5, rest, onPatch }: PatientRowProps) {
  const ageError = !isValidAge(patient.age);
  const isPending = ageError || patient.rehab === null || !patient.diagnoses[0]?.trim();
  const noLabel = String(index + 1).padStart(2, '0');
  const genderClass =
    patient.gender === '男性'
      ? styles['row-select-male']
      : patient.gender === '女性'
        ? styles['row-select-female']
        : '';

  return (
    <div
      data-testid={`patient-row-${index}`}
      data-pending={isPending ? 'true' : 'false'}
      className={`${styles['patient-row']} ${isPending ? styles['pending-row'] : ''}`}
    >
      <div className={styles['row-no']}>
        {noLabel}
        {ageError ? <span className={styles['row-error-text']}> 年齢エラー</span> : null}
      </div>
      <input
        aria-label={`age-${index}`}
        className={`${styles['row-input']} ${ageError ? styles['age-error'] : ''}`}
        type="number"
        min={1}
        max={150}
        value={patient.age}
        onChange={(e) => onPatch(index, { age: Number(e.target.value) })}
      />
      <select
        aria-label={`gender-${index}`}
        className={`${styles['row-select']} ${genderClass}`}
        value={patient.gender}
        onChange={(e) => onPatch(index, { gender: e.target.value })}
      >
        <option value="男性">男性</option>
        <option value="女性">女性</option>
        <option value="その他">その他</option>
      </select>
      <DiagDropdown
        value={patient.diagnoses[0] || ''}
        top5={top5}
        rest={rest}
        onChange={(value) => {
          const diagnoses = [...patient.diagnoses];
          diagnoses[0] = value;
          onPatch(index, { diagnoses });
        }}
      />
      <RehabToggle
        value={patient.rehab}
        onChange={(value) => onPatch(index, { rehab: value })}
      />
    </div>
  );
}

export const PatientRow = memo(PatientRowInner);
PatientRow.displayName = 'PatientRow';
