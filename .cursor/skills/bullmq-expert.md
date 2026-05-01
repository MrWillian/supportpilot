---
name: bullmq-expert
description: Convenções para criação de filas, workers, tipagem e tratamento de erros com BullMQ
---

# Skill BullMQ – SupportPilot

## Regras de ouro

1. **Sempre tipar** `Queue<PayloadType, ResultType>` e `Worker<PayloadType, ResultType>`.
2. **Conexão Redis compartilhada** — use o mesmo `IORedis` exportado de `config/redis.ts`.
3. **Nomes de filas** devem ser constantes (ex.: `EMAIL_QUEUE_NAME = 'email-queue'`), nunca strings soltas.
4. **Payloads e resultados** definidos em interfaces separadas (arquivo `jobs/`) e nunca usar `any`.
5. **NUNCA** retornar dados sensíveis (PII) no resultado do job. Aplique `maskPII` se necessário.
6. **Sempre implementar graceful shutdown** dos workers e schedulers.

## Estrutura de diretórios padrão

```
src/queues/
├── config/
│   └── redis.ts              # Conexão Redis (IORedis, maxRetriesPerRequest: null)
├── queues/
│   └── email.queue.ts        # Definição da fila
├── jobs/
│   └── email.job.ts          # Tipos ISendEmailPayload, ISendEmailResult
├── workers/
│   └── email.worker.ts       # Worker e processor
├── schedulers/
│   └── email.scheduler.ts    # QueueScheduler (se necessário)
├── events/
│   └── email.events.ts       # Listeners 'completed', 'failed', 'stalled'
└── index.ts                  # Factory que inicializa filas, workers e eventos
```

## Definição de fila (`queues/*.queue.ts`)

```ts
import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import type { IMeuPayload, IMeuResult } from '../jobs/meu.job';

export const MINHA_FILA_NOME = 'minha-fila';

export const minhaFila = new Queue<IMeuPayload, IMeuResult>(MINHA_FILA_NOME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
```

## Tipos de job (`jobs/*.job.ts`)

Interfaces exportadas com JSDoc simples.

**Exemplo:**

```ts
export interface IMeuPayload {
  id: string;
  dados: Record<string, unknown>;
}

export interface IMeuResult {
  status: 'ok' | 'error';
  processadoEm: Date;
}
```

## Worker (`workers/*.worker.ts`)

- **Concorrência:** defina com base no recurso (1 para jobs pesados, 5 para leves).
- **Rate limiting (opcional):** use `limiter` no `Worker` para controlar jobs/segundo.
- **Sandbox:** para jobs longos, use `Worker` apontando para um arquivo `.js` separado.

**Padrão:**

```ts
import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { MINHA_FILA_NOME } from '../queues/minha.queue';
import type { IMeuPayload, IMeuResult } from '../jobs/meu.job';

const worker = new Worker<IMeuPayload, IMeuResult>(
  MINHA_FILA_NOME,
  async (job) => {
    // A lógica do processamento
    return { status: 'ok', processadoEm: new Date() };
  },
  {
    connection: redisConnection,
    concurrency: 3,
    // limiter: { max: 10, duration: 1000 } // 10 jobs/s
  },
);

worker.on('completed', (job) => {
  // log de sucesso (mascarar dados sensíveis!)
});
worker.on('failed', (job, err) => {
  // log e alerta
  console.error(`Job ${job?.id} falhou:`, err.message);
});

export default worker;
```

## Tratamento de erros e retentativas

- Use `attempts` e `backoff` no `defaultJobOptions` da fila ou ao adicionar o job.
- Para falhas não recuperáveis, lance `new Error('mensagem')`; o BullMQ retentará automaticamente.
- Se um erro for definitivo e não deve ser retentado, descarte o job com `job.discard()`.
- Evite capturar erros silenciosamente — sempre propague ou registre no listener `failed`.

## Adicionando jobs

```ts
await minhaFila.add(
  'nome-descritivo-do-job',
  { id: 'abc', dados: { /* ... */ } },
  { delay: 5000, priority: 1 }, // opcional
);
```

- O nome do job é uma string descritiva (facilita debug no Bull Board).
- Nunca coloque dados grandes no payload; se precisar, passe IDs e busque no banco dentro do worker.

## Scheduler e jobs repetíveis

```ts
import { QueueScheduler } from 'bullmq';
import { redisConnection } from '../config/redis';

export const meuScheduler = new QueueScheduler(MINHA_FILA_NOME, {
  connection: redisConnection,
});
```

- O scheduler gerencia repeatable jobs e retentativas atrasadas (especialmente em versões anteriores a v3).

## Graceful shutdown (obrigatório)

No ponto de entrada que inicia os workers, adicione:

```ts
const gracefulShutdown = async () => {
  await worker.close(); // fecha todos os workers
  // feche schedulers também
  await redisConnection.quit();
  process.exit(0);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

## Eventos e monitoramento

- Centralize listeners em `events/` para evitar duplicação.
- Use `worker.on('stalled', (jobId) => …)` para detectar jobs travados.
- Integre com Bull Board se houver painel de admin, mas sempre com autenticação.

## Testes

- Para testes unitários, mocke `Queue` e `Worker` ou use uma instância Redis em Docker com `removeOnComplete: true` e limpeza entre testes.
- Verifique se o worker processa corretamente injetando um job via `queue.add` e aguardando o evento `completed`.

**Exemplo de helper:**

```ts
const waitForJobCompletion = (queue) =>
  new Promise((resolve) => queue.on('completed', resolve));
```
