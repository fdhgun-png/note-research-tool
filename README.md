# 📊 売れてるnoteリサーチツール

noteの有料記事を検索し、「高評価数」が一定以上の記事を抽出して一覧表示するツールです。
各記事に対して高評価数から「最低売上予測」を算出して表示します。

## セットアップ手順

### 1. Python環境構築

Python 3.11以上が必要です。

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 3. Playwrightブラウザのインストール

```bash
playwright install chromium
```

## ローカル実行方法

```bash
streamlit run app.py
```

ブラウザで http://localhost:8501 にアクセスしてください。

## Streamlit Cloudへのデプロイ手順

1. このリポジトリをGitHubにpushする
2. [Streamlit Cloud](https://share.streamlit.io/) にアクセス
3. 「New app」からGitHubリポジトリを接続
4. メインファイルに `app.py` を指定してデプロイ

`packages.txt` に記載されたシステムパッケージはStreamlit Cloudで自動インストールされます。

## 注意事項

- 本ツールはnoteの非公式APIを利用しています。仕様変更により動作しなくなる可能性があります。
- サーバー負荷を考慮して、適切な間隔で利用してください。
- 取得データは個人利用の範囲で使用してください。
