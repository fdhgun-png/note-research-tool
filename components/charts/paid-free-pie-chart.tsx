"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { PaidFreeRatio } from "@/types/analysis";

interface Props {
  data: PaidFreeRatio;
}

const COLORS = ["#10b981", "#64748b"];

export function PaidFreePieChart({ data }: Props) {
  const chartData = [
    { name: "有料", value: data.paid },
    { name: "無料", value: data.free },
  ];

  if (data.paid === 0 && data.free === 0) {
    return <p className="text-sm text-slate-400">データがありません</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          label={(props) =>
            `${props.name ?? ""} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`
          }
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#f8fafc",
          }}
          formatter={(value) => [`${value}件`, ""]}
        />
        <Legend
          wrapperStyle={{ color: "#94a3b8" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
