import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const budgetPath = path.join(rootDir, 'performance-budget.json');
const chunksDir = path.join(rootDir, '.next/static/chunks');
const buildManifestPath = path.join(rootDir, '.next/build-manifest.json');

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const toBytes = (kb) => Math.round(kb * 1024);

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    return fullPath.endsWith('.js') ? [fullPath] : [];
  });

if (!existsSync(budgetPath)) {
  throw new Error(`Missing performance budget file: ${budgetPath}`);
}

if (!existsSync(chunksDir) || !existsSync(buildManifestPath)) {
  throw new Error('Run `npm run build` before checking the performance budget.');
}

const budget = JSON.parse(readFileSync(budgetPath, 'utf8')).staticChunks;
const manifest = JSON.parse(readFileSync(buildManifestPath, 'utf8'));
const files = walk(chunksDir).map((filePath) => {
  const source = readFileSync(filePath);
  const relativePath = path.relative(path.join(rootDir, '.next'), filePath);

  return {
    gzipBytes: gzipSync(source).byteLength,
    relativePath,
    sourceBytes: source.byteLength,
  };
});

const rootMainFiles = new Set(manifest.rootMainFiles ?? []);
const totalGzipBytes = files.reduce((sum, file) => sum + file.gzipBytes, 0);
const largestFile = files.toSorted((a, b) => b.gzipBytes - a.gzipBytes)[0];
const rootMainGzipBytes = files
  .filter((file) => rootMainFiles.has(file.relativePath))
  .reduce((sum, file) => sum + file.gzipBytes, 0);

const checks = [
  {
    actual: totalGzipBytes,
    label: 'Total static JS chunks gzip',
    limit: toBytes(budget.maxTotalGzipKb),
  },
  {
    actual: largestFile.gzipBytes,
    detail: largestFile.relativePath,
    label: 'Largest single JS chunk gzip',
    limit: toBytes(budget.maxSingleChunkGzipKb),
  },
  {
    actual: rootMainGzipBytes,
    label: 'Root shared JS gzip',
    limit: toBytes(budget.maxRootMainGzipKb),
  },
];

const failures = checks.filter((check) => check.actual > check.limit);

console.log('Frontend performance budget');
checks.forEach((check) => {
  const detail = check.detail ? ` (${check.detail})` : '';
  console.log(
    `- ${check.label}${detail}: ${formatKb(check.actual)} / ${formatKb(
      check.limit
    )}`
  );
});

if (failures.length > 0) {
  console.error('\nPerformance budget exceeded:');
  failures.forEach((check) => {
    console.error(
      `- ${check.label}: ${formatKb(check.actual)} > ${formatKb(check.limit)}`
    );
  });
  process.exit(1);
}
