import "dotenv/config";

import { redisConnection } from "./config/redis";
import { triageQueue } from "./services/queue";
import { closeWorker, startWorker } from "./workers/triage.worker";

startWorker();

const shutdown = async () => {
  await closeWorker();
  await triageQueue.close();
  await redisConnection.quit();
  process.exit(0);
};

process.on("SIGTERM", () => {
  void shutdown();
});
process.on("SIGINT", () => {
  void shutdown();
});
