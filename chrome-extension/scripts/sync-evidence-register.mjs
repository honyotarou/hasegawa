#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  syncEvidenceRegisterContent,
} from './evidence-sync-lib.mjs';

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return '';
  return process.argv[index + 1];
}

async function main() {
  const gasUrl = getArg('--gas-url') || process.env.GAS_URL;
  const secret = getArg('--secret') || process.env.GAS_SECRET;
  const parsedLimit = Number(getArg('--limit') || process.env.EVIDENCE_LIMIT || '100');
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(500, Math.floor(parsedLimit)))
    : 100;

  if (!gasUrl) throw new Error('Missing GAS URL. Set --gas-url or GAS_URL.');
  if (!secret) throw new Error('Missing GAS secret. Set --secret or GAS_SECRET.');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.resolve(
    process.cwd(),
    getArg('--out') || path.join(__dirname, '../../.agent/compliance/evidence-register.md'),
  );

  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
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
  const current = await fs.readFile(outPath, 'utf8');
  const next = syncEvidenceRegisterContent(current, events);

  if (next === current) {
    console.log(`No changes. events=${events.length}`);
    return;
  }

  await fs.writeFile(outPath, next, 'utf8');
  console.log(`Synced evidence register: ${outPath} events=${events.length}`);
}

main().catch((err) => {
  console.error(err.message || String(err));
  process.exitCode = 1;
});
