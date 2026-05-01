jest.mock("../config/redis", () => ({
  redisConnection: {},
}));

jest.mock("../agents/classifier/agent", () => ({
  classificarTicket: jest.fn(),
}));

import { classificarTicket } from "../agents/classifier/agent";
import { resultadosTriage } from "../stores/triage.store";
import { runTriageJob } from "./triage.worker";

const classificarMock = jest.mocked(classificarTicket);

describe("triage worker", () => {
  afterEach(() => {
    classificarMock.mockReset();
    resultadosTriage.clear();
  });

  it("processa o ticket e armazena o resultado no Map", async () => {
    classificarMock.mockResolvedValue({ categoria: "elogio", confianca: 0.9 });

    await runTriageJob({ id: "t-1", texto: "Muito obrigado pelo suporte." });

    expect(resultadosTriage.get("t-1")).toEqual({
      categoria: "elogio",
      confianca: 0.9,
    });
  });

  it("falha na 1ª tentativa e conclui na 2ª (como retry do BullMQ)", async () => {
    classificarMock
      .mockRejectedValueOnce(new Error("falha simulada do classificador"))
      .mockResolvedValue({ categoria: "reclamacao", confianca: 0.5 });

    await expect(
      runTriageJob({ id: "t-2", texto: "Cobrança indevida." }),
    ).rejects.toThrow("falha simulada do classificador");
    expect(resultadosTriage.has("t-2")).toBe(false);

    await runTriageJob({ id: "t-2", texto: "Cobrança indevida." });
    expect(classificarMock).toHaveBeenCalledTimes(2);
    expect(resultadosTriage.get("t-2")).toEqual({
      categoria: "reclamacao",
      confianca: 0.5,
    });
  });
});
