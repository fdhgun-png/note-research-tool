import { BASE_URL, rateLimitedFetch } from "./client";
import type { NoteHashtag } from "@/types/note";

/** キーワードで記事を検索 */
export async function searchNotes(
  keyword: string,
  size = 20
): Promise<{ notes: Record<string, unknown>[]; totalCount: number }> {
  const params = new URLSearchParams({
    context: "note",
    q: keyword,
    size: String(size),
    start: "0",
  });
  const res = await rateLimitedFetch(`${BASE_URL}/v3/searches?${params}`);
  const json = await res.json();
  return {
    notes: json.data?.notes?.contents ?? [],
    totalCount: json.data?.notes?.totalCount ?? json.data?.notes?.total_count ?? 0,
  };
}

/** ハッシュタグ情報を取得 */
export async function fetchHashtagInfo(
  tagname: string
): Promise<NoteHashtag> {
  const res = await rateLimitedFetch(`${BASE_URL}/v2/hashtags/${tagname}`);
  const json = await res.json();
  const data = json.data;
  return {
    name: data.name ?? data.hashtag?.name ?? tagname,
    note_count: data.noteCount ?? data.note_count ?? 0,
  };
}
