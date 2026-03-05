import type { NoteArticle } from "@/types/note";
import type { PriceRange, PaidFreeRatio } from "@/types/analysis";

/** 価格帯ごとの記事数を返す */
export function calcPriceDistribution(articles: NoteArticle[]): PriceRange[] {
  const ranges: { label: string; min: number; max: number }[] = [
    { label: "無料", min: 0, max: 0 },
    { label: "〜500円", min: 1, max: 500 },
    { label: "500〜1,000円", min: 501, max: 1000 },
    { label: "1,000〜3,000円", min: 1001, max: 3000 },
    { label: "3,000〜5,000円", min: 3001, max: 5000 },
    { label: "5,000円〜", min: 5001, max: Infinity },
  ];

  return ranges.map(({ label, min, max }) => ({
    range: label,
    count: articles.filter((a) => {
      const price = a.price || 0;
      return price >= min && price <= max;
    }).length,
  }));
}

/** 有料記事と無料記事の件数を返す */
export function calcPaidFreeRatio(articles: NoteArticle[]): PaidFreeRatio {
  const paid = articles.filter((a) => a.price > 0).length;
  return { paid, free: articles.length - paid };
}
