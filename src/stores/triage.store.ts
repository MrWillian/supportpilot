import { EventEmitter } from "node:events";

import type { ClassifierOutput } from "../agents/classifier/schema";

export const resultadosTriage = new Map<string, ClassifierOutput>();

export const triageEventBus = new EventEmitter();
triageEventBus.setMaxListeners(50);

export type TriageCompletedEvent = {
  id: string;
  result: ClassifierOutput;
};
