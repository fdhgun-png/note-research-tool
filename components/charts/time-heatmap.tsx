"use client";

import type { TimeHeatmapEntry } from "@/types/analysis";

interface Props {
  data: TimeHeatmapEntry[];
}

const DAYS = ["月", "火", "水", "木", "金", "土", "日"];

function getColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-slate-800";
  const ratio = value / max;
  if (ratio > 0.75) return "bg-emerald-500";
  if (ratio > 0.5) return "bg-emerald-600";
  if (ratio > 0.25) return "bg-emerald-700";
  return "bg-emerald-900";
}

export function TimeHeatmap({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">データがありません</p>;
  }

  const maxLikes = Math.max(...data.map((d) => d.avgLikes));

  // 曜日ごとにグループ化
  const byDay: Record<string, TimeHeatmapEntry[]> = {};
  for (const day of DAYS) {
    byDay[day] = data.filter((d) => d.day === day);
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* 時間帯ヘッダー */}
        <div className="flex items-center gap-[2px] mb-1">
          <div className="w-8 shrink-0" />
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="flex-1 text-center text-[10px] text-slate-500"
            >
              {i % 3 === 0 ? `${i}` : ""}
            </div>
          ))}
        </div>
        {/* グリッド */}
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-[2px] mb-[2px]">
            <div className="w-8 shrink-0 text-xs text-slate-400 text-right pr-1">
              {day}
            </div>
            {(byDay[day] || []).map((entry) => (
              <div
                key={`${day}-${entry.hour}`}
                className={`flex-1 aspect-square rounded-sm ${getColor(entry.avgLikes, maxLikes)} transition-colors`}
                title={`${day}曜 ${entry.hour}時: 平均${entry.avgLikes}スキ`}
              />
            ))}
          </div>
        ))}
        {/* 凡例 */}
        <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-500">
          <span>少</span>
          <div className="w-3 h-3 rounded-sm bg-slate-800" />
          <div className="w-3 h-3 rounded-sm bg-emerald-900" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
