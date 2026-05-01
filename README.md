# SupportPilot

## Intuito

O **SupportPilot** é uma API de apoio a equipas de suporte que **classifica pedidos de clientes** (tickets) com recurso a um modelo de linguagem (OpenAI via LangChain). Para cada mensagem, o sistema estima uma **categoria** (por exemplo reclamação, dúvida técnica ou elogio) e um valor de **confiança**, de forma assíncrona: o cliente HTTP não espera pela IA na mesma chamada — o trabalho pesado corre na **fila** (BullMQ + Redis).

Objetivos práticos:

- Centralizar triagem automática para rotear ou priorizar tickets humanos ou outros sistemas.
- Manter prompts e critérios de classificação no código de forma estruturada (schemas Zod, prompts dedicados).
- Servir como base para evoluções (mais categorias, outro provider de LLM, persistência durável, etc.).

## Como funciona

1. **Entrada:** Um cliente envia um ticket com `id` e `texto` (`POST /tickets`).
2. **Fila:** O servidor valida o corpo, regista um job na fila BullMQ (`triage-queue`) e responde imediatamente com estado **queued** e `ticketId`.
3. **Worker:** No mesmo processo que serve o Express, um worker BullMQ consome jobs, chama o agente de classificação (`classificarTicket`) e grava o resultado num mapa em memória (`resultadosTriage`).
4. **Consulta:** Quem precisa do resultado pode:
   - listar todos os tickets conhecidos (`GET /tickets`);
   - consultar um por id (`GET /tickets/:id`), recebendo **processing**, **complete** ou erro conforme o estado.
5. **Remoção:** `DELETE /tickets/:id` remove o resultado em memória e o job na fila, se existir.

**Persistência:** Os resultados classificados vivem em **memória** no processo da API; a **fila e retries** ficam no **Redis**. Se reiniciares apenas o servidor sem Redis compatível, podes perder correspondência entre jobs antigos e o que está na RAM — algo a ter em conta para produção.

## Stack

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Runtime       | Node.js 20, TypeScript (estrito)    |
| HTTP          | Express 5                           |
| Validação     | Zod                                 |
| Filas         | BullMQ + ioredis + Redis            |
| IA            | LangChain + `@langchain/openai` (ex.: `gpt-4o-mini`) |

## Variáveis de ambiente

| Variável            | Descrição |
|---------------------|-----------|
| `OPENAI_API_KEY`    | Chave da API OpenAI (obrigatória para classificação real; sem ela o fluxo pode degradar conforme `llm-client` / agente). |
| `REDIS_HOST`        | Host Redis (predefinição: `127.0.0.1`; em Docker: `redis`). |
| `REDIS_PORT`        | Porta Redis (predefinição: `6379`). |
| `PORT`              | Porta HTTP da API (predefinição: `3000`). |

Opcionalmente usa um ficheiro `.env` na raiz; `docker compose` interpola variáveis desse ficheiro quando aplicável.

## Como executar

**Desenvolvimento** (Redis a correr localmente):

```bash
npm install
# Opcional: cria um .env na raiz com OPENAI_API_KEY, REDIS_HOST, etc.
npm run dev
```

**Build e execução com Node:**

```bash
npm run build
node dist/src/server.js
```

**Docker Compose** (API + Redis):

```bash
export OPENAI_API_KEY=sk-...
docker compose up --build
```

A API fica em `http://localhost:3000` (ou na porta definida por `PORT`).

## API (resumo)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/health` | Estado do serviço (`{ ok: true }`). |
| `POST` | `/tickets` | Corpo JSON `{ id, texto }` — enfileira ticket; resposta `202` com `ticketId` e `queued`. |
| `GET` | `/tickets` | Lista tickets com `id`, `status`, `categoria`, `confianca` (nulos quando ainda não classificado ou falha). |
| `GET` | `/tickets/:id` | Detalhe: `complete` com categoria/confiança, ou `processing`. |
| `DELETE` | `/tickets/:id` | Remove resultado em memória e job associado; `404` se não existir. |

Estados possíveis na listagem incluem por exemplo `complete`, `queued`, `processing` e `failed`, conforme fila e mapa em memória.

## Scripts úteis

- `npm run dev` — servidor com reload (`tsx watch`).
- `npm run build` — compilação TypeScript para `dist/`.
- `npm test` — testes Jest.
- `npm run evaluate` — execução dos eval sets do projeto.

## Estrutura relevante do código

- `src/server.ts` — Definição da API Express e arranque do worker BullMQ.
- `src/workers/triage.worker.ts` — Consumo da fila e gravação dos resultados.
- `src/agents/classifier/` — Schema e agente de classificação.
- `src/prompts/` — Prompts do sistema (sem strings soltas no meio da lógica).
- `src/services/` — Cliente LLM, fila, listagem agregada de tickets.
- `src/stores/triage.store.ts` — Armazenamento em memória dos resultados.
