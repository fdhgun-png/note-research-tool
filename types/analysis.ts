import type { NoteArticle, NoteCreator } from "./note";

/** 診断結果の種別 */
export type DiagnosisType = "success" | "warning" | "info";

/** 診断結果 */
export interface DiagnosisResult {
  type: DiagnosisType;
  title: string;
  message: string;
}

/** 価格帯分布 */
export interface PriceRange {
  range: string;
  count: number;
}

/** 有料/無料比率 */
export interface PaidFreeRatio {
  paid: number;
  free: number;
}

/** キーワード頻度 */
export interface KeywordFrequency {
  word: string;
  count: number;
}

/** 曜日別平均スキ数 */
export interface DayAvgLikes {
  day: string;
  avgLikes: number;
}

/** 曜日×時間帯別平均スキ数 */
export interface TimeHeatmapEntry {
  day: string;
  hour: number;
  avgLikes: number;
}

/** 月別投稿数 */
export interface MonthlyCount {
  month: string;
  count: number;
}

/** 全分析結果をまとめた型 */
export interface AnalysisData {
  profile: NoteCreator;
  articles: NoteArticle[];
  ranking: NoteArticle[];
  topArticles: NoteArticle[];
  topRatedArticles: NoteArticle[];
  postingFrequency: Record<string, number>;
  monthlyPostCount: MonthlyCount[];
  priceDistribution: PriceRange[];
  paidFreeRatio: PaidFreeRatio;
  titleKeywords: KeywordFrequency[];
  bestPostingDay: DayAvgLikes[];
  postingTimeHeatmap: TimeHeatmapEntry[];
  diagnosis: DiagnosisResult[];
  /** 推定最低総収益（円） */
  estimatedTotalRevenue: number;
  /** 推定収益TOP記事 */
  topRevenueArticles: NoteArticle[];
}

/** API レスポンス（1ユーザー分） */
export interface UserAnalysisResult {
  profile: NoteCreator;
  articles: NoteArticle[];
  analysis: Omit<AnalysisData, "profile" | "articles">;
  error?: string;
}

/** API レスポンス全体 */
export interface AnalyzeResponse {
  results: UserAnalysisResult[];
}
