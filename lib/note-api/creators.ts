import { BASE_URL, rateLimitedFetch } from "./client";
import type {
  NoteCreator,
  NoteArticle,
  CreatorRawResponse,
  ContentsRawResponse,
  RawApiData,
} from "@/types/note";

/** API生データからNoteCreatorに正規化 */
function normalizeCreator(raw: RawApiData): NoteCreator {
  return {
    id: raw.id,
    nickname: raw.nickname,
    urlname: raw.urlname,
    profile: raw.profile || "",
    follower_count: raw.followerCount ?? raw.follower_count ?? 0,
    note_count: raw.noteCount ?? raw.note_count ?? 0,
    user_profile_image_path:
      raw.profileImageUrl ?? raw.user_profile_image_path ?? "",
  };
}

/** API生データからNoteArticleに正規化 */
function normalizeArticle(raw: RawApiData): NoteArticle {
  // ハッシュタグの正規化
  let hashtags: string[] = [];
  if (Array.isArray(raw.hashtags)) {
    hashtags = raw.hashtags.map((h: RawApiData) =>
      typeof h === "string" ? h : h.hashtag?.name ?? h.name ?? ""
    );
  } else if (Array.isArray(raw.hashtag_notes)) {
    hashtags = raw.hashtag_notes.map(
      (h: RawApiData) => h.hashtag?.name ?? ""
    );
  }

  return {
    id: raw.id,
    key: raw.key ?? "",
    title: raw.name ?? raw.title ?? "",
    body: raw.body ?? null,
    like_count: raw.likeCount ?? raw.like_count ?? 0,
    publish_at: raw.publishAt ?? raw.publish_at ?? "",
    is_limited: raw.isLimited ?? raw.is_limited ?? false,
    price: raw.price ?? 0,
    hashtags,
    status: raw.status ?? "",
    type: raw.type ?? "",
    user: {
      urlname: raw.user?.urlname ?? "",
    },
    comment_count: raw.commentCount ?? raw.comment_count ?? 0,
    eyecatch: raw.eyecatch ?? undefined,
    rater_count: raw.raterCount ?? raw.rater_count ?? 0,
    is_ratable: raw.isRatable ?? raw.is_ratable ?? false,
  };
}

/** ユーザープロフィールを取得 */
export async function fetchCreatorProfile(
  username: string
): Promise<NoteCreator> {
  const res = await rateLimitedFetch(`${BASE_URL}/v2/creators/${username}`);
  const json: CreatorRawResponse = await res.json();
  return normalizeCreator(json.data);
}

/** ユーザーの全記事を自動ページネーションで取得 */
export async function fetchCreatorArticles(
  username: string
): Promise<NoteArticle[]> {
  const allArticles: NoteArticle[] = [];
  let page = 1;

  while (true) {
    const res = await rateLimitedFetch(
      `${BASE_URL}/v2/creators/${username}/contents?kind=note&page=${page}`
    );
    const json: ContentsRawResponse = await res.json();
    const contents = json.data.contents;

    if (!contents || contents.length === 0) {
      break;
    }

    allArticles.push(...contents.map(normalizeArticle));

    if (json.data.isLastPage) {
      break;
    }

    page++;
  }

  return allArticles;
}
