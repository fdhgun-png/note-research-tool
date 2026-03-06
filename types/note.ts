/** noteクリエイター（ユーザー）情報（正規化済み） */
export interface NoteCreator {
  /** ユーザーID */
  id: number;
  /** 表示名 */
  nickname: string;
  /** URLに使われるユーザー名 (note.com/{urlname}) */
  urlname: string;
  /** プロフィール文 */
  profile: string;
  /** フォロワー数 */
  follower_count: number;
  /** 記事数 */
  note_count: number;
  /** プロフィール画像URL */
  user_profile_image_path: string;
}

/** note記事情報（正規化済み） */
export interface NoteArticle {
  /** 記事ID */
  id: number;
  /** 記事のキー（URLに使用） */
  key: string;
  /** タイトル */
  title: string;
  /** 本文（抜粋の場合あり） */
  body: string | null;
  /** スキ数 */
  like_count: number;
  /** 公開日時 (ISO 8601) */
  publish_at: string;
  /** 有料記事かどうか */
  is_limited: boolean;
  /** 価格（無料記事は0） */
  price: number;
  /** ハッシュタグ名の配列 */
  hashtags: string[];
  /** 記事のステータス */
  status: string;
  /** 記事タイプ */
  type: string;
  /** 記事URL用のユーザー名 */
  user: {
    urlname: string;
  };
  /** コメント数 */
  comment_count: number;
  /** 記事の画像URL */
  eyecatch?: string;
  /** 高評価した人数（有料記事のみ、v3 notes APIから取得） */
  rater_count: number;
  /** 高評価可能な記事かどうか */
  is_ratable: boolean;
}

/** 高評価者情報 */
export interface ContentRater {
  nickname: string;
  urlname: string;
  userProfileImageUrl: string;
}

/** note API 生レスポンス型 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawApiData = any;

/** 記事一覧APIレスポンス（生） */
export interface ContentsRawResponse {
  data: {
    contents: RawApiData[];
    isLastPage: boolean;
    totalCount: number;
  };
}

/** ユーザー情報APIレスポンス（生） */
export interface CreatorRawResponse {
  data: RawApiData;
}

/** note検索結果 */
export interface NoteSearchResult {
  notes: NoteArticle[];
  total_count: number;
}

/** ハッシュタグ情報 */
export interface NoteHashtag {
  name: string;
  note_count: number;
}
