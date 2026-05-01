const mockInvoke = jest.fn();

jest.mock("../../services/llm-client", () => ({
  createLLM: () => ({
    invoke: mockInvoke,
  }),
}));

import { classificarTicket } from "./agent";

describe("classificarTicket", () => {
  it("faz parse quando o LLM retorna JSON válido", async () => {
    mockInvoke.mockResolvedValueOnce({
      content: `{"categoria":"elogio","confianca":0.9}`,
    });

    const out = await classificarTicket({
      id: "1",
      texto: "Obrigado pelo suporte!",
    });

    expect(out).toEqual({ categoria: "elogio", confianca: 0.9 });
  });

  it("retorna fail-safe quando o LLM retorna texto não parseável", async () => {
    mockInvoke.mockResolvedValueOnce({
      content: `não sei, parece uma dúvida`,
    });

    const out = await classificarTicket({
      id: "2",
      texto: "Como configuro a API?",
    });

    expect(out).toEqual({ categoria: "duvida_tecnica", confianca: 0.0 });
  });
});
