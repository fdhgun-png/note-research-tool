# note競合分析ダッシュボード「noteスパイ」

## プロジェクト概要
noteクリエイターのURLを入力すると、そのクリエイターの記事データ（スキ数・投稿頻度・価格帯・タイトルキーワード等）を自動取得・分析し、ダッシュボードで可視化するWebアプリ。

## 絶対に守るルール
- 応答はすべて日本語で行う
- 外部AI API（Claude API、OpenAI API、Gemini API等）は絶対に使用しない
- 分析はすべてTypeScriptのロジック（ルールベース、集計、ソート）で実装する
- ランニングコストが発生する外部サービスは一切使用しない
- ログイン機能・認証機能は一切不要。URLを知っている人が直接アクセスして使う
- データベースは使用しない。分析データはすべてオンメモリ（ブラウザ上 or API Routeの1リクエスト内）で処理する
- Supabaseは使用しない

## 技術スタック（これ以外は使わない）
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts（グラフ描画）
- react-activity-calendar（投稿頻度ヒートマップ）
- TinySegmenter（日本語形態素解析、ブラウザ内完結、API不要）
- Vercel（デプロイ先）無料枠のみ

## ディレクトリ構成
```
/app                    - ページ（App Router）
/app/api/analyze        - 分析用API Route
/components             - UIコンポーネント
/components/charts      - グラフ系コンポーネント
/components/dashboard   - ダッシュボード固有コンポーネント
/lib/note-api           - note非公式API連携モジュール
/lib/analysis           - 分析ロジック（ルールベース）
/types                  - 型定義
/public                 - 静的ファイル
```

## note非公式APIエンドポイント（ベースURL: https://note.com/api）
- ユーザー情報: GET /v2/creators/{username}
- ユーザー記事一覧: GET /v2/creators/{username}/contents?kind=note&page={n}
- 記事詳細: GET /v3/notes/{noteId}
- 記事スキ一覧: GET /v3/notes/{noteId}/likes
- キーワード検索: GET /v3/searches?context=note&q={keyword}&size=20&start=0
- ハッシュタグ情報: GET /v2/hashtags/{tagname}
- カテゴリ記事: GET /v1/categories/{category}?note_intro_only=true&sort=new&page=1

## API利用時の注意
- リクエスト間に最低1秒の遅延を入れる（レートリミット対策）
- 全ページ自動ページネーション（page=1から始めて、結果が空になるまで取得）
- エラー時はリトライ（最大3回、指数バックオフ）

## コーディングルール
- コンポーネントは関数コンポーネント + TypeScript
- shadcn/uiのコンポーネントを最大限活用する
- エラーハンドリングは必ず実装する（try-catch + ユーザーへのエラー表示）
- ローディング状態を必ず表示する（スケルトンUI or スピナー）
- モバイルレスポンシブ対応必須
- ダークモードをデフォルトにする
