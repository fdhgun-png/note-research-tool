"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { NoteArticle } from "@/types/note";

interface Props {
  articles: NoteArticle[];
}

export function TopRatedTable({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        高評価データのある有料記事がありません
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800">
            <TableHead className="text-slate-400">タイトル</TableHead>
            <TableHead className="text-slate-400 w-20 text-right">高評価</TableHead>
            <TableHead className="text-slate-400 w-20 text-right">スキ数</TableHead>
            <TableHead className="text-slate-400 w-20 text-right">価格</TableHead>
            <TableHead className="text-slate-400 w-24 text-right">推定収益</TableHead>
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
              <TableCell className="text-right font-bold text-amber-400">
                {article.rater_count.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-emerald-400">
                {article.like_count.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-slate-300">
                ¥{article.price.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-bold text-orange-400">
                ¥{(article.rater_count * 2 * article.price).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
