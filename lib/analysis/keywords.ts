import type { NoteArticle } from "@/types/note";
import type { KeywordFrequency } from "@/types/analysis";

// TinySegmenterはCommonJSモジュールのためdynamic importで対応
let segmenterInstance: { segment: (text: string) => string[] } | null = null;

async function getSegmenter(): Promise<{ segment: (text: string) => string[] }> {
  if (!segmenterInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TinySegmenter = require("tiny-segmenter");
    segmenterInstance = new TinySegmenter();
  }
  return segmenterInstance!;
}

/** ストップワード（除外する一般的な語） */
const STOP_WORDS = new Set([
  "の", "に", "は", "を", "た", "が", "で", "て", "と", "し", "れ", "さ",
  "ある", "いる", "する", "なる", "こと", "もの", "これ", "それ", "あれ",
  "この", "その", "あの", "ため", "など", "から", "まで", "より", "ない",
  "よう", "よる", "また", "もう", "いう", "ここ", "そこ", "あそこ",
  "です", "ます", "だっ", "でし", "まし", "について", "における",
  "という", "として", "ました", "ません", "ところ", "だけ", "でも",
  "けど", "だが", "しか", "って", "ので", "のに", "ながら", "ところが",
]);

/** 除外すべき語かどうか判定 */
function shouldExclude(word: string): boolean {
  // 1文字は除外
  if (word.length <= 1) return true;
  // ひらがなのみの2文字以下は除外（助詞・助動詞）
  if (word.length <= 2 && /^[\u3040-\u309f]+$/.test(word)) return true;
  // ストップワード
  if (STOP_WORDS.has(word)) return true;
  // 数字のみ
  if (/^\d+$/.test(word)) return true;
  // 記号のみ
  if (/^[!-/:-@[-`{-~\u3000-\u303f\uff01-\uff0f\uff1a-\uff20]+$/.test(word))
    return true;
  return false;
}

/** 全記事タイトルから頻出キーワードTOP30を返す */
export async function extractTitleKeywords(
  articles: NoteArticle[]
): Promise<KeywordFrequency[]> {
  const segmenter = await getSegmenter();
  const wordCount: Record<string, number> = {};

  for (const article of articles) {
    const words = segmenter.segment(article.title);
    for (const word of words) {
      const trimmed = word.trim();
      if (shouldExclude(trimmed)) continue;
      wordCount[trimmed] = (wordCount[trimmed] || 0) + 1;
    }
  }

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }));
}
