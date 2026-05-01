import { Queue } from "bullmq";

import type { ClassifierOutput, TicketInput } from "../agents/classifier/schema";
import { redisConnection } from "../config/redis";
import { TRIAGE_QUEUE_NAME } from "../jobs/triage.job";

export { redisConnection } from "../config/redis";

export const triageQueue = new Queue<TicketInput, ClassifierOutput>(TRIAGE_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
