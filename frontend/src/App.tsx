import { Activity, Clock, Layers3, Percent } from "lucide-react";

import { CategoryChart } from "./features/dashboard/CategoryChart";
import { ConfidenceGauge } from "./features/dashboard/ConfidenceGauge";
import { DashboardSkeleton } from "./features/dashboard/DashboardSkeleton";
import { MetricCard } from "./features/dashboard/MetricCard";
import { useMetrics } from "./hooks/useMetrics";

function App() {
  const { data, isLoading, error } = useMetrics();

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <header className="shrink-0 border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-slate-900 dark:text-slate-50" />
            <div className="text-sm font-semibold tracking-tight">
              SupportPilot Dashboard
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Atualiza a cada 5s
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col space-y-6 px-4 py-6">
        {isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            Erro ao carregar métricas: {error}
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total de tickets"
                value={String(data.totalTickets)}
                icon={Activity}
              />
              <MetricCard
                title="Confiança média"
                value={`${Math.round(data.confiancaMedia * 100)}%`}
                icon={Percent}
              />
              <MetricCard
                title="Tempo médio"
                value={`${Math.round(data.tempoMedioMs)} ms`}
                icon={Clock}
              />
              <MetricCard
                title="Cancelamentos"
                value={String(data.porCategoria.cancelamento)}
                icon={Layers3}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <CategoryChart porCategoria={data.porCategoria} />
              </div>
              <ConfidenceGauge value={data.confiancaMedia} />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
