import re
import time
import requests
from playwright.sync_api import sync_playwright


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
            resp = requests.get(url, timeout=15)
            if resp.status_code != 200:
                return None  # APIエラー → フォールバックへ

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


def fetch_paid_articles_playwright(keyword: str, max_count: int = 50, progress_callback=None):
    """
    Playwrightでnote検索ページから有料記事一覧を取得する（フォールバック）。

    Args:
        keyword: 検索キーワード
        max_count: 最大取得件数
        progress_callback: 進捗コールバック (current, total)

    Returns:
        記事リスト
    """
    articles = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            search_url = f"https://note.com/search?q={keyword}&context=note_for_sale"
            page.goto(search_url, wait_until="networkidle", timeout=30000)
            time.sleep(3)

            # スクロールして記事を読み込む
            prev_count = 0
            scroll_attempts = 0
            max_scroll_attempts = 20

            while len(articles) < max_count and scroll_attempts < max_scroll_attempts:
                # 記事要素を取得
                note_elements = page.query_selector_all('a[href*="/n/"]')

                for elem in note_elements:
                    if len(articles) >= max_count:
                        break

                    href = elem.get_attribute("href") or ""
                    if "/n/" not in href:
                        continue

                    # 重複チェック
                    full_url = f"https://note.com{href}" if href.startswith("/") else href
                    if any(a["url"] == full_url for a in articles):
                        continue

                    title = elem.inner_text().strip()
                    if not title:
                        continue

                    articles.append({
                        "title": title,
                        "url": full_url,
                        "price": 0,
                        "like_count": 0,
                        "author": "",
                        "key": "",
                    })

                if progress_callback:
                    progress_callback(len(articles), max_count)

                if len(articles) == prev_count:
                    scroll_attempts += 1
                else:
                    scroll_attempts = 0
                prev_count = len(articles)

                page.evaluate("window.scrollBy(0, 1000)")
                time.sleep(2)

        except Exception:
            pass
        finally:
            browser.close()

    return articles[:max_count]


def fetch_high_ratings(articles: list, progress_callback=None):
    """
    各記事ページにアクセスし、高評価数を取得する。

    Args:
        articles: 記事リスト
        progress_callback: 進捗コールバック (current, total, skipped)

    Returns:
        (更新された記事リスト, スキップ数)
    """
    skipped = 0
    total = len(articles)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for i, article in enumerate(articles):
            try:
                page.goto(article["url"], wait_until="networkidle", timeout=30000)
                time.sleep(1)

                # 「◯人が高評価」テキストを検索
                content = page.content()
                match = re.search(r"(\d+)人が高評価", content)
                if match:
                    article["high_rating"] = int(match.group(1))
                else:
                    article["high_rating"] = 0

            except Exception:
                article["high_rating"] = 0
                skipped += 1

            if progress_callback:
                progress_callback(i + 1, total, skipped)

            time.sleep(2)

        browser.close()

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
        (フィルタ済み記事リスト, スキップ数, APIフォールバック使用フラグ)
    """
    # Step 1: 有料記事一覧を取得
    articles = fetch_paid_articles_api(keyword, max_count, step1_progress)
    used_fallback = False

    if articles is None:
        used_fallback = True
        articles = fetch_paid_articles_playwright(keyword, max_count, step1_progress)

    if not articles:
        return [], 0, used_fallback

    # Step 2: 高評価数を取得
    articles, skipped = fetch_high_ratings(articles, step2_progress)

    # Step 3: フィルタリング
    filtered = [a for a in articles if a.get("high_rating", 0) >= min_high_rating]

    # 高評価数の降順でソート
    filtered.sort(key=lambda x: x.get("high_rating", 0), reverse=True)

    return filtered, skipped, used_fallback
