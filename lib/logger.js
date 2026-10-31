// Dual JSONL Logger for Next.js (PROJECT NOVA)
import fs from 'fs';
import path from 'path';

const LOG_FILES = [
  path.resolve(process.cwd(), 'logs/app.log.jsonl'),
  path.resolve(process.cwd(), '../logs/app.log.jsonl'),
];

for (const file of LOG_FILES) {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // Ignore log dir creation error
  }
}

export function logEvent(data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'nova-nextjs',
    ...data,
  };

  const line = JSON.stringify(logEntry) + '\n';

  for (const file of LOG_FILES) {
    try {
      fs.appendFileSync(file, line, 'utf8');
    } catch (e) {
      // Ignore
    }
  }
}

export function logLabEvent(data) {
  logEvent({
    eventCategory: 'SECURITY_LAB',
    severity: data.severity || 'WARN',
    ...data,
  });
}

