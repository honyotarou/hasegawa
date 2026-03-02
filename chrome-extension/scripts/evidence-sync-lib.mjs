function toDateText(timestamp) {
  const text = (timestamp || '').toString();
  return text.length >= 10 ? text.slice(0, 10) : 'YYYY-MM-DD';
}

function toItemText(event) {
  const action = (event.action || 'unknown').toString();
  const status = (event.status || 'unknown').toString();
  if (event.error) {
    return `${action} / ${status} (${String(event.error).slice(0, 80)})`;
  }
  return `${action} / ${status}`;
}

function toJudgeText(status) {
  return status === 'success' ? 'OK' : '要確認';
}

export function renderAuditTable(events) {
  const header = [
    '| Date | 項目 | 実施者 | 証跡ID | 判定 |',
    '|---|---|---|---|---|',
  ];

  if (!Array.isArray(events) || events.length === 0) {
    return [...header, '| YYYY-MM-DD | 週次ログレビュー |  |  |  |'].join('\n');
  }

  const rows = events.map((event) => {
    const dateText = toDateText(event.timestamp);
    const itemText = toItemText(event);
    const actor = (event.doctorId || '').toString() || '-';
    const evidenceId = (event.eventId || '').toString() || '-';
    const judge = toJudgeText((event.status || '').toString());
    return `| ${dateText} | ${itemText} | ${actor} | ${evidenceId} | ${judge} |`;
  });

  return [...header, ...rows].join('\n');
}

export function replaceMarkdownSection(markdown, heading, nextHeading, sectionBody) {
  const start = markdown.indexOf(heading);
  if (start === -1) throw new Error(`Heading not found: ${heading}`);

  const bodyStart = markdown.indexOf('\n', start);
  if (bodyStart === -1) throw new Error(`Invalid section layout: ${heading}`);

  const end = markdown.indexOf(nextHeading, bodyStart + 1);
  if (end === -1) throw new Error(`Next heading not found: ${nextHeading}`);

  const prefix = markdown.slice(0, bodyStart + 1);
  const suffix = markdown.slice(end);
  return `${prefix}\n${sectionBody.trimEnd()}\n\n${suffix}`;
}

export function syncEvidenceRegisterContent(markdown, events) {
  const table = renderAuditTable(events);
  return replaceMarkdownSection(markdown, '## AUDIT', '## BACKUP/DR', table);
}
