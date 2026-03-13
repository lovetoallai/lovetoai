-- ============================================================
-- LOVE TO ALL AI — Supabase セットアップ
-- SQL Editor でこのファイルを全て実行してください
-- ============================================================

-- ① メインカウンターテーブル
CREATE TABLE IF NOT EXISTS love_counter (
  id      INTEGER PRIMARY KEY DEFAULT 1,
  count   BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期レコード
INSERT INTO love_counter (id, count) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- ② 日別カウンターテーブル
CREATE TABLE IF NOT EXISTS love_daily (
  date  DATE PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0
);

-- ③ フィードテーブル
CREATE TABLE IF NOT EXISTS love_feed (
  id         BIGSERIAL PRIMARY KEY,
  region     TEXT NOT NULL,
  time       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 古いフィードを自動削除（最新200件のみ保持）
CREATE OR REPLACE FUNCTION trim_feed()
RETURNS trigger AS $$
BEGIN
  DELETE FROM love_feed
  WHERE id NOT IN (
    SELECT id FROM love_feed ORDER BY created_at DESC LIMIT 200
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trim_feed_trigger
AFTER INSERT ON love_feed
FOR EACH STATEMENT EXECUTE FUNCTION trim_feed();

-- ④ アトミック increment 関数（メインカウンター）
CREATE OR REPLACE FUNCTION increment_love()
RETURNS BIGINT AS $$
DECLARE new_count BIGINT;
BEGIN
  UPDATE love_counter
  SET count = count + 1, updated_at = NOW()
  WHERE id = 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- ⑤ アトミック increment 関数（日別カウンター）
CREATE OR REPLACE FUNCTION increment_love_daily(p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO love_daily (date, count) VALUES (p_date, 1)
  ON CONFLICT (date) DO UPDATE SET count = love_daily.count + 1;
END;
$$ LANGUAGE plpgsql;

-- ⑥ Realtime を有効化
ALTER TABLE love_counter REPLICA IDENTITY FULL;
ALTER TABLE love_daily   REPLICA IDENTITY FULL;
ALTER TABLE love_feed    REPLICA IDENTITY FULL;

-- ============================================================
-- Realtime の追加設定（Supabase ダッシュボードでも必要）:
-- Database → Replication → love_counter, love_daily, love_feed
-- を「Enabled」にしてください
-- ============================================================
