import "dotenv/config";

import cors from "cors";
import express from "express";
import { z } from "zod";

import { TicketInputSchema } from "./agents/classifier/schema";
import { PROCESSAR_TICKET_JOB } from "./jobs/triage.job";
import { metricasStore, resultadosTriage } from "./stores/triage.store";
import { redisConnection, triageQueue } from "./services/queue";
import { listAllTickets } from "./services/tickets-list";
import { closeWorker, startWorker } from "./workers/triage.worker";

const app = express();

const corsOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: corsOrigins,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/metrics", (_req, res) => {
  return res.status(200).json({
    totalTickets: metricasStore.totalTickets ?? 0,
    porCategoria: metricasStore.porCategoria ?? {
      reclamacao: 0,
      duvida_tecnica: 0,
      cancelamento: 0,
      elogio: 0,
    },
    confiancaMedia:
      metricasStore.totalTickets > 0 ? metricasStore.confiancaMedia : 0,
    tempoMedioMs: metricasStore.totalTickets > 0 ? metricasStore.tempoMedioMs : 0,
  });
});

app.post("/tickets", async (req, res) => {
  const parsed = TicketInputSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Validação falhou",
      details: parsed.error.flatten(),
    });
  }

  const ticket = parsed.data;

  await triageQueue.add(PROCESSAR_TICKET_JOB, ticket, {
    jobId: `ticket-${ticket.id}`,
  });

  return res.status(202).json({
    ticketId: ticket.id,
    status: "queued" as const,
  });
});

app.get("/tickets", async (_req, res) => {
  const tickets = await listAllTickets(triageQueue);
  return res.status(200).json({ tickets });
});

const ticketIdParamsSchema = z.object({
  id: z.string().min(1),
});

app.get("/tickets/:id", (req, res) => {
  const parsed = ticketIdParamsSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Validação falhou",
      details: parsed.error.flatten(),
    });
  }

  const { id } = parsed.data;
  const results = resultadosTriage.get(id);

  if (results) {
    return res.status(200).json({
      status: "complete" as const,
      ticketId: id,
      categoria: results.categoria,
      confianca: results.confianca,
    });
  }

  return res.status(202).json({
    status: "processing" as const,
    ticketId: id,
  });
});

app.delete("/tickets/:id", async (req, res) => {
  const parsed = ticketIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validação falhou",
      details: parsed.error.flatten(),
    });
  }

  const { id } = parsed.data;
  const removedFromStore = resultadosTriage.delete(id);

  const job = await triageQueue.getJob(`ticket-${id}`);
  let removedJob = false;
  if (job) {
    await job.remove();
    removedJob = true;
  }

  if (!removedFromStore && !removedJob) {
    return res.status(404).json({ error: "Ticket não encontrado" });
  }

  return res.status(204).send();
});

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => {
  startWorker();
  // eslint-disable-next-line no-console
  console.log(`SupportPilot listening on :${port}`);
});

const shutdown = async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
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
