import { readFileSync } from 'node:fs';

const summaryUrl = new URL('../coverage/flower-details-frontend/coverage-summary.json', import.meta.url);
const minimums = { statements: 55, branches: 60, functions: 60, lines: 60 };

let summary;
try {
  summary = JSON.parse(readFileSync(summaryUrl, 'utf8'));
} catch {
  console.error('No se encontró el resumen de cobertura. Ejecuta primero los tests con cobertura.');
  process.exit(1);
}

let failed = false;
for (const [metric, minimum] of Object.entries(minimums)) {
  const actual = summary.total?.[metric]?.pct;
  if (typeof actual !== 'number' || actual < minimum) {
    console.error(`${metric}: ${actual ?? 'sin datos'}% (mínimo ${minimum}%)`);
    failed = true;
  } else {
    console.log(`${metric}: ${actual}% (mínimo ${minimum}%)`);
  }
}

if (failed) {
  process.exitCode = 1;
}
