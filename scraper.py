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
        dict: {
            "articles": list,       # 記事リスト
            "api_status": int,      # 最後のAPIステータスコード
            "first_response": dict, # 最初のレスポンスJSON（デバッグ用）
        }
        or None（API失敗時）
    """
    articles = []
    size = 10
    offset = 0
    api_status = None
    first_response = None

    while len(articles) < max_count:
        url = (
            f"https://note.com/api/v3/searches"
            f"?context=note_for_sale&q={keyword}&size={size}&start={offset}"
        )
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            api_status = resp.status_code
            if resp.status_code != 200:
                return None

            data = resp.json()

            # デバッグ用: 最初のレスポンスを保存
            if first_response is None:
                first_response = data

            # 正しいパス: data.notes_for_sale.contents
            notes_for_sale = data.get("data", {}).get("notes_for_sale", {})
            notes = notes_for_sale.get("contents", [])
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
                    "like_count": note.get("like_count", 0),
                    "author": user.get("nickname", ""),
                    "key": key,
                }
                articles.append(article)

            if progress_callback:
                progress_callback(len(articles), max_count)

            # 最終ページチェック
            is_last = notes_for_sale.get("is_last_page")
            if is_last:
                break

            offset += size
            time.sleep(1)

        except requests.RequestException:
            return None

    return {
        "articles": articles,
        "api_status": api_status,
        "first_response": first_response,
    }


def _fetch_high_rating_from_html(article_url: str) -> int | None:
    """
    記事ページのHTMLから「◯人が高評価」テキストを探す。
    """
    try:
        resp = requests.get(article_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None

        # HTML全体から正規表現で検索（SSRされたテキスト・scriptタグ内を含む）
        match = re.search(r"(\d+)人が高評価", resp.text)
        if match:
            return int(match.group(1))

    except requests.RequestException:
        return None

    return None


def _fetch_high_rating_from_api(article_key: str) -> int | None:
    """
    記事個別の非公式APIから高評価数（rater_count）を取得する。
    """
    if not article_key:
        return None

    api_url = f"https://note.com/api/v3/notes/{article_key}"
    try:
        resp = requests.get(api_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None

        data = resp.json()
        note_data = data.get("data", {})

        # rater_count が高評価数に対応する
        rater_count = note_data.get("rater_count")
        if rater_count is not None and isinstance(rater_count, (int, float)):
            return int(rater_count)

        # フォールバック: 高評価関連キーワードを持つフィールドを探索
        rating_keywords = ["recommend", "rating", "evaluation", "highrating", "high_rating"]
        for key, value in note_data.items():
            key_lower = key.lower()
            if any(kw in key_lower for kw in rating_keywords) and isinstance(value, (int, float)):
                return int(value)

    except (requests.RequestException, ValueError):
        return None

    return None


def fetch_high_ratings(articles: list, progress_callback=None):
    """
    各記事の高評価数を取得する。
    1. まず記事個別APIからrater_countを取得（高速・確実）
    2. 取得できなければHTMLページから「◯人が高評価」を探す

    Args:
        articles: 記事リスト
        progress_callback: 進捗コールバック (current, total, skipped)

    Returns:
        (更新された記事リスト, スキップ数, デバッグ情報リスト)
    """
    skipped = 0
    total = len(articles)
    debug_ratings = []

    for i, article in enumerate(articles):
        rating = None
        method = ""
        try:
            # 方法1: 個別APIから取得（rater_count）
            rating = _fetch_high_rating_from_api(article.get("key", ""))
            if rating is not None:
                method = "API(rater_count)"

            # 方法2: HTMLから取得
            if rating is None:
                rating = _fetch_high_rating_from_html(article["url"])
                if rating is not None:
                    method = "HTML"

            if rating is not None:
                article["high_rating"] = rating
            else:
                article["high_rating"] = None  # 取得不可
                method = "取得不可"

        except Exception:
            article["high_rating"] = None
            method = "エラー"
            skipped += 1

        debug_ratings.append({
            "title": article["title"][:30],
            "high_rating": article["high_rating"],
            "method": method,
        })

        if progress_callback:
            progress_callback(i + 1, total, skipped)

        time.sleep(1)

    return articles, skipped, debug_ratings


def search_notes(keyword: str, max_count: int = 50, min_high_rating: int = 5,
                 step1_progress=None, step2_progress=None):
    """
    メイン検索関数: 有料記事を検索し、高評価数でフィルタリングする。

    Returns:
        dict: {
            "articles": list,          # フィルタ済み記事リスト
            "skipped": int,            # スキップ数
            "api_status": int,         # APIステータスコード
            "first_response": dict,    # 最初のAPIレスポンス（デバッグ用）
            "step1_count": int,        # Step1取得件数
            "step2_debug": list,       # Step2デバッグ情報
            "pre_filter_count": int,   # フィルタ前件数
            "post_filter_count": int,  # フィルタ後件数
        }
    """
    result = {
        "articles": [],
        "skipped": 0,
        "api_status": None,
        "first_response": None,
        "step1_count": 0,
        "step2_debug": [],
        "pre_filter_count": 0,
        "post_filter_count": 0,
    }

    # Step 1: 有料記事一覧を取得
    api_result = fetch_paid_articles_api(keyword, max_count, step1_progress)

    if api_result is None:
        return result

    articles = api_result["articles"]
    result["api_status"] = api_result["api_status"]
    result["first_response"] = api_result["first_response"]
    result["step1_count"] = len(articles)

    if not articles:
        return result

    # Step 2: 高評価数を取得
    articles, skipped, debug_ratings = fetch_high_ratings(articles, step2_progress)
    result["skipped"] = skipped
    result["step2_debug"] = debug_ratings

    # Step 3: フィルタリング
    result["pre_filter_count"] = len(articles)

    # 高評価数が取得できた記事のみフィルタリング
    # 取得不可(None)の記事はフィルタリングせず残す（高評価数=「取得不可」として表示）
    filtered = []
    for a in articles:
        hr = a.get("high_rating")
        if hr is None:
            # 高評価数取得不可 → そのまま残す
            filtered.append(a)
        elif hr >= min_high_rating:
            filtered.append(a)

    # 高評価数の降順でソート（Noneは末尾に）
    filtered.sort(key=lambda x: x.get("high_rating") if x.get("high_rating") is not None else -1, reverse=True)

    result["articles"] = filtered
    result["post_filter_count"] = len(filtered)

    return result
