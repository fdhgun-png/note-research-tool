"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PriceRange } from "@/types/analysis";

interface Props {
  data: PriceRange[];
}

export function PriceBarChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">データがありません</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="range"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#f8fafc",
          }}
        />
        <Bar dataKey="count" name="記事数" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
