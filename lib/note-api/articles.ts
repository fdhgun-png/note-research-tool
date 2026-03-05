import { BASE_URL, rateLimitedFetch } from "./client";

/** 記事詳細を取得（生データ） */
export async function fetchArticleDetail(
  noteId: string
): Promise<Record<string, unknown>> {
  const res = await rateLimitedFetch(`${BASE_URL}/v3/notes/${noteId}`);
  const json = await res.json();
  return json.data;
}

/** 記事のスキ一覧を取得 */
export async function fetchArticleLikes(
  noteId: string
): Promise<{ likes: unknown[] }> {
  const res = await rateLimitedFetch(`${BASE_URL}/v3/notes/${noteId}/likes`);
  const json = await res.json();
  return json.data;
}
