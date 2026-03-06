import { BASE_URL, rateLimitedFetch } from "./client";

/** 高評価データ */
export interface RaterData {
  raterCount: number;
  isRatable: boolean;
}

/** 記事詳細を取得し、高評価データを返す */
export async function fetchArticleRaterData(
  noteId: string
): Promise<RaterData> {
  try {
    const res = await rateLimitedFetch(`${BASE_URL}/v3/notes/${noteId}`);
    const json = await res.json();
    const data = json.data;
    return {
      raterCount: data?.raterCount ?? data?.rater_count ?? 0,
      isRatable: data?.isRatable ?? data?.is_ratable ?? false,
    };
  } catch {
    return { raterCount: 0, isRatable: false };
  }
}

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
