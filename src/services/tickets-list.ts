import type { Queue } from "bullmq";

import type { ClassifierOutput, TicketInput } from "../agents/classifier/schema";
import { resultadosTriage } from "../stores/triage.store";

export type TicketListStatus = "complete" | "queued" | "processing" | "failed";

export type TicketListEntry = {
  id: string;
  status: TicketListStatus;
  categoria: ClassifierOutput["categoria"] | null;
  confianca: number | null;
};

const queuedJobStates = ["waiting", "paused", "delayed", "waiting-children", "prioritized"] as const;

function nonNullJobs<T extends { id?: string }>(jobs: (T | undefined | null)[]): T[] {
  return jobs.filter((j): j is T => j != null);
}

/**
 * Agrega tickets classificados em memória com jobs pendentes/atvos/falhados na fila BullMQ.
 */
export async function listAllTickets(
  triageQueue: Queue<TicketInput, ClassifierOutput>,
): Promise<TicketListEntry[]> {
  const byId = new Map<string, TicketListEntry>();

  for (const [id, result] of resultadosTriage) {
    byId.set(id, {
      id,
      status: "complete",
      categoria: result.categoria,
      confianca: result.confianca,
    });
  }

  const setIfAbsent = (id: string, entry: TicketListEntry) => {
    if (!byId.has(id)) {
      byId.set(id, entry);
    }
  };

  const active = nonNullJobs(await triageQueue.getJobs(["active"], 0, -1));
  for (const job of active) {
    const id = job.data.id;
    setIfAbsent(id, { id, status: "processing", categoria: null, confianca: null });
  }

  const queued = nonNullJobs(await triageQueue.getJobs([...queuedJobStates], 0, -1));
  for (const job of queued) {
    const id = job.data.id;
    setIfAbsent(id, { id, status: "queued", categoria: null, confianca: null });
  }

  const failed = nonNullJobs(await triageQueue.getJobs(["failed"], 0, -1));
  for (const job of failed) {
    const id = job.data.id;
    setIfAbsent(id, { id, status: "failed", categoria: null, confianca: null });
  }

  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}
