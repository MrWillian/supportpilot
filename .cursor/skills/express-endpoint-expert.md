---
name: express-endpoint-expert
description: Criação de endpoints REST com Express, Zod e padrões do SupportPilot
---

# Skill Express Endpoints – SupportPilot

## Regras fundamentais

1. **Sempre validar entrada com Zod** (body, query, params). Nunca acessar `req.body` sem validar.
2. **Rotas devem ser finas** — delegam a lógica para serviços/controllers. Máximo de 10 linhas.
3. **Erros devem ser tratados de forma centralizada** — use um middleware de erro global.
4. **Respostas padronizadas** — envelope `{ success, data, error? }` para todas as respostas.
5. **Tipagem estrita** — todos os handlers têm tipagem explícita (`Request`, `Response`, `NextFunction`).

## Estrutura de diretórios (por módulo)

```
src/modules/<nome-do-modulo>/
├── routes.ts       # Definição das rotas
├── controller.ts   # Handlers (extrai parâmetros, chama service, formata resposta)
├── service.ts      # Lógica de negócio
├── validation.ts   # Schemas Zod e tipos inferidos
└── index.ts        # Exporta o Router montado
```

## Schemas de validação (`validation.ts`)

- Crie schemas Zod para cada endpoint: `bodySchema`, `querySchema`, `paramsSchema`.
- Exporte também os **tipos inferidos**: `export type CreateUserBody = z.infer<typeof createUserBodySchema>;`.

**Exemplo:**

```ts
import { z } from 'zod';

export const createUserBodySchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  idade: z.number().int().positive().optional(),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;

// Para parâmetros de rota:
export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;
```

## Handlers no controller (`controller.ts`)

- Sempre use wrapper assíncrono para capturar erros (pode ser um helper `asyncHandler`).
- Extraia dados validados com tipos — desestruture `req.body as CreateUserBody` (ou use o middleware de validação que injeta `req.validatedBody`, se existir).
- Retorne usando `res.status(200).json({ success: true, data })`.

**Exemplo:**

```ts
import type { Request, Response } from 'express';
import { criarUsuarioService } from './service';
import type { CreateUserBody } from './validation';

export const criarUsuario = async (req: Request, res: Response) => {
  const dados = req.body as CreateUserBody; // validado pelo middleware
  const usuario = await criarUsuarioService(dados);
  return res.status(201).json({ success: true, data: usuario });
};
```

## Definição de rotas (`routes.ts`)

- Crie um `Router` e use `validateBody(schema)`, `validateQuery(schema)`, `validateParams(schema)` como middlewares.

**Exemplo completo:**

```ts
import { Router } from 'express';
import { validateBody, validateParams } from '../../middlewares/validation.middleware';
import { createUserBodySchema, userIdParamsSchema } from './validation';
import { criarUsuario, obterUsuario } from './controller';

const router = Router();

router.post('/', validateBody(createUserBodySchema), criarUsuario);
router.get('/:id', validateParams(userIdParamsSchema), obterUsuario);

export default router;
```

## Middleware de validação (genérico)

- Crie um middleware reutilizável que usa Zod e retorna erro 400 padronizado em caso de falha.

**Exemplo (`src/middlewares/validation.middleware.ts`):**

```ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export const validateBody =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error,
      });
    }
  };

// Similar para query e params
```

## Tratamento central de erros

- Middleware global `errorHandler` no final do app (`app.use(errorHandler)`). Captura exceções e responde com `{ success: false, error: message }`.

**Exemplo:**

```ts
import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(err); // log mascarado (maskPII)
  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message,
  });
};
```

## Respostas padronizadas

Use sempre o envelope:

```ts
res.status(200).json({ success: true, data: resultado });
res.status(400).json({ success: false, error: 'Mensagem amigável' });
```

Para listas, retorne `{ success: true, data: { items: [...], total } }` ou similar.

## Dicas e boas práticas

**Async handler:** crie um helper para evitar `try/catch` em cada handler:

```ts
import type { Request, Response, NextFunction } from 'express';

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

- **Sanitização de logs:** aplique `maskPII` em qualquer log que possa conter dados sensíveis.
- **Versionamento:** prefixe rotas com `/api/v1/...` se necessário.
- **Documentação:** use comentários JSDoc no controller para descrever o que o endpoint faz.

## Exemplo pronto (criação de módulo)

Ao pedir para criar um endpoint, o agente segue este template. Exemplo final de um módulo **usuarios**:

| Arquivo         | Conteúdo |
|----------------|----------|
| `validation.ts` | Schemas como na seção acima. |
| `service.ts`    | `criarUsuarioService(dados: CreateUserBody) => Promise<Usuario>` |
| `controller.ts` | Handlers `criarUsuario`, `obterUsuario`. |
| `routes.ts`     | Rotas POST e GET com validação. |
| `index.ts`      | `export { default as usuariosRoutes } from './routes';` |

**Montagem no app:** `app.use('/api/usuarios', usuariosRoutes);`
