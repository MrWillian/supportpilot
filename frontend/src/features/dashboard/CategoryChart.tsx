import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function CategoryChart({
  porCategoria,
}: {
  porCategoria: {
    reclamacao: number;
    duvida_tecnica: number;
    cancelamento: number;
    elogio: number;
  };
}) {
  const data = [
    { name: "Reclamação", key: "reclamacao", value: porCategoria.reclamacao },
    { name: "Dúvida", key: "duvida_tecnica", value: porCategoria.duvida_tecnica },
    { name: "Cancelamento", key: "cancelamento", value: porCategoria.cancelamento },
    { name: "Elogio", key: "elogio", value: porCategoria.elogio },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição por categoria</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

