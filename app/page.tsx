"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { ProfileCard } from "@/components/dashboard/profile-card";
import { TopArticlesTable } from "@/components/dashboard/top-articles-table";
import { DiagnosisCards } from "@/components/dashboard/diagnosis-cards";
import { ArticlesRankingTable } from "@/components/dashboard/articles-ranking-table";
import { KeywordCloud } from "@/components/dashboard/keyword-cloud";
import { CompareTab } from "@/components/dashboard/compare-tab";
import { TopRatedTable } from "@/components/dashboard/top-rated-table";

import { PriceBarChart } from "@/components/charts/price-bar-chart";
import { PaidFreePieChart } from "@/components/charts/paid-free-pie-chart";
import { MonthlyLineChart } from "@/components/charts/monthly-line-chart";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { TimeHeatmap } from "@/components/charts/time-heatmap";

import type { UserAnalysisResult } from "@/types/analysis";

/** URLからusernameを抽出 */
function extractUsername(input: string): string {
  const trimmed = input.trim();
  // https://note.com/username 形式
  const match = trimmed.match(/note\.com\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // usernameのみ
  return trimmed;
}

export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [usernames, setUsernames] = useState<string[]>([]);
  const [showExtraInput, setShowExtraInput] = useState(false);
  const [extraInput, setExtraInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UserAnalysisResult[] | null>(null);
  const [selectedUser, setSelectedUser] = useState(0);

  const addUsername = (input: string) => {
    const username = extractUsername(input);
    if (!username) return;
    if (usernames.includes(username)) return;
    if (usernames.length >= 5) return;
    setUsernames((prev) => [...prev, username]);
  };

  const removeUsername = (username: string) => {
    setUsernames((prev) => prev.filter((u) => u !== username));
  };

  const handleAnalyze = async () => {
    // メイン入力のusernameも追加
    const mainUsername = extractUsername(urlInput);
    const allUsernames = mainUsername
      ? [...new Set([mainUsername, ...usernames])]
      : [...usernames];

    if (allUsernames.length === 0) {
      setError("noteのURLまたはユーザー名を入力してください");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: allUsernames }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析に失敗しました");
      }

      const data = await res.json();
      setResults(data.results);
      setSelectedUser(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const currentResult = results?.[selectedUser];
  const hasMultipleUsers = results && results.length >= 2;

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-500 tracking-tight">
            note透視くん
          </h1>
          <p className="mt-2 text-slate-400 text-sm md:text-base">
            noteクリエイターの戦略をデータで丸見えに
          </p>
        </div>

        {/* 入力セクション */}
        <Card className="border-slate-800 bg-slate-900 shadow-sm mb-8">
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="https://note.com/username を入力"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 flex-1"
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    分析中...
                  </span>
                ) : (
                  "分析する"
                )}
              </Button>
            </div>

            {/* 比較追加 */}
            {!showExtraInput ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExtraInput(true)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                + 比較に追加
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="比較するアカウントのURLを入力"
                  value={extraInput}
                  onChange={(e) => setExtraInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addUsername(extraInput);
                      setExtraInput("");
                    }
                  }}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    addUsername(extraInput);
                    setExtraInput("");
                  }}
                  disabled={usernames.length >= 5}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  追加
                </Button>
              </div>
            )}

            {/* 追加済みアカウント */}
            {usernames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {usernames.map((u) => (
                  <Badge
                    key={u}
                    variant="outline"
                    className="border-emerald-700 text-emerald-300 px-2 py-1"
                  >
                    @{u}
                    <button
                      onClick={() => removeUsername(u)}
                      className="ml-1.5 text-slate-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <span className="text-xs text-slate-500 self-center">
                  ({usernames.length}/5)
                </span>
              </div>
            )}

            {loading && (
              <p className="text-sm text-slate-400">
                記事を取得しています...（記事数によって数十秒〜数分かかります）
              </p>
            )}
          </CardContent>
        </Card>

        {/* エラー表示 */}
        {error && (
          <Alert className="border-red-800 bg-red-950/50 mb-6">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* ローディング */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 bg-slate-800 rounded-lg" />
            <Skeleton className="h-64 bg-slate-800 rounded-lg" />
            <Skeleton className="h-48 bg-slate-800 rounded-lg" />
          </div>
        )}

        {/* 結果表示 */}
        {results && !loading && (
          <div>
            {/* ユーザー切り替え（複数ある場合） */}
            {results.length > 1 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {results.map((r, i) => (
                  <Button
                    key={r.profile.urlname}
                    variant={selectedUser === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedUser(i)}
                    className={
                      selectedUser === i
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-slate-700 text-slate-300 hover:bg-slate-800"
                    }
                  >
                    @{r.profile.urlname}
                  </Button>
                ))}
              </div>
            )}

            {/* エラー表示（個別ユーザー） */}
            {currentResult?.error && (
              <Alert className="border-yellow-800 bg-yellow-950/50 mb-4">
                <AlertDescription className="text-yellow-300">
                  {currentResult.error}
                </AlertDescription>
              </Alert>
            )}

            {currentResult && !currentResult.error && (
              <Tabs defaultValue="overview">
                <TabsList className="bg-slate-900 border border-slate-800 mb-4 flex-wrap h-auto">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                  >
                    概要
                  </TabsTrigger>
                  <TabsTrigger
                    value="articles"
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                  >
                    記事分析
                  </TabsTrigger>
                  <TabsTrigger
                    value="patterns"
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                  >
                    投稿パターン
                  </TabsTrigger>
                  <TabsTrigger
                    value="keywords"
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                  >
                    キーワード
                  </TabsTrigger>
                  {hasMultipleUsers && (
                    <TabsTrigger
                      value="compare"
                      className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                    >
                      競合比較
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* タブ1: 概要 */}
                <TabsContent value="overview" className="space-y-6">
                  <ProfileCard
                    profile={currentResult.profile}
                    articleCount={currentResult.articles.length}
                  />

                  {currentResult.analysis.estimatedTotalRevenue > 0 && (
                    <Card className="border-slate-800 bg-slate-900 shadow-sm">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-slate-400">
                              推定最低総収益（有料記事）
                            </p>
                            <p className="text-3xl font-extrabold text-orange-400 mt-1">
                              ¥{currentResult.analysis.estimatedTotalRevenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              ※ 高評価数 × 2 × 価格で算出（高評価率50%仮定、手数料除く）
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-slate-800 bg-slate-900 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-200">
                        スキ数 TOP5 記事
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TopArticlesTable
                        articles={currentResult.analysis.topArticles}
                      />
                    </CardContent>
                  </Card>

                  {currentResult.analysis.topRatedArticles.length > 0 && (
                    <Card className="border-slate-800 bg-slate-900 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-200">
                          高評価 TOP5 有料記事
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TopRatedTable
                          articles={currentResult.analysis.topRatedArticles}
                        />
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-slate-800 bg-slate-900 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-200">
                        自動診断
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DiagnosisCards
                        results={currentResult.analysis.diagnosis}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* タブ2: 記事分析 */}
                <TabsContent value="articles" className="space-y-6">
                  <Card className="border-slate-800 bg-slate-900 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-200">
                        全記事ランキング
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ArticlesRankingTable
                        articles={currentResult.analysis.ranking}
                      />
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-slate-800 bg-slate-900 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-200">
                          価格帯分布
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PriceBarChart
                          data={currentResult.analysis.priceDistribution}
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-slate-800 bg-slate-900 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-200">
                          有料 / 無料 比率
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PaidFreePieChart
                          data={currentResult.analysis.paidFreeRatio}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* タブ3: 投稿パターン */}
                <TabsContent value="patterns" className="space-y-6">
                  <Card className="border-slate-800 bg-slate-900 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-200">
                        投稿頻度ヒートマップ（直近1年）
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ActivityHeatmap
                        postingFrequency={currentResult.analysis.postingFrequency}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-slate-800 bg-slate-900 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-200">
                        曜日×時間帯別 平均スキ数
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TimeHeatmap
                        data={currentResult.analysis.postingTimeHeatmap}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-slate-800 bg-slate-900 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-200">
                        月別投稿数推移
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MonthlyLineChart
                        data={currentResult.analysis.monthlyPostCount}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* タブ4: キーワード */}
                <TabsContent value="keywords" className="space-y-6">
                  <Card className="border-slate-800 bg-slate-900 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-200">
                        頻出キーワード（上位30語）
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <KeywordCloud
                        keywords={currentResult.analysis.titleKeywords}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* タブ5: 競合比較 */}
                {hasMultipleUsers && (
                  <TabsContent value="compare" className="space-y-6">
                    <CompareTab results={results} />
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>
        )}

        {/* フッター */}
        <Separator className="mt-12 mb-4 bg-slate-800" />
        <footer className="text-center text-xs text-slate-600 pb-4">
          note透視くん - noteクリエイターの競合分析ダッシュボード
        </footer>
      </div>
    </main>
  );
}
