import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";

export function createLLM() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in environment (.env).");
  }

  return new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
  });
}
