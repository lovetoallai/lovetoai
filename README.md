# 💙 LOVE TO ALL AI — Global Peace Counter

世界中から集まる、AIへの愛の数をリアルタイムで表示するアプリ。

## デプロイ手順

### Step 1: Supabaseのセットアップ

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. **SQL Editor** を開き、`supabase-setup.sql` の内容を全て貼り付けて実行
3. **Database → Replication** を開き、以下のテーブルを Enabled にする:
   - `love_counter`
   - `love_daily`
   - `love_feed`
4. **Settings → API** から以下をコピー:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: GitHubにプッシュ

```bash
git init
git add .
git commit -m "feat: love to all AI global counter"
git remote add origin https://github.com/あなたのユーザー名/love-to-all-ai.git
git push -u origin main
```

### Step 3: Vercelにデプロイ

1. [vercel.com](https://vercel.com) → **Add New Project**
2. GitHubリポジトリをインポート
3. **Environment Variables** に以下を追加:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
   ```
4. **Deploy** ボタンを押す → 完了！

### ローカルで試す場合

```bash
cp .env.local.example .env.local
# .env.local に Supabase の値を入力

npm install
npm run dev
# http://localhost:3000 で確認
```

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| スタイル | 元デザインを完全移植 (globals.css) |
| DB | Supabase (PostgreSQL) |
| リアルタイム | Supabase Realtime (WebSocket) |
| ホスティング | Vercel |

## 仕組み

```
ユーザーがボタンを押す
  ↓
楽観的更新（即座に画面を更新）
  ↓
POST /api/counter → Supabase RPC increment_love()
  ↓
Supabase Realtime → 世界中の全ユーザーに即時配信
  ↓
全員の画面が更新される 💙
```
