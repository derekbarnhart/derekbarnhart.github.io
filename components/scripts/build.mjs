#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');

async function rimraf(dir) {
  try {
    const stat = await fs.stat(dir).catch(() => null);
    if (!stat) return;
    if (!stat.isDirectory()) {
      await fs.unlink(dir);
      return;
    }
    const entries = await fs.readdir(dir);
    await Promise.all(entries.map(async (e) => {
      await rimraf(path.join(dir, e));
    }));
    await fs.rmdir(dir);
  } catch (err) {
    // tolerate missing files on concurrent runs
    if (err.code !== 'ENOENT') throw err;
  }
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  const hasSrc = await fs.stat(srcDir).then(() => true).catch(() => false);
  if (!hasSrc) {
    console.error('No src/ directory found. Nothing to build.');
    process.exit(1);
  }
  await rimraf(distDir);
  await fs.mkdir(distDir, { recursive: true });
  await copyDir(srcDir, distDir);
  console.log('Built to dist/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

