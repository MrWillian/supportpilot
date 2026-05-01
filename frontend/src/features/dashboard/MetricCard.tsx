import type { LucideIcon } from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { cn } from "../../lib/utils";

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: { label: string; tone?: "good" | "bad" | "neutral" };
}) {
  const variant =
    trend?.tone === "good"
      ? ("secondary" as const)
      : trend?.tone === "bad"
        ? ("destructive" as const)
        : ("outline" as const);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
          <span>{title}</span>
          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {trend ? (
          <Badge
            variant={variant}
            className={cn(
              "shrink-0",
              trend.tone === "good" && "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
            )}
          >
            {trend.label}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}

