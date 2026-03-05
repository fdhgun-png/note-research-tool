import type { NoteArticle } from "@/types/note";
import type { DayAvgLikes, TimeHeatmapEntry } from "@/types/analysis";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

/** 曜日別の平均スキ数を返す */
export function calcBestPostingDay(articles: NoteArticle[]): DayAvgLikes[] {
  const dayData: Record<number, { total: number; count: number }> = {};

  for (let i = 0; i < 7; i++) {
    dayData[i] = { total: 0, count: 0 };
  }

  for (const article of articles) {
    const date = new Date(article.publish_at);
    const dayIndex = date.getDay(); // 0=日, 1=月, ...
    dayData[dayIndex].total += article.like_count;
    dayData[dayIndex].count += 1;
  }

  // 月曜日始まりで返す
  const order = [1, 2, 3, 4, 5, 6, 0]; // 月火水木金土日
  return order.map((i) => ({
    day: DAY_NAMES[i],
    avgLikes:
      dayData[i].count > 0
        ? Math.round((dayData[i].total / dayData[i].count) * 10) / 10
        : 0,
  }));
}

/** 曜日×時間帯（0-23時）ごとの平均スキ数を返す */
export function calcPostingTimeHeatmap(
  articles: NoteArticle[]
): TimeHeatmapEntry[] {
  const grid: Record<string, { total: number; count: number }> = {};

  // 全スロット初期化
  const order = [1, 2, 3, 4, 5, 6, 0];
  for (const dayIndex of order) {
    for (let hour = 0; hour < 24; hour++) {
      grid[`${dayIndex}-${hour}`] = { total: 0, count: 0 };
    }
  }

  for (const article of articles) {
    const date = new Date(article.publish_at);
    const dayIndex = date.getDay();
    const hour = date.getHours();
    const key = `${dayIndex}-${hour}`;
    grid[key].total += article.like_count;
    grid[key].count += 1;
  }

  const result: TimeHeatmapEntry[] = [];
  for (const dayIndex of order) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${dayIndex}-${hour}`;
      const { total, count } = grid[key];
      result.push({
        day: DAY_NAMES[dayIndex],
        hour,
        avgLikes: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
      });
    }
  }

  return result;
}
