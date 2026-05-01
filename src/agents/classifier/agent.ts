import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

import { createLLM } from "../../services/llm-client";
import { classifierSystemPrompt } from "../../prompts/classifier.prompt";
import {
  ClassifierOutputSchema,
  type ClassifierOutput,
  TicketInputSchema,
  type TicketInput,
} from "./schema";

export async function classificarTicket(
  ticket: TicketInput,
): Promise<ClassifierOutput> {
  const parsedTicket = TicketInputSchema.safeParse(ticket);

  if (!parsedTicket.success) {
    return { categoria: "duvida_tecnica", confianca: 0.0 };
  }

  const llm = (() => {
    try {
      return createLLM();
    } catch {
      return null;
    }
  })();

  if (!llm) return { categoria: "duvida_tecnica", confianca: 0.0 };

  const parser = StructuredOutputParser.fromZodSchema(ClassifierOutputSchema);
  const formatInstructions = parser.getFormatInstructions();

  const systemPrompt = [
    classifierSystemPrompt,
    "",
    formatInstructions,
    "",
    "Responda com APENAS um JSON válido.",
  ].join("\n");

  try {
    const res = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Ticket: ${parsedTicket.data.texto}`),
    ]);

    const content =
      typeof res.content === "string" ? res.content : JSON.stringify(res.content);

    return await parser.parse(content);
  } catch {
    return { categoria: "duvida_tecnica", confianca: 0.0 };
  }
}

