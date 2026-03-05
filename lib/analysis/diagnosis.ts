import type { NoteArticle } from "@/types/note";
import type { AnalysisData, DiagnosisResult } from "@/types/analysis";

/** ルールベースの自動診断を生成 */
export function generateDiagnosis(data: AnalysisData): DiagnosisResult[] {
  const results: DiagnosisResult[] = [];
  const { articles, paidFreeRatio, bestPostingDay, topArticles } = data;
  const totalArticles = articles.length;

  if (totalArticles === 0) {
    results.push({
      type: "warning",
      title: "記事がありません",
      message: "このアカウントにはまだ記事が公開されていません。",
    });
    return results;
  }

  const avgLikes =
    articles.reduce((sum, a) => sum + a.like_count, 0) / totalArticles;
  const paidArticles = articles.filter((a) => a.price > 0);
  const paidRatio = totalArticles > 0 ? paidArticles.length / totalArticles : 0;

  // 1. 総記事数が10未満
  if (totalArticles < 10) {
    results.push({
      type: "warning",
      title: "記事数が少なめ",
      message:
        "まだ記事が少ないです。まずは30記事を目指しましょう。",
    });
  }

  // 2. 有料記事が0
  if (paidArticles.length === 0) {
    results.push({
      type: "info",
      title: "有料記事なし",
      message:
        "有料記事がありません。人気記事から有料化を検討してみては？",
    });
  }

  // 3. 有料記事比率が5%未満（かつ有料記事がある場合）
  if (paidArticles.length > 0 && paidRatio < 0.05) {
    results.push({
      type: "info",
      title: "有料記事の比率が低め",
      message:
        "有料記事の比率が低めです。全体の20%を目標にしてみましょう。",
    });
  }

  // 4. 有料記事比率が50%以上
  if (paidRatio >= 0.5) {
    results.push({
      type: "warning",
      title: "有料記事が多め",
      message:
        "有料記事が多めです。無料記事で集客してからの導線を意識しましょう。",
    });
  }

  // 5. 平均スキ数が10以上
  if (avgLikes >= 10) {
    results.push({
      type: "success",
      title: "高いエンゲージメント",
      message:
        "スキ数は高水準！有料記事の価格を上げる余地があります。",
    });
  }

  // 6. 平均スキ数が3未満
  if (avgLikes < 3) {
    results.push({
      type: "warning",
      title: "スキ数を伸ばす余地あり",
      message:
        "スキ数を伸ばすために、タイトルの改善とSNSでの告知を強化しましょう。",
    });
  }

  // 7. 直近1ヶ月の投稿が0
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const recentArticles = articles.filter(
    (a) => new Date(a.publish_at) >= oneMonthAgo
  );
  if (recentArticles.length === 0) {
    results.push({
      type: "warning",
      title: "更新が止まっています",
      message:
        "1ヶ月以上更新が止まっています。定期更新が読者定着のカギです。",
    });
  }

  // 8 & 9. 週平均投稿数
  const dates = articles.map((a) => new Date(a.publish_at).getTime());
  const oldestDate = Math.min(...dates);
  const newestDate = Math.max(...dates);
  const weeks = Math.max(
    1,
    (newestDate - oldestDate) / (7 * 24 * 60 * 60 * 1000)
  );
  const weeklyAvg = totalArticles / weeks;

  if (weeklyAvg >= 3) {
    results.push({
      type: "success",
      title: "高頻度の更新",
      message: "高頻度の更新、素晴らしいペースです！",
    });
  }

  if (weeklyAvg < 0.5) {
    results.push({
      type: "warning",
      title: "更新頻度が低め",
      message:
        "更新頻度が低めです。最低でも週1本を目指しましょう。",
    });
  }

  // 10. 最もスキが多い曜日を特定
  if (bestPostingDay.length > 0) {
    const best = bestPostingDay.reduce((a, b) =>
      a.avgLikes > b.avgLikes ? a : b
    );
    if (best.avgLikes > 0) {
      results.push({
        type: "info",
        title: "ベスト投稿曜日",
        message: `${best.day}曜日の投稿が最も反応が良いです。重点投稿日にしましょう。`,
      });
    }
  }

  // 11. バズ記事の有無
  if (topArticles.length > 0) {
    const maxLikes = topArticles[0].like_count;
    if (maxLikes >= avgLikes * 5 && avgLikes > 0) {
      results.push({
        type: "success",
        title: "バズ記事あり",
        message:
          "バズ記事があります！このテーマを深掘りした続編がおすすめです。",
      });
    }
  }

  // 12. 有料記事の最高価格が10000円以上
  if (paidArticles.length > 0) {
    const maxPrice = Math.max(...paidArticles.map((a) => a.price));
    if (maxPrice >= 10000) {
      results.push({
        type: "success",
        title: "高単価記事の実績",
        message:
          "高単価記事の販売実績あり。ブランド力が高いです。",
      });
    }
  }

  // 13. 有料記事の平均価格が500円未満
  if (paidArticles.length > 0) {
    const avgPrice =
      paidArticles.reduce((sum, a) => sum + a.price, 0) / paidArticles.length;
    if (avgPrice < 500) {
      results.push({
        type: "info",
        title: "価格設定の見直し",
        message:
          "有料記事の価格が低め。1,000円以上でも売れるテーマを探しましょう。",
      });
    }
  }

  // 14. 数字入りタイトルの反応
  const withNumbers = articles.filter((a) => /\d/.test(a.title));
  if (withNumbers.length >= 3) {
    const numAvgLikes =
      withNumbers.reduce((sum, a) => sum + a.like_count, 0) /
      withNumbers.length;
    if (numAvgLikes > avgLikes) {
      results.push({
        type: "success",
        title: "数字入りタイトルが効果的",
        message:
          "数字入りタイトルの反応が良いです。積極的に使いましょう。",
      });
    }
  }

  // 15. 記事数が100以上
  if (totalArticles >= 100) {
    results.push({
      type: "success",
      title: "豊富な記事資産",
      message:
        "100記事以上の資産があります！過去記事のリライト＋有料化も検討を。",
    });
  }

  return results;
}
