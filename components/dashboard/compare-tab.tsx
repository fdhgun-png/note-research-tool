"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompareLineChart } from "@/components/charts/compare-line-chart";
import type { UserAnalysisResult } from "@/types/analysis";

interface Props {
  results: UserAnalysisResult[];
}

export function CompareTab({ results }: Props) {
  if (results.length < 2) {
    return (
      <p className="text-sm text-slate-400">
        2アカウント以上入力すると比較できます
      </p>
    );
  }

  // 月間投稿数推移
  const postCountSeries = results.map((r) => ({
    name: r.profile.nickname,
    data: r.analysis.monthlyPostCount.map((m) => ({
      month: m.month,
      value: m.count,
    })),
  }));

  // 月間スキ数合計推移
  const likesSeries = results.map((r) => {
    const monthlyLikes: Record<string, number> = {};
    for (const article of r.articles) {
      const month = article.publish_at.slice(0, 7);
      monthlyLikes[month] = (monthlyLikes[month] || 0) + article.like_count;
    }
    return {
      name: r.profile.nickname,
      data: Object.entries(monthlyLikes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, value]) => ({ month, value })),
    };
  });

  return (
    <div className="space-y-6">
      {/* プロフィールカード横並び */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <Card key={r.profile.urlname} className="border-slate-800 bg-slate-900 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              {r.profile.user_profile_image_path && (
                <img
                  src={r.profile.user_profile_image_path}
                  alt={r.profile.nickname}
                  className="h-10 w-10 rounded-full object-cover shrink-0"
                />
              )}
              <div>
                <p className="font-bold text-slate-100">{r.profile.nickname}</p>
                <p className="text-xs text-slate-400">@{r.profile.urlname}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 月間投稿数推移 */}
      <Card className="border-slate-800 bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-200">月間投稿数推移</CardTitle>
        </CardHeader>
        <CardContent>
          <CompareLineChart seriesList={postCountSeries} yLabel="投稿数" />
        </CardContent>
      </Card>

      {/* 月間スキ数合計推移 */}
      <Card className="border-slate-800 bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-200">月間スキ数合計推移</CardTitle>
        </CardHeader>
        <CardContent>
          <CompareLineChart seriesList={likesSeries} yLabel="スキ数" />
        </CardContent>
      </Card>

      {/* 比較テーブル */}
      <Card className="border-slate-800 bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-200">アカウント比較</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">アカウント</TableHead>
                  <TableHead className="text-slate-400 text-right">総記事数</TableHead>
                  <TableHead className="text-slate-400 text-right">平均スキ数</TableHead>
                  <TableHead className="text-slate-400 text-right">有料記事比率</TableHead>
                  <TableHead className="text-slate-400 text-right">有料記事平均価格</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => {
                  const totalArticles = r.articles.length;
                  const avgLikes =
                    totalArticles > 0
                      ? Math.round(
                          r.articles.reduce((s, a) => s + a.like_count, 0) /
                            totalArticles
                        )
                      : 0;
                  const paidArticles = r.articles.filter((a) => a.price > 0);
                  const paidRatio =
                    totalArticles > 0
                      ? ((paidArticles.length / totalArticles) * 100).toFixed(1)
                      : "0";
                  const avgPaidPrice =
                    paidArticles.length > 0
                      ? Math.round(
                          paidArticles.reduce((s, a) => s + a.price, 0) /
                            paidArticles.length
                        )
                      : 0;

                  return (
                    <TableRow key={r.profile.urlname} className="border-slate-800">
                      <TableCell className="text-slate-200 font-medium">
                        {r.profile.nickname}
                      </TableCell>
                      <TableCell className="text-right text-emerald-400">
                        {totalArticles}
                      </TableCell>
                      <TableCell className="text-right text-emerald-400">
                        {avgLikes}
                      </TableCell>
                      <TableCell className="text-right text-emerald-400">
                        {paidRatio}%
                      </TableCell>
                      <TableCell className="text-right text-emerald-400">
                        {avgPaidPrice > 0 ? `¥${avgPaidPrice.toLocaleString()}` : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
