import { forceGCIfNeeded } from './middleware/limits';

const MEMORY_LOG_INTERVAL = 60 * 1000; // 1 minute
const MEMORY_ALERT_THRESHOLD = 0.92; // 92% (matches rejection threshold)

export function startMemoryMonitoring(): void {
  setInterval(() => {
    const mem = process.memoryUsage();
    const usage = {
      used: mem.heapUsed,
      total: mem.heapTotal,
      percent: mem.heapUsed / mem.heapTotal,
    };

    console.log({
      '[Memory]': {
        heapUsed: `${(usage.used / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(usage.total / 1024 / 1024).toFixed(2)} MB`,
        external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
        percent: `${(usage.percent * 100).toFixed(2)}%`,
      }
    });

    if (usage.percent > MEMORY_ALERT_THRESHOLD) {
      console.error(`[ALERT] Memory usage at ${(usage.percent * 100).toFixed(2)}%`);
      forceGCIfNeeded();
    }
  }, MEMORY_LOG_INTERVAL);
}

export function logMemorySnapshot(label: string): void {
  const usage = process.memoryUsage();
  console.log(`[Memory] ${label}:`, {
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    arrayBuffers: `${(usage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
  });
}

startMemoryMonitoring();
