"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { KeywordFrequency } from "@/types/analysis";

interface Props {
  keywords: KeywordFrequency[];
}

export function KeywordCloud({ keywords }: Props) {
  if (keywords.length === 0) {
    return <p className="text-sm text-slate-400">キーワードデータがありません</p>;
  }

  const maxCount = keywords[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* バッジクラウド */}
      <div className="flex flex-wrap gap-2">
        {keywords.map(({ word, count }) => {
          const ratio = count / maxCount;
          let sizeClass = "text-xs px-2 py-0.5";
          if (ratio > 0.7) sizeClass = "text-base px-3 py-1";
          else if (ratio > 0.4) sizeClass = "text-sm px-2.5 py-0.5";

          return (
            <Badge
              key={word}
              variant="outline"
              className={`border-emerald-700 text-emerald-300 ${sizeClass}`}
            >
              {word}
              <span className="ml-1 text-slate-500">{count}</span>
            </Badge>
          );
        })}
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800">
              <TableHead className="text-slate-400 w-10">#</TableHead>
              <TableHead className="text-slate-400">キーワード</TableHead>
              <TableHead className="text-slate-400 w-24 text-right">出現回数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map(({ word, count }, i) => (
              <TableRow key={word} className="border-slate-800">
                <TableCell className="text-slate-500">{i + 1}</TableCell>
                <TableCell className="text-slate-200">{word}</TableCell>
                <TableCell className="text-right text-emerald-400 font-bold">
                  {count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
