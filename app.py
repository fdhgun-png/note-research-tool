import datetime

import streamlit as st
import pandas as pd

from scraper import search_notes, debug_search_page
from estimator import estimate_min_sales

st.set_page_config(page_title="売れてるnoteリサーチツール", page_icon="📊", layout="wide")
st.title("📊 売れてるnoteリサーチツール")

# --- APIレスポンス確認（常に表示） ---
with st.expander("🔧 検索ページ動作確認"):
    if st.button("テスト実行（キーワード: 副業）"):
        with st.spinner("検索ページにアクセス中..."):
            debug = debug_search_page("副業")
        st.write(f"**HTTPステータスコード:** {debug.get('status_code')}")
        st.write(f"**HTML長さ:** {debug.get('html_length')} 文字")
        st.write(f"**__NUXT__データ有無:** {debug.get('has_nuxt_data')}")
        st.write(f"**検出カード数:** {debug.get('card_count')}")
        if debug.get("error"):
            st.error(f"エラー: {debug['error']}")
        if debug.get("html_preview"):
            st.text_area("HTML先頭2000文字", debug["html_preview"], height=200)

# --- 入力フォーム ---
with st.form("search_form"):
    keyword = st.text_input("検索キーワード", placeholder="例：副業、AI、投資...")
    col1, col2 = st.columns(2)
    with col1:
        max_count = st.number_input("最大取得件数", min_value=10, max_value=200, value=50, step=10)
    with col2:
        min_high_rating = st.number_input("高評価の最低数", min_value=1, value=5, step=1)
    submitted = st.form_submit_button("🔍 リサーチ開始")

# --- 検索実行 ---
if submitted:
    if not keyword.strip():
        st.warning("キーワードを入力してください")
    else:
        progress_bar = st.progress(0)
        status_text = st.empty()

        def step1_progress(current, total):
            pct = min(current / total * 0.4, 0.4)
            progress_bar.progress(pct)
            status_text.text(f"記事一覧を取得中... ({current}/{total})")

        def step2_progress(current, total, skipped):
            pct = 0.4 + min(current / total * 0.6, 0.6)
            progress_bar.progress(pct)
            status_text.text(f"高評価数を取得中... ({current}/{total})")

        with st.spinner("noteからデータ取得中..."):
            try:
                result = search_notes(
                    keyword=keyword.strip(),
                    max_count=int(max_count),
                    min_high_rating=int(min_high_rating),
                    step1_progress=step1_progress,
                    step2_progress=step2_progress,
                )
            except Exception as e:
                result = {"articles": [], "skipped": 0, "error": str(e)}

        progress_bar.progress(1.0)
        status_text.empty()

        # result が dict でない場合の安全対策
        if not isinstance(result, dict):
            st.error(f"予期しない戻り値: type={type(result)}")
            result = {"articles": [], "skipped": 0}

        articles = result.get("articles", [])
        skipped = result.get("skipped", 0)

        # エラーがあれば表示
        if result.get("error"):
            st.error(f"処理中にエラーが発生しました: {result['error']}")

        # --- デバッグ情報（常に表示） ---
        with st.expander("🔧 デバッグ情報", expanded=(len(articles) == 0)):
            st.subheader("Step1: 記事一覧取得")
            st.write(f"**検索ページ HTTPステータス:** {result.get('step1_status')}")
            st.write(f"**検出カード数（全ページ合計）:** {result.get('step1_card_count', 0)}")
            st.write(f"**パース済み記事数:** {result.get('step1_article_count', 0)}")

            html_preview = result.get("step1_html_preview", "")
            if html_preview:
                st.text_area("取得したHTMLの先頭2000文字", html_preview, height=150)

            st.subheader("Step2: 高評価数取得")
            step2_debug = result.get("step2_debug", [])
            if step2_debug:
                st.write(f"**処理記事数:** {len(step2_debug)}")
                st.write(f"**取得失敗数:** {skipped}")
                debug_df = pd.DataFrame(step2_debug)
                st.dataframe(debug_df, use_container_width=True, hide_index=True)

            first_art = result.get("step2_first_article")
            if first_art:
                st.write("**最初の記事ページの詳細:**")
                st.write(f"- HTTPステータス: {first_art.get('status_code')}")
                st.write(f"- scriptタグ内JSON検出: {first_art.get('found_json')}")
                st.write(f"- 「人が高評価」テキスト検出: {first_art.get('found_text')}")
                st.write(f"- 取得した高評価数: {first_art.get('rating')}")
                st.write(f"- 取得方法: {first_art.get('method')}")

            st.subheader("フィルタリング")
            st.write(f"**フィルタ前:** {result.get('pre_filter_count', 0)}件")
            st.write(f"**フィルタ後:** {result.get('post_filter_count', 0)}件")

        if skipped > 0:
            st.warning(f"⚠️ {skipped}件の記事で高評価数の取得に失敗しました。")

        # --- 結果表示 ---
        if not articles:
            st.warning("条件に合う記事が見つかりませんでした")
        else:
            st.success(f"🎯 高評価{int(min_high_rating)}以上の記事: {len(articles)}件")

            rows = []
            for a in articles:
                hr = a.get("high_rating")
                if hr is not None and hr > 0:
                    est = estimate_min_sales(a.get("price", 0), hr)
                    rows.append({
                        "タイトル": a.get("title", ""),
                        "著者": a.get("author", ""),
                        "価格": a.get("price", 0),
                        "高評価数": hr,
                        "推定購入者数": est["estimated_buyers"],
                        "最低売上予測": est["estimated_sales"],
                        "スキ数": a.get("like_count", 0),
                        "記事URL": a.get("url", ""),
                    })
                else:
                    rows.append({
                        "タイトル": a.get("title", ""),
                        "著者": a.get("author", ""),
                        "価格": a.get("price", 0),
                        "高評価数": "取得不可" if hr is None else hr,
                        "推定購入者数": "-",
                        "最低売上予測": "-",
                        "スキ数": a.get("like_count", 0),
                        "記事URL": a.get("url", ""),
                    })

            df = pd.DataFrame(rows)

            st.dataframe(
                df,
                column_config={
                    "記事URL": st.column_config.LinkColumn(),
                },
                use_container_width=True,
                hide_index=True,
            )

            today = datetime.date.today().strftime("%Y%m%d")
            csv_data = df.to_csv(index=False).encode("utf-8-sig")
            st.download_button(
                label="📥 CSVダウンロード",
                data=csv_data,
                file_name=f"note_research_{keyword.strip()}_{today}.csv",
                mime="text/csv",
            )

            st.caption("※ 最低売上予測は高評価数から保守的に推定した参考値です。実際の売上はこれ以上の可能性が高いです。")
