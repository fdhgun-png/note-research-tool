/** note API ベースURL */
export const BASE_URL = "https://note.com/api";

/** 最後のリクエスト時刻 */
let lastRequestTime = 0;

/** レートリミット付きfetch（最低1秒間隔） */
export async function rateLimitedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastRequestTime = Date.now();

  return fetchWithRetry(url, options);
}

/** 指数バックオフ付きリトライfetch（最大3回） */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
          ...options?.headers,
        },
      });

      if (response.ok) {
        return response;
      }

      // 429 Too Many Requests や 5xx はリトライ
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      throw new Error(
        `note API error: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      if (attempt < retries - 1 && error instanceof TypeError) {
        // ネットワークエラーの場合リトライ
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw new Error("リトライ回数の上限に達しました");
}
