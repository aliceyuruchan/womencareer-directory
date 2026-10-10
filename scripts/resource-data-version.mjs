import crypto from "node:crypto";

// data/resources.ts 的数据版本：全部 id 升序排列后 JSON.stringify，取 sha256 的前 16 位十六进制。
// sync-notion-resources.mjs 写入与 check-data-version.ts 构建检查共用这一规则。
export function computeResourceDataVersion(ids) {
  const sorted = [...ids].sort();
  return crypto.createHash("sha256").update(JSON.stringify(sorted), "utf8").digest("hex").slice(0, 16);
}
