import type { NoteArticle } from "@/types/note";
import type { MonthlyCount } from "@/types/analysis";

/** 日付ごとの投稿数マップを返す */
export function calcPostingFrequency(
  articles: NoteArticle[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const article of articles) {
    const date = article.publish_at.slice(0, 10); // YYYY-MM-DD
    map[date] = (map[date] || 0) + 1;
  }
  return map;
}

/** 月別投稿数の配列を返す */
export function calcMonthlyPostCount(
  articles: NoteArticle[]
): MonthlyCount[] {
  const map: Record<string, number> = {};
  for (const article of articles) {
    const month = article.publish_at.slice(0, 7); // YYYY-MM
    map[month] = (map[month] || 0) + 1;
  }

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}
