import re
import time
import json
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
}

PAGE_SIZE = 20  # noteの検索ページは1ページ20件


def debug_search_page(keyword="副業"):
    """検索ページのHTMLを取得してデバッグ情報を返す"""
    url = f"https://note.com/search?q={keyword}&context=note_for_sale&sort=new&start=0"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        html = resp.text
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select("section.m-largeNoteWrapper")

        # __NUXT__データの有無
        has_nuxt = bool(re.search(r"window\.__NUXT__", html))

        return {
            "status_code": resp.status_code,
            "html_length": len(html),
            "html_preview": html[:2000],
            "has_nuxt_data": has_nuxt,
            "card_count": len(cards),
        }
    except Exception as e:
        return {
            "status_code": None,
            "html_length": 0,
            "html_preview": "",
            "has_nuxt_data": False,
            "card_count": 0,
            "error": str(e),
        }


def _parse_price(text):
    """価格テキスト（例: '¥50,000'）から数値を抽出する"""
    if not text:
        return 0
    cleaned = text.replace("¥", "").replace("￥", "").replace(",", "").strip()
    match = re.search(r"(\d+)", cleaned)
    if match:
        return int(match.group(1))
    return 0


def _parse_cards(soup):
    """BeautifulSoupのsoupオブジェクトから記事カードをパースする"""
    articles = []
    cards = soup.select("section.m-largeNoteWrapper")

    for card in cards:
        # リンクとキー
        link_el = card.select_one('a[href*="/n/"]')
        if not link_el:
            continue
        href = link_el.get("href", "")
        if not href:
            continue

        # URLとキーを組み立て
        article_url = f"https://note.com{href}" if href.startswith("/") else href
        key_match = re.search(r"/n/(n[a-zA-Z0-9]+)", href)
        key = key_match.group(1) if key_match else ""

        # タイトル
        title_el = card.select_one("h3.m-noteBodyTitle__title")
        title = title_el.get_text(strip=True) if title_el else ""

        # 著者名
        author_el = card.select_one("div.o-largeNoteSummary__userName")
        author = author_el.get_text(strip=True) if author_el else ""

        # 価格
        price = 0
        spans = card.find_all("span")
        for s in spans:
            span_text = s.get_text(strip=True)
            if "¥" in span_text or "￥" in span_text:
                price = _parse_price(span_text)
                break

        if title:
            articles.append({
                "title": title,
                "url": article_url,
                "price": price,
                "like_count": 0,
                "author": author,
                "key": key,
            })

    return articles


def fetch_paid_articles(keyword, max_count=50, progress_callback=None):
    """
    noteの検索ページHTMLをスクレイピングして有料記事一覧を取得する。

    Returns:
        dict: {
            "articles": list,
            "status_code": int,
            "html_preview": str,
            "card_count_total": int,
        }
    """
    articles = []
    offset = 0
    first_status = None
    first_html_preview = ""
    card_count_total = 0
    seen_urls = set()

    while len(articles) < max_count:
        url = (
            f"https://note.com/search?q={keyword}"
            f"&context=note_for_sale&sort=new&start={offset}"
        )
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)

            if first_status is None:
                first_status = resp.status_code
                first_html_preview = resp.text[:2000]

            if resp.status_code != 200:
                break

            soup = BeautifulSoup(resp.text, "html.parser")
            page_articles = _parse_cards(soup)
            card_count_total += len(page_articles)

            if not page_articles:
                break

            # 重複除去しながら追加
            new_count = 0
            for a in page_articles:
                if len(articles) >= max_count:
                    break
                if a["url"] not in seen_urls:
                    seen_urls.add(a["url"])
                    articles.append(a)
                    new_count += 1

            # 新規記事が0なら終了（同じページが返っている）
            if new_count == 0:
                break

            if progress_callback:
                progress_callback(len(articles), max_count)

            offset += PAGE_SIZE
            time.sleep(1)

        except requests.RequestException:
            break

    return {
        "articles": articles,
        "status_code": first_status,
        "html_preview": first_html_preview,
        "card_count_total": card_count_total,
    }


def _find_rating_in_json(data, depth=0):
    """JSONを再帰探索し、高評価数に関連するフィールドを探す"""
    if depth > 10:
        return None

    rating_keywords = [
        "recommend", "rating", "evaluation",
        "highrating", "high_rating", "good",
        "rater_count", "ratercount",
    ]

    if isinstance(data, dict):
        for key, value in data.items():
            key_lower = key.lower()
            if any(kw in key_lower for kw in rating_keywords):
                if isinstance(value, (int, float)) and value > 0:
                    return int(value)
            result = _find_rating_in_json(value, depth + 1)
            if result is not None:
                return result
    elif isinstance(data, list):
        for item in data:
            result = _find_rating_in_json(item, depth + 1)
            if result is not None:
                return result

    return None


