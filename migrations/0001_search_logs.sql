-- 网站搜索日志：用户每提交一次搜索记一条，由页面上报（components/home-page.tsx、lib/search-log.ts）。
-- 时间都是毫秒时间戳；functions/api/log.ts 每次写入时删除 90 天前的记录。
CREATE TABLE IF NOT EXISTS search_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  language TEXT NOT NULL,             -- zh / en
  literal_ids TEXT NOT NULL,          -- JSON 数组，字面匹配命中的 id，按显示顺序
  semantic_hits TEXT,                 -- JSON 数组 [{id, score}]，语义结果没有到达或失败时为 NULL
  semantic_unknown_ids TEXT,          -- JSON 数组，语义命中里页面数据中不存在的 id；语义结果没有到达或失败时为 NULL
  shown_ids TEXT NOT NULL,            -- JSON 数组，上报时页面显示的 id，按显示顺序
  semantic_status TEXT NOT NULL,      -- ok / error / pending
  semantic_http_status INTEGER,       -- error 时的 HTTP 状态码，网络中断为 0
  semantic_cache TEXT,                -- hit / miss，语义结果没有到达时为 NULL
  semantic_attempts INTEGER,          -- /api/search 的 meta.attempts
  semantic_ms INTEGER,                -- 页面发出请求到收到响应的耗时
  data_version TEXT NOT NULL,         -- 页面构建时的 RESOURCE_DATA_VERSION
  submitted_at INTEGER NOT NULL,      -- 页面提交搜索的时间
  host TEXT NOT NULL,                 -- log.ts 从请求地址取出的域名，区分正式站点与 *.pages.dev 预览部署
  created_at INTEGER NOT NULL         -- 服务器收到记录的时间
);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_session ON search_logs (session_id, submitted_at);

CREATE TABLE IF NOT EXISTS search_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  position INTEGER NOT NULL,          -- 从 1 开始
  source TEXT NOT NULL,               -- literal / semantic
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_search_clicks_created_at ON search_clicks (created_at);
CREATE INDEX IF NOT EXISTS idx_search_clicks_search_id ON search_clicks (search_id);
