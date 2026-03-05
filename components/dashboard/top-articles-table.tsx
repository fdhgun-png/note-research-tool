"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { NoteArticle } from "@/types/note";

interface Props {
  articles: NoteArticle[];
}

export function TopArticlesTable({ articles }: Props) {
  if (articles.length === 0) {
    return <p className="text-sm text-slate-400">記事データがありません</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800">
            <TableHead className="text-slate-400">タイトル</TableHead>
            <TableHead className="text-slate-400 w-28">公開日</TableHead>
            <TableHead className="text-slate-400 w-20 text-right">スキ数</TableHead>
            <TableHead className="text-slate-400 w-20">種別</TableHead>
            <TableHead className="text-slate-400 w-20 text-right">価格</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id} className="border-slate-800">
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
  );
}
