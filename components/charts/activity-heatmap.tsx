"use client";

import { ActivityCalendar } from "react-activity-calendar";

interface Props {
  postingFrequency: Record<string, number>;
}

export function ActivityHeatmap({ postingFrequency }: Props) {
  const entries = Object.entries(postingFrequency);
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">データがありません</p>;
  }

  // 直近1年分を計算
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // react-activity-calendar用のデータ形式に変換
  // 開始日から終了日まで連続した日付が必要
  const startDate = new Date(oneYearAgo);
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(now);

  const calendarData: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
  const maxCount = Math.max(...entries.map(([, c]) => c), 1);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const count = postingFrequency[dateStr] || 0;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      const ratio = count / maxCount;
      if (ratio > 0.75) level = 4;
      else if (ratio > 0.5) level = 3;
      else if (ratio > 0.25) level = 2;
      else level = 1;
    }

    calendarData.push({ date: dateStr, count, level });
  }

  return (
    <div className="overflow-x-auto">
      <ActivityCalendar
        data={calendarData}
        theme={{
          dark: ["#1e293b", "#064e3b", "#047857", "#059669", "#10b981"],
        }}
        colorScheme="dark"
        blockSize={12}
        blockMargin={3}
        fontSize={12}
        labels={{
          months: [
            "1月", "2月", "3月", "4月", "5月", "6月",
            "7月", "8月", "9月", "10月", "11月", "12月",
          ],
          weekdays: ["日", "月", "火", "水", "木", "金", "土"],
          totalCount: "過去1年で{{count}}件の投稿",
        }}
      />
    </div>
  );
}
