import { EventEmitter } from "node:events";

import type { ClassifierOutput } from "../agents/classifier/schema";

export const resultadosTriage = new Map<string, ClassifierOutput>();

type Categoria =
  | "reclamacao"
  | "duvida_tecnica"
  | "cancelamento"
  | "elogio";

export type MetricasStore = {
  totalTickets: number;
  porCategoria: Record<Categoria, number>;
  confiancaMedia: number;
  tempoMedioMs: number;
};

export const metricasStore: MetricasStore = {
  totalTickets: 0,
  porCategoria: {
    reclamacao: 0,
    duvida_tecnica: 0,
    cancelamento: 0,
    elogio: 0,
  },
  confiancaMedia: 0,
  tempoMedioMs: 0,
};

export const triageEventBus = new EventEmitter();
triageEventBus.setMaxListeners(50);

export type TriageCompletedEvent = {
  id: string;
  result: ClassifierOutput;
};
