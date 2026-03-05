import re
import time
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}


def fetch_paid_articles_api(keyword: str, max_count: int = 50, progress_callback=None):
    """
    note非公式APIで有料記事一覧を取得する。

    Args:
        keyword: 検索キーワード
        max_count: 最大取得件数
        progress_callback: 進捗コールバック (current, total)

    Returns:
        記事リスト or None（API失敗時）
    """
    articles = []
    size = 10
    offset = 0

    while len(articles) < max_count:
        url = (
            f"https://note.com/api/v3/searches"
            f"?context=note_for_sale&q={keyword}&size={size}&start={offset}"
        )
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                return None

            data = resp.json()
            notes = data.get("data", {}).get("notes", {}).get("items", [])
            if not notes:
                break

            for note in notes:
                if len(articles) >= max_count:
                    break
                user = note.get("user", {})
                urlname = user.get("urlname", "")
                key = note.get("key", "")
                article = {
                    "title": note.get("name", ""),
                    "url": f"https://note.com/{urlname}/n/{key}" if urlname and key else "",
                    "price": note.get("price", 0),
                    "like_count": note.get("likeCount", 0),
                    "author": user.get("nickname", ""),
                    "key": key,
                }
                articles.append(article)

            if progress_callback:
                progress_callback(len(articles), max_count)

            offset += size
            time.sleep(1)

        except requests.RequestException:
            return None

    return articles


def _find_rating_in_json(data, depth=0):
    """
    JSONレスポンス内を再帰探索し、高評価数に相当するフィールドを探す。
    "recommend", "rating", "evaluation" などのキーを持つ数値フィールドを返す。
    """
    if depth > 10:
        return None

    rating_keywords = ["recommend", "rating", "evaluation", "highrating", "high_rating"]

    if isinstance(data, dict):
        for key, value in data.items():
            key_lower = key.lower()
            # キー名に高評価関連の文字列が含まれ、値が数値の場合
            if any(kw in key_lower for kw in rating_keywords) and isinstance(value, (int, float)):
                return int(value)
            # 再帰探索
            result = _find_rating_in_json(value, depth + 1)
            if result is not None:
                return result
    elif isinstance(data, list):
        for item in data:
            result = _find_rating_in_json(item, depth + 1)
            if result is not None:
                return result

    return None


def _fetch_high_rating_from_html(article_url: str) -> int | None:
    """
    記事ページのHTMLから「◯人が高評価」テキストを探す。
    """
    try:
        resp = requests.get(article_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text()
        match = re.search(r"(\d+)人が高評価", text)
        if match:
            return int(match.group(1))

        # HTML属性やscriptタグ内も検索
        match = re.search(r"(\d+)人が高評価", resp.text)
        if match:
            return int(match.group(1))

    except requests.RequestException:
        return None

    return None


def _fetch_high_rating_from_api(article_key: str) -> int | None:
    """
    記事個別の非公式APIから高評価数に相当するフィールドを探す。
    """
    if not article_key:
        return None

    api_url = f"https://note.com/api/v3/notes/{article_key}"
    try:
        resp = requests.get(api_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None

        data = resp.json()
        return _find_rating_in_json(data)

    except (requests.RequestException, ValueError):
        return None


def fetch_high_ratings(articles: list, progress_callback=None):
    """
    各記事の高評価数を取得する。
    1. まずHTMLページから「◯人が高評価」を探す
    2. 取得できなければ記事個別APIから高評価関連フィールドを探す

    Args:
        articles: 記事リスト
        progress_callback: 進捗コールバック (current, total, skipped)

    Returns:
        (更新された記事リスト, スキップ数)
    """
    skipped = 0
    total = len(articles)

    for i, article in enumerate(articles):
        try:
            # 方法1: HTMLから取得
            rating = _fetch_high_rating_from_html(article["url"])

            # 方法2: 個別APIから取得
            if rating is None:
                rating = _fetch_high_rating_from_api(article.get("key", ""))

            article["high_rating"] = rating if rating is not None else 0

        except Exception:
            article["high_rating"] = 0
            skipped += 1

        if progress_callback:
            progress_callback(i + 1, total, skipped)

        time.sleep(1)

    return articles, skipped


def search_notes(keyword: str, max_count: int = 50, min_high_rating: int = 5,
                 step1_progress=None, step2_progress=None):
    """
    メイン検索関数: 有料記事を検索し、高評価数でフィルタリングする。

    Args:
        keyword: 検索キーワード
        max_count: 最大取得件数
        min_high_rating: 高評価の最低数
        step1_progress: Step1進捗コールバック
        step2_progress: Step2進捗コールバック

    Returns:
        (フィルタ済み記事リスト, スキップ数)
    """
    # Step 1: 有料記事一覧を取得
    articles = fetch_paid_articles_api(keyword, max_count, step1_progress)

    if articles is None:
        return [], 0

    if not articles:
        return [], 0

    # Step 2: 高評価数を取得
    articles, skipped = fetch_high_ratings(articles, step2_progress)

    # Step 3: フィルタリング
    filtered = [a for a in articles if a.get("high_rating", 0) >= min_high_rating]

    # 高評価数の降順でソート
    filtered.sort(key=lambda x: x.get("high_rating", 0), reverse=True)

    return filtered, skipped
