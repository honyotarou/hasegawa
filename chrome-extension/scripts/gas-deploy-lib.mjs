#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function normalizeDeploymentId(value) {
  const normalized = String(value ?? '').trim();
  return /^[A-Za-z0-9_-]+$/.test(normalized) ? normalized : '';
}

export function parseManagedDeploymentConfig(text) {
  if (!text) return { deploymentId: null, updatedAt: null };
  try {
    const parsed = JSON.parse(text);
    const deploymentId = normalizeDeploymentId(parsed?.deploymentId);
    const updatedAt = typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : null;
    return deploymentId
      ? { deploymentId, updatedAt }
      : { deploymentId: null, updatedAt: null };
  } catch {
    return { deploymentId: null, updatedAt: null };
  }
}

export function resolveManagedDeploymentId({ envDeploymentId, configText }) {
  const envId = normalizeDeploymentId(envDeploymentId);
  if (envId) return { deploymentId: envId, source: 'env' };

  const config = parseManagedDeploymentConfig(configText);
  if (config.deploymentId) {
    return { deploymentId: config.deploymentId, source: 'config' };
  }
  return { deploymentId: null, source: null };
}

export function parseCreatedVersion(output) {
  const match = String(output || '').match(/Created version\s+(\d+)/);
  if (!match) {
    throw new Error('Failed to parse clasp version output');
  }
  return match[1];
}

export function serializeManagedDeploymentConfig({ deploymentId, updatedAt }) {
  const normalized = normalizeDeploymentId(deploymentId);
  if (!normalized) {
    throw new Error('Invalid deployment id');
  }

  return `${JSON.stringify(
    {
      deploymentId: normalized,
      updatedAt: updatedAt || new Date().toISOString(),
    },
    null,
    2,
  )}\n`;
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return '';
  return process.argv[index + 1];
}

async function resolveCommand() {
  const configPath = getArg('--config');
  const configText = configPath ? await fs.readFile(configPath, 'utf8').catch(() => '') : '';
  const result = resolveManagedDeploymentId({
    envDeploymentId: process.env.GAS_WEBAPP_DEPLOYMENT_ID || '',
    configText,
  });
  if (result.deploymentId) {
    process.stdout.write(result.deploymentId);
  }
}

async function writeConfigCommand() {
  const configPath = getArg('--config');
  const deploymentId = getArg('--deployment-id');
  if (!configPath) throw new Error('Missing --config');
  const serialized = serializeManagedDeploymentConfig({ deploymentId });
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, serialized, 'utf8');
  process.stdout.write(configPath);
}

async function parseVersionCommand() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  process.stdout.write(parseCreatedVersion(Buffer.concat(chunks).toString('utf8')));
}

async function main() {
  const command = process.argv[2] || '';
  switch (command) {
    case 'resolve':
      await resolveCommand();
      return;
    case 'write-config':
      await writeConfigCommand();
      return;
    case 'parse-version':
      await parseVersionCommand();
      return;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  main().catch((err) => {
    console.error(err.message || String(err));
    process.exitCode = 1;
  });
}
