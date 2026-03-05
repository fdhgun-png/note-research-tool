import re
import time
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}


def debug_api_response(keyword="副業"):
    """APIのレスポンス構造を確認するための関数"""
    url = f"https://note.com/api/v3/searches?context=note_for_sale&q={keyword}&size=3&start=0"
    try:
        res = requests.get(url, headers=HEADERS, timeout=15)
        return {
            "status_code": res.status_code,
            "json": res.json() if res.status_code == 200 else None,
        }
    except Exception as e:
        return {
            "status_code": None,
            "json": None,
            "error": str(e),
        }


def debug_article_api_response(article_key):
    """記事個別APIのレスポンス構造を確認するための関数"""
    if not article_key:
        return {"status_code": None, "json": None, "error": "article_key is empty"}
    url = f"https://note.com/api/v3/notes/{article_key}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=15)
        return {
            "status_code": res.status_code,
            "json": res.json() if res.status_code == 200 else None,
        }
    except Exception as e:
        return {"status_code": None, "json": None, "error": str(e)}


def _find_article_list(data, depth=0):
    """
    レスポンスJSONを再帰的に探索し、記事一覧（リスト）を見つける。
    各要素が辞書で "name" と "key" キーを持つリストを記事一覧とみなす。
    """
    if depth > 5:
        return None

    if isinstance(data, list) and len(data) > 0:
        # リストの最初の要素が辞書で name と key を持つか確認
        first = data[0]
        if isinstance(first, dict) and "name" in first and "key" in first:
            return data
    elif isinstance(data, dict):
        for key, value in data.items():
            result = _find_article_list(value, depth + 1)
            if result is not None:
                return result

    return None


def _extract_article(note):
    """記事データの辞書から必要な情報を抽出する。キー名の違いを吸収する。"""
    user = note.get("user", {})
    if not isinstance(user, dict):
        user = {}
    urlname = user.get("urlname", "")
    key = note.get("key", "")

    # タイトル
    title = note.get("name", "") or note.get("title", "") or ""

    # 価格
    price = note.get("price", 0)
    if not isinstance(price, (int, float)):
        price = 0

    # スキ数 (like_count or likeCount)
    like_count = note.get("like_count", None)
    if like_count is None:
        like_count = note.get("likeCount", 0)
    if not isinstance(like_count, (int, float)):
        like_count = 0

    # 著者名
    author = user.get("nickname", "") or user.get("name", "") or ""

    # URL組み立て
    url = ""
    if urlname and key:
        url = f"https://note.com/{urlname}/n/{key}"
    elif note.get("note_url"):
        url = note.get("note_url")

    return {
        "title": title,
        "url": url,
        "price": int(price),
        "like_count": int(like_count),
        "author": author,
        "key": key,
    }


def fetch_paid_articles_api(keyword, max_count=50, progress_callback=None):
    """
    note非公式APIで有料記事一覧を取得する。

    Returns:
        dict with keys: articles, api_status, first_response
        or None on failure
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

            # 記事リストを再帰探索で見つける
            notes = _find_article_list(data)
            if not notes:
                break

            for note in notes:
                if len(articles) >= max_count:
                    break
                article = _extract_article(note)
                if article["title"] or article["key"]:
                    articles.append(article)

            if progress_callback:
                progress_callback(len(articles), max_count)

            # 取得件数が size 未満なら最終ページ
            if len(notes) < size:
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


def _fetch_high_rating_from_html(article_url):
    """記事ページのHTMLから「◯人が高評価」テキストを探す。"""
    try:
        resp = requests.get(article_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None

        match = re.search(r"(\d+)人が高評価", resp.text)
        if match:
            return int(match.group(1))
    except requests.RequestException:
        return None
    return None


def _fetch_high_rating_from_api(article_key):
    """記事個別の非公式APIから高評価数（rater_count等）を取得する。"""
    if not article_key:
        return None

    api_url = f"https://note.com/api/v3/notes/{article_key}"
    try:
        resp = requests.get(api_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None

        data = resp.json()
        note_data = data.get("data", {})
        if not isinstance(note_data, dict):
            return None

        # rater_count が高評価数に対応
        rater_count = note_data.get("rater_count")
        if rater_count is not None and isinstance(rater_count, (int, float)):
            return int(rater_count)

        # フォールバック: 高評価関連キーワードを持つフィールドを探索
        rating_keywords = ["recommend", "rating", "evaluation", "highrating", "high_rating"]
        for k, v in note_data.items():
            k_lower = k.lower()
            if any(kw in k_lower for kw in rating_keywords) and isinstance(v, (int, float)):
                return int(v)

    except (requests.RequestException, ValueError):
        return None
    return None


def fetch_high_ratings(articles, progress_callback=None):
    """
    各記事の高評価数を取得する。

    Returns:
        (articles, skipped, debug_ratings, first_article_api_response)
    """
    skipped = 0
    total = len(articles)
    debug_ratings = []
    first_article_api_resp = None

    for i, article in enumerate(articles):
        rating = None
        method = ""
        try:
            # 方法1: 個別APIから取得
            rating = _fetch_high_rating_from_api(article.get("key", ""))
            if rating is not None:
                method = "API(rater_count)"

            # 最初の1件のAPIレスポンスをデバッグ用に保存
            if i == 0 and article.get("key"):
                first_article_api_resp = debug_article_api_response(article["key"])

            # 方法2: HTMLから取得
            if rating is None:
                rating = _fetch_high_rating_from_html(article["url"])
                if rating is not None:
                    method = "HTML"

            if rating is not None:
                article["high_rating"] = rating
            else:
                article["high_rating"] = None
                method = "取得不可"

        except Exception:
            article["high_rating"] = None
            method = "エラー"
            skipped += 1

        debug_ratings.append({
            "title": article.get("title", "")[:30],
            "high_rating": article.get("high_rating"),
            "method": method,
        })

        if progress_callback:
            progress_callback(i + 1, total, skipped)

        time.sleep(1)

    return articles, skipped, debug_ratings, first_article_api_resp


def search_notes(keyword, max_count=50, min_high_rating=5,
                 step1_progress=None, step2_progress=None):
    """
    メイン検索関数: 有料記事を検索し、高評価数でフィルタリングする。
    必ず dict を返す。
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
        "first_article_api": None,
    }

    try:
        # Step 1: 有料記事一覧を取得
        api_result = fetch_paid_articles_api(keyword, max_count, step1_progress)

        if api_result is None:
            return result

        articles = api_result.get("articles", [])
        result["api_status"] = api_result.get("api_status")
        result["first_response"] = api_result.get("first_response")
        result["step1_count"] = len(articles)

        if not articles:
            return result

        # Step 2: 高評価数を取得
        articles, skipped, debug_ratings, first_art_api = fetch_high_ratings(
            articles, step2_progress
        )
        result["skipped"] = skipped
        result["step2_debug"] = debug_ratings
        result["first_article_api"] = first_art_api

        # Step 3: フィルタリング
        result["pre_filter_count"] = len(articles)

        filtered = []
        for a in articles:
            hr = a.get("high_rating")
            if hr is None:
                filtered.append(a)
            elif hr >= min_high_rating:
                filtered.append(a)

        filtered.sort(
            key=lambda x: x.get("high_rating") if x.get("high_rating") is not None else -1,
            reverse=True,
        )

        result["articles"] = filtered
        result["post_filter_count"] = len(filtered)

    except Exception as e:
        result["error"] = str(e)

    return result
