import datetime
import json

import streamlit as st
import pandas as pd

from scraper import search_notes
from estimator import estimate_min_sales

st.set_page_config(page_title="売れてるnoteリサーチツール", page_icon="📊", layout="wide")
st.title("📊 売れてるnoteリサーチツール")

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
                st.error("noteのAPIに接続できません。時間をおいて再度お試しください。")
                st.stop()

        progress_bar.progress(1.0)
        status_text.empty()

        articles = result["articles"]
        skipped = result["skipped"]

        # --- デバッグ情報 ---
        with st.expander("🔧 デバッグ情報"):
            st.write(f"**APIステータスコード:** {result['api_status']}")
            st.write(f"**Step1 取得記事数:** {result['step1_count']}件")
            st.write(f"**フィルタリング前件数:** {result['pre_filter_count']}件")
            st.write(f"**フィルタリング後件数:** {result['post_filter_count']}件")
            st.write(f"**高評価数取得スキップ数:** {skipped}件")

            if result["step2_debug"]:
                st.write("**Step2 各記事の高評価数:**")
                debug_df = pd.DataFrame(result["step2_debug"])
                st.dataframe(debug_df, use_container_width=True, hide_index=True)

            if result["first_response"]:
                st.write("**最初のAPIレスポンス（先頭1件）:**")
                try:
                    first_resp = result["first_response"]
                    # notes_for_sale の先頭1件だけ表示
                    contents = first_resp.get("data", {}).get("notes_for_sale", {}).get("contents", [])
                    if contents:
                        st.json(contents[0])
                    else:
                        # 構造がまだ違う場合は全体を表示
                        st.json(first_resp.get("data", {}))
                except Exception:
                    st.write("レスポンスの表示に失敗しました")

        if skipped > 0:
            st.warning(f"⚠️ {skipped}件の記事で高評価数の取得に失敗しました。")

        # --- 結果表示 ---
        if not articles:
            st.warning("条件に合う記事が見つかりませんでした")
        else:
            st.success(f"🎯 高評価{int(min_high_rating)}以上の記事: {len(articles)}件")

            # 売上予測を計算
            rows = []
            for a in articles:
                hr = a.get("high_rating")
                if hr is not None and hr > 0:
                    est = estimate_min_sales(a["price"], hr)
                    rows.append({
                        "タイトル": a["title"],
                        "著者": a["author"],
                        "価格": a["price"],
                        "高評価数": hr,
                        "推定購入者数": est["estimated_buyers"],
                        "最低売上予測": est["estimated_sales"],
                        "スキ数": a["like_count"],
                        "記事URL": a["url"],
                    })
                else:
                    # 高評価数が取得不可の記事
                    rows.append({
                        "タイトル": a["title"],
                        "著者": a["author"],
                        "価格": a["price"],
                        "高評価数": "取得不可" if hr is None else hr,
                        "推定購入者数": "-",
                        "最低売上予測": "-",
                        "スキ数": a["like_count"],
                        "記事URL": a["url"],
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

            # CSVダウンロード
            today = datetime.date.today().strftime("%Y%m%d")
            csv_data = df.to_csv(index=False).encode("utf-8-sig")
            st.download_button(
                label="📥 CSVダウンロード",
                data=csv_data,
                file_name=f"note_research_{keyword.strip()}_{today}.csv",
                mime="text/csv",
            )

            st.caption("※ 最低売上予測は高評価数から保守的に推定した参考値です。実際の売上はこれ以上の可能性が高いです。")
