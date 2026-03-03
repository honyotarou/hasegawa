#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { syncEvidenceRegisterContent } from './evidence-sync-lib.mjs';

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return '';
  return process.argv[index + 1];
}

export function resolveSyncOptions() {
  const gasUrl = getArg('--gas-url') || process.env.GAS_URL;
  const evidenceSecret =
    getArg('--evidence-secret') ||
    process.env.GAS_EVIDENCE_SECRET ||
    getArg('--secret') ||
    process.env.GAS_SECRET;
  const parsedLimit = Number(getArg('--limit') || process.env.EVIDENCE_LIMIT || '100');
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(500, Math.floor(parsedLimit)))
    : 100;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.resolve(
    process.cwd(),
    getArg('--out') || path.join(__dirname, '../../.agent/compliance/evidence-register.md'),
  );

  return { gasUrl, evidenceSecret, limit, outPath };
}

export async function runSyncEvidenceRegister(options = {}) {
  const resolved = { ...resolveSyncOptions(), ...options };
  const { gasUrl, evidenceSecret, limit, outPath } = resolved;
  const fetchImpl = resolved.fetchImpl || fetch;
  const readFileImpl = resolved.readFileImpl || fs.readFile;
  const writeFileImpl = resolved.writeFileImpl || fs.writeFile;

  if (!gasUrl) throw new Error('Missing GAS URL. Set --gas-url or GAS_URL.');
  if (!evidenceSecret) {
    throw new Error(
      'Missing GAS evidence secret. Set --evidence-secret or GAS_EVIDENCE_SECRET.',
    );
  }

  const response = await fetchImpl(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: evidenceSecret,
      action: 'getEvidenceEvents',
      limit,
    }),
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response from GAS: ${text.slice(0, 200)}`);
  }

  if (!payload.success) {
    throw new Error(`GAS error: ${payload.error || 'unknown error'}`);
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  const current = await readFileImpl(outPath, 'utf8');
  const next = syncEvidenceRegisterContent(current, events);

  if (next === current) {
    console.log(`No changes. events=${events.length}`);
    return { changed: false, events: events.length, outPath };
  }

  await writeFileImpl(outPath, next, 'utf8');
  console.log(`Synced evidence register: ${outPath} events=${events.length}`);
  return { changed: true, events: events.length, outPath };
}

async function main() {
  await runSyncEvidenceRegister();
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  main().catch((err) => {
    console.error(err.message || String(err));
    process.exitCode = 1;
  });
}
