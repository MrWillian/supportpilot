import { Worker } from "bullmq";

import { classificarTicket } from "../agents/classifier/agent";
import { redisConnection } from "../config/redis";
import { PROCESSAR_TICKET_JOB, TRIAGE_QUEUE_NAME } from "../jobs/triage.job";
import {
  metricasStore,
  resultadosTriage,
  triageEventBus,
  type TriageCompletedEvent,
} from "../stores/triage.store";
import { maskPII } from "../utils/maskPII";
import type { ClassifierOutput, TicketInput } from "../agents/classifier/schema";

let activeWorker: Worker | null = null;

/**
 * Lógica de triagem usada pelo worker. Se `classificarTicket` lançar, o erro
 * propaga para o BullMQ aplicar retry conforme `defaultJobOptions` da fila.
 */
export async function runTriageJob(ticket: TicketInput): Promise<ClassifierOutput> {
  const startedAt = Date.now();
  const out = await classificarTicket(ticket);
  const durationMs = Date.now() - startedAt;

  resultadosTriage.set(ticket.id, out);

  metricasStore.totalTickets += 1;
  metricasStore.porCategoria[out.categoria] += 1;
  metricasStore.confiancaMedia =
    metricasStore.confiancaMedia +
    (out.confianca - metricasStore.confiancaMedia) / metricasStore.totalTickets;
  metricasStore.tempoMedioMs =
    metricasStore.tempoMedioMs +
    (durationMs - metricasStore.tempoMedioMs) / metricasStore.totalTickets;

  const event: TriageCompletedEvent = { id: ticket.id, result: out };
  triageEventBus.emit("completed", event);

  // Não logar o texto do ticket; mascarar possível PII no id
  // eslint-disable-next-line no-console
  console.log(
    `[Worker] Ticket ${maskPII(ticket.id)} classificado como ${out.categoria}`,
  );

  return out;
}

export function startWorker(): Worker {
  if (activeWorker) {
    return activeWorker;
  }

  const worker = new Worker(
    TRIAGE_QUEUE_NAME,
    async (job) => {
      if (job.name !== PROCESSAR_TICKET_JOB) {
        throw new Error(`Job inesperado: ${job.name}`);
      }

      return runTriageJob(job.data);
    },
    { connection: redisConnection, concurrency: 1 },
  );

  worker.on("failed", (job, err) => {
    if (job) {
      // eslint-disable-next-line no-console
      console.error(
        `[Worker] Job ${maskPII(String(job.id))} falhou (tentativa ${job.attemptsMade}): ${err.message}`,
      );
    }
  });

  activeWorker = worker;
  return worker;
}

export async function closeWorker(): Promise<void> {
  if (activeWorker) {
    await activeWorker.close();
    activeWorker = null;
  }
}
