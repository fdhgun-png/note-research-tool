import type { NoteArticle } from "@/types/note";

/** スキ数降順にソート */
export function rankArticlesByLikes(articles: NoteArticle[]): NoteArticle[] {
  return [...articles].sort((a, b) => b.like_count - a.like_count);
}

/** スキ数TOP N件を返す */
export function getTopArticles(
  articles: NoteArticle[],
  count: number
): NoteArticle[] {
  return rankArticlesByLikes(articles).slice(0, count);
}

/** 高評価数TOP N件を返す（有料記事のみ） */
export function getTopRatedArticles(
  articles: NoteArticle[],
  count: number
): NoteArticle[] {
  return articles
    .filter((a) => a.price > 0 && a.rater_count > 0)
    .sort((a, b) => b.rater_count - a.rater_count)
    .slice(0, count);
}
