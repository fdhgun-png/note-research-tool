import type { NoteArticle } from "@/types/note";

/**
 * 記事単位の推定最低収益を算出
 *
 * 計算ロジック:
 * - 高評価（raterCount）は有料記事を購入した人のみが付けられる
 * - 高評価率を最大50%と仮定すると、最低購入者数 = raterCount × 2
 * - 推定最低収益 = 最低購入者数 × 価格
 *
 * NOTE: noteのプラットフォーム手数料（10〜20%）は考慮していない（売上ベース）
 */
export function estimateArticleRevenue(article: NoteArticle): number {
  if (article.price <= 0 || article.rater_count <= 0) return 0;
  return article.rater_count * 2 * article.price;
}

/**
 * クリエイター全体の推定最低総収益を算出
 */
export function estimateCreatorTotalRevenue(articles: NoteArticle[]): number {
  return articles.reduce((sum, article) => {
    return sum + estimateArticleRevenue(article);
  }, 0);
}

/**
 * 推定収益TOP N件を返す（有料記事のみ、収益降順）
 */
export function getTopRevenueArticles(
  articles: NoteArticle[],
  count: number
): NoteArticle[] {
  return articles
    .filter((a) => a.price > 0 && a.rater_count > 0)
    .sort((a, b) => estimateArticleRevenue(b) - estimateArticleRevenue(a))
    .slice(0, count);
}
