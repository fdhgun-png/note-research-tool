"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DiagnosisResult } from "@/types/analysis";

interface Props {
  results: DiagnosisResult[];
}

const TYPE_STYLES = {
  success: "border-emerald-700 bg-emerald-950/50",
  warning: "border-yellow-700 bg-yellow-950/50",
  info: "border-blue-700 bg-blue-950/50",
};

const TYPE_ICONS = {
  success: "✓",
  warning: "!",
  info: "i",
};

const ICON_STYLES = {
  success: "bg-emerald-600 text-emerald-100",
  warning: "bg-yellow-600 text-yellow-100",
  info: "bg-blue-600 text-blue-100",
};

export function DiagnosisCards({ results }: Props) {
  if (results.length === 0) {
    return <p className="text-sm text-slate-400">診断結果がありません</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {results.map((result, i) => (
        <Card
          key={i}
          className={`border ${TYPE_STYLES[result.type]} shadow-sm`}
        >
          <CardContent className="flex items-start gap-3 p-3">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ICON_STYLES[result.type]}`}
            >
              {TYPE_ICONS[result.type]}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                {result.title}
              </h4>
              <p className="text-sm text-slate-300 mt-0.5">{result.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
