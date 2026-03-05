import { NextRequest, NextResponse } from "next/server";
import { fetchCreatorProfile, fetchCreatorArticles } from "@/lib/note-api";
import {
  rankArticlesByLikes,
  getTopArticles,
  calcPostingFrequency,
  calcMonthlyPostCount,
  calcPriceDistribution,
  calcPaidFreeRatio,
  extractTitleKeywords,
  calcBestPostingDay,
  calcPostingTimeHeatmap,
  generateDiagnosis,
} from "@/lib/analysis";
import type { UserAnalysisResult } from "@/types/analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usernames } = body as { usernames: string[] };

    // バリデーション
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json(
        { error: "ユーザー名を1つ以上指定してください" },
        { status: 400 }
      );
    }

    if (usernames.length > 5) {
      return NextResponse.json(
        { error: "ユーザー名は最大5件までです" },
        { status: 400 }
      );
    }

    const results: UserAnalysisResult[] = [];

    for (const username of usernames) {
      try {
        // プロフィールと全記事を取得
        const profile = await fetchCreatorProfile(username);
        const articles = await fetchCreatorArticles(username);

        // 分析実行
        const ranking = rankArticlesByLikes(articles);
        const topArticles = getTopArticles(articles, 5);
        const postingFrequency = calcPostingFrequency(articles);
        const monthlyPostCount = calcMonthlyPostCount(articles);
        const priceDistribution = calcPriceDistribution(articles);
        const paidFreeRatio = calcPaidFreeRatio(articles);
        const titleKeywords = await extractTitleKeywords(articles);
        const bestPostingDay = calcBestPostingDay(articles);
        const postingTimeHeatmap = calcPostingTimeHeatmap(articles);

        // 診断データを組み立てて診断実行
        const diagnosisInput = {
          profile,
          articles,
          ranking,
          topArticles,
          postingFrequency,
          monthlyPostCount,
          priceDistribution,
          paidFreeRatio,
          titleKeywords,
          bestPostingDay,
          postingTimeHeatmap,
          diagnosis: [],
        };
        const diagnosis = generateDiagnosis(diagnosisInput);

        results.push({
          profile,
          articles,
          analysis: {
            ranking,
            topArticles,
            postingFrequency,
            monthlyPostCount,
            priceDistribution,
            paidFreeRatio,
            titleKeywords,
            bestPostingDay,
            postingTimeHeatmap,
            diagnosis,
          },
        });
      } catch (error) {
        // 個別ユーザーのエラーは結果にerrorフィールドとして含める
        results.push({
          profile: {
            id: 0,
            nickname: username,
            urlname: username,
            profile: "",
            follower_count: 0,
            note_count: 0,
            user_profile_image_path: "",
          },
          articles: [],
          analysis: {
            ranking: [],
            topArticles: [],
            postingFrequency: {},
            monthlyPostCount: [],
            priceDistribution: [],
            paidFreeRatio: { paid: 0, free: 0 },
            titleKeywords: [],
            bestPostingDay: [],
            postingTimeHeatmap: [],
            diagnosis: [],
          },
          error:
            error instanceof Error
              ? error.message
              : `ユーザー "${username}" のデータ取得に失敗しました`,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "リクエストの処理に失敗しました",
      },
      { status: 500 }
    );
  }
}
