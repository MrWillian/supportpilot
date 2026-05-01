import { z } from "zod";

export const ClassifierOutputSchema = z.object({
  categoria: z.enum(["reclamacao", "duvida_tecnica", "cancelamento", "elogio"]),
  confianca: z.number().min(0).max(1),
});

export type ClassifierOutput = z.infer<typeof ClassifierOutputSchema>;

export const TicketInputSchema = z.object({
  id: z.string(),
  texto: z.string().min(1),
});

export type TicketInput = z.infer<typeof TicketInputSchema>;
