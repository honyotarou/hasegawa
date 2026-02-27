export function normalizeGender(input) {
  const value = String(input ?? "").trim();
  if (/^(男|男性)$/.test(value)) return "男性";
  if (/^(女|女性)$/.test(value)) return "女性";
  return "その他";
}

function validatePatient(patient, index) {
  if (typeof patient !== "object" || patient === null) {
    return { valid: false, error: `patients[${index}] はオブジェクトである必要があります` };
  }

  if (
    typeof patient.age !== "number" ||
    !Number.isInteger(patient.age) ||
    patient.age < 1 ||
    patient.age > 150
  ) {
    return { valid: false, error: `patients[${index}]: age は1〜150の整数である必要があります` };
  }

  return {
    valid: true,
    normalized: {
      age: patient.age,
      gender: normalizeGender(patient.gender),
    },
  };
}

function buildCandidateGroups(doc) {
  const preCodeTexts = Array.from(doc.querySelectorAll("pre > code"))
    .map((node) => node.textContent || "")
    .reverse();

  const codeTexts = Array.from(doc.querySelectorAll("code"))
    .filter((node) => node.parentElement?.tagName !== "PRE")
    .map((node) => node.textContent || "");

  const preTexts = Array.from(doc.querySelectorAll("pre"))
    .filter((node) => !node.querySelector("code"))
    .map((node) => node.textContent || "");

  return [preCodeTexts, codeTexts, preTexts];
}

export function extractPatientsFromDocument(doc = document) {
  const groups = buildCandidateGroups(doc);
  const totalCandidates = groups.reduce((sum, group) => sum + group.length, 0);
  if (totalCandidates === 0) {
    return { success: false, error: "JSONが見つかりません" };
  }

  let sawEmptyArray = false;
  let sawSchemaError = null;

  for (const group of groups) {
    for (const rawText of group) {
      try {
        const parsed = JSON.parse(rawText);
        if (!Array.isArray(parsed)) {
          continue;
        }

        if (parsed.length === 0) {
          sawEmptyArray = true;
          continue;
        }

        const normalized = [];
        for (let i = 0; i < parsed.length; i += 1) {
          const validation = validatePatient(parsed[i], i);
          if (!validation.valid) {
            sawSchemaError = validation.error;
            normalized.length = 0;
            break;
          }
          normalized.push(validation.normalized);
        }

        if (normalized.length > 0) {
          return { success: true, patients: normalized };
        }
      } catch (_err) {
        // invalid JSON in this candidate; keep searching.
      }
    }
  }

  if (sawSchemaError) {
    return { success: false, error: sawSchemaError };
  }
  if (sawEmptyArray) {
    return { success: false, error: "患者データが空です" };
  }
  return { success: false, error: "JSONが見つかりません" };
}

export function extractPatientsFromCurrentDocument() {
  return extractPatientsFromDocument(document);
}
