const delayMs = Math.max(0, parseInt(process.argv[2], 10) || 0) * 1000;

setTimeout(() => process.exit(0), delayMs);
