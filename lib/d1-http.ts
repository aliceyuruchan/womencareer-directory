// 通过 Cloudflare API 执行 D1 查询（POST /accounts/{account_id}/d1/database/{database_id}/query）。
// 搜索日志的数据库和 AI Search 实例在同一个 Cloudflare 账号里，共用账号 id 与 token；
// Pages 项目在另一个账号，D1 绑定只能连接同一账号的数据库，所以不用绑定。

export interface D1HttpConfig {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

export interface D1Statement {
  sql: string;
  // 整数、字符串、null 按原类型写入
  params?: (string | number | null)[];
}

export interface D1StatementResult<Row> {
  results: Row[];
  success: boolean;
}

// 多条语句放在一个 batch 请求里，依次执行；任何一条失败都抛出错误
export async function d1Batch<Row = Record<string, unknown>>(config: D1HttpConfig, statements: D1Statement[]): Promise<D1StatementResult<Row>[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/d1/database/${encodeURIComponent(config.databaseId)}/query`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ batch: statements }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`D1 查询失败 HTTP ${response.status}: ${text.slice(0, 500)}`);
  }
  const payload = JSON.parse(text) as { success: boolean; errors: unknown[]; result: D1StatementResult<Row>[] };
  if (!payload.success || payload.result.some((item) => !item.success)) {
    throw new Error(`D1 查询失败: ${text.slice(0, 500)}`);
  }
  return payload.result;
}
