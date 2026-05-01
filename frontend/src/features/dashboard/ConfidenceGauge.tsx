import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function ConfidenceGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Confiança média</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-semibold">{pct.toFixed(0)}%</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {value.toFixed(2)}
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