def _extract_json_from_scripts(soup):
    """HTMLの<script>タグからJSONデータを抽出する"""
    json_data_list = []

    # __NEXT_DATA__
    next_data = soup.find("script", id="__NEXT_DATA__")
    if next_data and next_data.string:
        try:
            json_data_list.append(json.loads(next_data.string))
        except (json.JSONDecodeError, ValueError):
            pass

    # type="application/json" のscriptタグ
    for script in soup.find_all("script", type="application/json"):
        if script.string:
            try:
                json_data_list.append(json.loads(script.string))
            except (json.JSONDecodeError, ValueError):
                pass

    # type="application/ld+json"
    for script in soup.find_all("script", type="application/ld+json"):
        if script.string:
            try:
                json_data_list.append(json.loads(script.string))
            except (json.JSONDecodeError, ValueError):
                pass

    return json_data_list


def fetch_high_rating(article_url, article_key=""):
    """
    記事ページから高評価数を取得する。

    Returns:
        dict: {
            "rating": int or None,
            "method": str,
            "status_code": int,
            "found_json": bool,
            "found_text": bool,
        }
    """
    debug = {
        "rating": None,
        "method": "取得不可",
        "status_code": None,
        "found_json": False,
        "found_text": False,
    }

    try:
        resp = requests.get(article_url, headers=HEADERS, timeout=15)
        debug["status_code"] = resp.status_code

        if resp.status_code != 200:
            return debug

        html = resp.text
        soup = BeautifulSoup(html, "html.parser")

        # 方法1: <script>タグ内のJSONから探す
        json_data_list = _extract_json_from_scripts(soup)
        if json_data_list:
            debug["found_json"] = True
            for jd in json_data_list:
                rating = _find_rating_in_json(jd)
                if rating is not None:
                    debug["rating"] = rating
                    debug["method"] = "JSON"
                    return debug

        # 方法2: HTMLテキストから正規表現で探す
        match = re.search(r"(\d+)人が高評価", html)
        if match:
            debug["found_text"] = True
            debug["rating"] = int(match.group(1))
            debug["method"] = "HTML(テキスト)"
            return debug

        # 方法3: BeautifulSoupのテキストから探す
        full_text = soup.get_text()
        match2 = re.search(r"(\d+)人が高評価", full_text)
        if match2:
            debug["found_text"] = True
            debug["rating"] = int(match2.group(1))
            debug["method"] = "HTML(BS4テキスト)"
            return debug

    except requests.RequestException:
        debug["method"] = "エラー"

    return debug


def fetch_high_ratings(articles, progress_callback=None):
    """
    各記事の高評価数を一括取得する。

    Returns:
        (articles, skipped, debug_list, first_article_debug)
    """
    skipped = 0
    total = len(articles)
    debug_list = []
    first_article_debug = None

    for i, article in enumerate(articles):
        result = fetch_high_rating(article["url"], article.get("key", ""))

        if i == 0:
            first_article_debug = result

        article["high_rating"] = result["rating"]

        if result["method"] == "エラー":
            skipped += 1

        debug_list.append({
            "title": article.get("title", "")[:30],
            "high_rating": result["rating"],
            "method": result["method"],
        })

        if progress_callback:
            progress_callback(i + 1, total, skipped)

        time.sleep(2)

    return articles, skipped, debug_list, first_article_debug


def search_notes(keyword, max_count=50, min_high_rating=5,
                 step1_progress=None, step2_progress=None):
    """
    メイン検索関数。必ず dict を返す。
    """
    result = {
        "articles": [],
        "skipped": 0,
        "step1_status": None,
        "step1_html_preview": "",
        "step1_card_count": 0,
        "step1_article_count": 0,
        "step2_debug": [],
        "step2_first_article": None,
        "pre_filter_count": 0,
        "post_filter_count": 0,
    }

    try:
        # Step 1: 有料記事一覧をHTMLから取得
        step1 = fetch_paid_articles(keyword, max_count, step1_progress)
        articles = step1["articles"]
        result["step1_status"] = step1["status_code"]
        result["step1_html_preview"] = step1["html_preview"]
        result["step1_card_count"] = step1["card_count_total"]
        result["step1_article_count"] = len(articles)

        if not articles:
            return result

        # Step 2: 高評価数を取得
        articles, skipped, debug_list, first_debug = fetch_high_ratings(
            articles, step2_progress
        )
        result["skipped"] = skipped
        result["step2_debug"] = debug_list
        result["step2_first_article"] = first_debug

        # Step 3: フィルタリング
        result["pre_filter_count"] = len(articles)

        filtered = []
        for a in articles:
            hr = a.get("high_rating")
            if hr is None:
                # 高評価数取得不可 → フィルタリングから除外して残す
                filtered.append(a)
            elif hr >= min_high_rating:
                filtered.append(a)

        # 高評価数の降順でソート（Noneは末尾に）
        filtered.sort(
            key=lambda x: x.get("high_rating") if x.get("high_rating") is not None else -1,
            reverse=True,
        )

        result["articles"] = filtered
        result["post_filter_count"] = len(filtered)

    except Exception as e:
        result["error"] = str(e)

    return result
