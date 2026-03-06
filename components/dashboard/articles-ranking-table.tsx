"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NoteArticle } from "@/types/note";

interface Props {
  articles: NoteArticle[];
}

type SortKey = "like_count" | "publish_at" | "price" | "rater_count" | "revenue";

/** 記事の推定最低収益を算出 */
function calcRevenue(article: NoteArticle): number {
  if (article.price <= 0 || article.rater_count <= 0) return 0;
  return article.rater_count * 2 * article.price;
}

export function ArticlesRankingTable({ articles }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("like_count");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  if (articles.length === 0) {
    return <p className="text-sm text-slate-400">記事データがありません</p>;
  }

  const sorted = [...articles].sort((a, b) => {
    if (sortKey === "like_count") return b.like_count - a.like_count;
    if (sortKey === "publish_at")
      return new Date(b.publish_at).getTime() - new Date(a.publish_at).getTime();
    if (sortKey === "rater_count") return (b.rater_count || 0) - (a.rater_count || 0);
    if (sortKey === "revenue") return calcRevenue(b) - calcRevenue(a);
    return (b.price || 0) - (a.price || 0);
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: "like_count", label: "スキ数" },
    { key: "rater_count", label: "高評価" },
    { key: "revenue", label: "推定収益" },
    { key: "publish_at", label: "公開日" },
    { key: "price", label: "価格" },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {sortButtons.map(({ key, label }) => (
          <Button
            key={key}
            variant={sortKey === key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSortKey(key);
              setPage(0);
            }}
            className={
              sortKey === key
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
            }
          >
            {label}順
          </Button>
        ))}
        <span className="ml-auto text-sm text-slate-500 self-center">
          {sorted.length}件
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800">
              <TableHead className="text-slate-400 w-10">#</TableHead>
              <TableHead className="text-slate-400">タイトル</TableHead>
              <TableHead className="text-slate-400 w-28">公開日</TableHead>
              <TableHead className="text-slate-400 w-20 text-right">スキ数</TableHead>
              <TableHead className="text-slate-400 w-20 text-right">高評価</TableHead>
              <TableHead className="text-slate-400 w-24 text-right">推定収益</TableHead>
              <TableHead className="text-slate-400 w-20">種別</TableHead>
              <TableHead className="text-slate-400 w-20 text-right">価格</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((article, i) => (
              <TableRow key={article.id} className="border-slate-800">
                <TableCell className="text-slate-500 text-sm">
                  {page * pageSize + i + 1}
                </TableCell>
                <TableCell className="text-slate-200 max-w-xs">
                  <a
                    href={`https://note.com/${article.user?.urlname || ""}/n/${article.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors line-clamp-1"
                  >
                    {article.title}
                  </a>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  {article.publish_at.slice(0, 10)}
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-400">
                  {article.like_count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-amber-400">
                  {article.price > 0
                    ? article.rater_count > 0
                      ? article.rater_count.toLocaleString()
                      : "0"
                    : "-"}
                </TableCell>
                <TableCell className="text-right text-orange-400 font-medium">
                  {calcRevenue(article) > 0
                    ? `¥${calcRevenue(article).toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell>
                  {article.price > 0 ? (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-400 text-xs">
                      有料
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                      無料
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right text-slate-300">
                  {article.price > 0 ? `¥${article.price.toLocaleString()}` : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="border-slate-700 text-slate-300"
          >
            前へ
          </Button>
          <span className="text-sm text-slate-400">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="border-slate-700 text-slate-300"
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
