"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

interface SeriesData {
  name: string;
  data: { month: string; value: number }[];
}

interface Props {
  seriesList: SeriesData[];
  yLabel: string;
}

export function CompareLineChart({ seriesList, yLabel }: Props) {
  if (seriesList.length === 0) {
    return <p className="text-sm text-slate-400">データがありません</p>;
  }

  // 全シリーズの月を統合
  const allMonths = new Set<string>();
  for (const series of seriesList) {
    for (const d of series.data) {
      allMonths.add(d.month);
    }
  }
  const sortedMonths = Array.from(allMonths).sort();

  // 統合データを作成
  const chartData = sortedMonths.map((month) => {
    const row: Record<string, string | number> = { month };
    for (const series of seriesList) {
      const found = series.data.find((d) => d.month === month);
      row[series.name] = found ? found.value : 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          label={{
            value: yLabel,
            angle: -90,
            position: "insideLeft",
            fill: "#94a3b8",
            fontSize: 12,
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#f8fafc",
          }}
        />
        <Legend wrapperStyle={{ color: "#94a3b8" }} />
        {seriesList.map((series, i) => (
          <Line
            key={series.name}
            type="monotone"
            dataKey={series.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ fill: COLORS[i % COLORS.length], r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
