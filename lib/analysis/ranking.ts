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
