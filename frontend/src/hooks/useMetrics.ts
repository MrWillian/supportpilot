import { useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";

export type Metrics = {
  totalTickets: number;
  porCategoria: {
    reclamacao: number;
    duvida_tecnica: number;
    cancelamento: number;
    elogio: number;
  };
  confiancaMedia: number;
  tempoMedioMs: number;
};

export function useMetrics() {
  const [data, setData] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useMemo(
    () => async () => {
      try {
        setError(null);
        const res = await api.get<Metrics>("/metrics");
        setData(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetcher();
    const id = window.setInterval(() => {
      void fetcher();
    }, 5000);
    return () => window.clearInterval(id);
  }, [fetcher]);

  return { data, isLoading, error } as const;
}

