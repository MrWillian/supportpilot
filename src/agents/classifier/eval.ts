import type { TicketInput } from "./schema";

export type ClassifierEvalCase = {
  name: string;
  ticket: TicketInput;
  expectedCategoria: "reclamacao" | "duvida_tecnica" | "cancelamento" | "elogio";
};

export const classifierEvalSet: ClassifierEvalCase[] = [
  {
    name: "duvida_tecnica - 401 api",
    ticket: {
      id: "t1",
      texto: "Estou tentando integrar a API de disparo de emails mas recebo erro 401 toda vez.",
    },
    expectedCategoria: "duvida_tecnica",
  },
  {
    name: "cancelamento - intenção explícita mesmo com bug",
    ticket: {
      id: "t2",
      texto: "A plataforma está cheia de bugs e isso está me prejudicando. Quero cancelar meu plano agora.",
    },
    expectedCategoria: "cancelamento",
  },
  {
    name: "elogio - suporte resolveu",
    ticket: {
      id: "t3",
      texto: "Muito obrigado pelo suporte ontem, resolveu meu problema rapidamente!",
    },
    expectedCategoria: "elogio",
  },
  {
    name: "reclamacao - cobrança indevida",
    ticket: {
      id: "t4",
      texto: "Fui cobrado duas vezes este mês e ninguém respondeu meu chamado. Isso é inaceitável.",
    },
    expectedCategoria: "reclamacao",
  },
  {
    name: "ambiguo - irritado mas pedindo ajuda técnica",
    ticket: {
      id: "t5",
      texto: "Isso tá me deixando maluco: não consigo configurar o webhook e nada funciona. Como arrumo?",
    },
    expectedCategoria: "duvida_tecnica",
  },
];
