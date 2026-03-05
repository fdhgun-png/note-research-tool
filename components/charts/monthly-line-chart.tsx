"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyCount } from "@/types/analysis";

interface Props {
  data: MonthlyCount[];
}

export function MonthlyLineChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">データがありません</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          angle={-30}
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
        <Line
          type="monotone"
          dataKey="count"
          name="投稿数"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
