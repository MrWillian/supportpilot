import type { ClassifierOutput, TicketInput } from "../agents/classifier/schema";

export const TRIAGE_QUEUE_NAME = "triage-queue" as const;
export const PROCESSAR_TICKET_JOB = "processar-ticket" as const;

export type TriageJobName = typeof PROCESSAR_TICKET_JOB;
export type TriageJobPayload = TicketInput;
export type TriageJobResult = ClassifierOutput;
