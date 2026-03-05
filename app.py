import datetime

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
            pct = min(current / total * 0.4, 0.4)  # Step1は全体の40%
            progress_bar.progress(pct)
            status_text.text(f"記事一覧を取得中... ({current}/{total})")

        def step2_progress(current, total, skipped):
            pct = 0.4 + min(current / total * 0.6, 0.6)  # Step2は全体の60%
            progress_bar.progress(pct)
            status_text.text(f"高評価数を取得中... ({current}/{total})")

        with st.spinner("noteからデータ取得中..."):
            try:
                articles, skipped = search_notes(
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

        if skipped > 0:
            st.warning(f"⚠️ {skipped}件の記事で高評価数の取得に失敗しました（高評価数=0として処理）。")

        # --- 結果表示 ---
        if not articles:
            st.warning("条件に合う記事が見つかりませんでした")
        else:
            st.success(f"🎯 高評価{int(min_high_rating)}以上の記事: {len(articles)}件")

            # 売上予測を計算
            rows = []
            for a in articles:
                est = estimate_min_sales(a["price"], a["high_rating"])
                rows.append({
                    "タイトル": a["title"],
                    "著者": a["author"],
                    "価格": a["price"],
                    "高評価数": a["high_rating"],
                    "推定購入者数": est["estimated_buyers"],
                    "最低売上予測": est["estimated_sales"],
                    "スキ数": a["like_count"],
                    "記事URL": a["url"],
                })

            df = pd.DataFrame(rows)

            st.dataframe(
                df,
                column_config={
                    "価格": st.column_config.NumberColumn(format="¥%d"),
                    "最低売上予測": st.column_config.NumberColumn(format="¥%d"),
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
