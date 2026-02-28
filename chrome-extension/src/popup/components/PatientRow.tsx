import React from 'react';
import type { Patient } from '../../types';
import { DiagDropdown } from './DiagDropdown';
import { RehabToggle } from './RehabToggle';

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

export function PatientRow({ index, patient, top5, rest, onPatch }: PatientRowProps) {
  const isPending = patient.rehab === null || !patient.diagnoses[0]?.trim();
  const ageError = !isValidAge(patient.age);

  return (
    <div data-testid={`patient-row-${index}`} data-pending={isPending ? 'true' : 'false'}>
      <input
        aria-label={`age-${index}`}
        type="number"
        min={1}
        max={150}
        value={patient.age}
        onChange={(e) => onPatch(index, { age: Number(e.target.value) })}
        style={ageError ? { border: '1px solid #dc6444' } : undefined}
      />
      <select
        aria-label={`gender-${index}`}
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
      {ageError ? <span>年齢エラー</span> : null}
    </div>
  );
}
