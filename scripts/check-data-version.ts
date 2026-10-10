import { RESOURCE_DATA_VERSION, resources } from "@/data/resources";
import { computeResourceDataVersion } from "./resource-data-version.mjs";

// 构建前检查（package.json 的 prebuild）：data/resources.ts 末尾的 RESOURCE_DATA_VERSION 必须与当前全部 id 算出的值相同。
// 手动增删资源而没有运行 npm run sync:notion 时，这里终止构建。

const expected = computeResourceDataVersion(resources.map((resource) => resource.id));
if (RESOURCE_DATA_VERSION !== expected) {
  throw new Error(
    `data/resources.ts 的 RESOURCE_DATA_VERSION 是 ${RESOURCE_DATA_VERSION}，按当前 ${resources.length} 条资源的 id 计算应为 ${expected}。请运行 npm run sync:notion 重新生成。`,
  );
}
console.log(`RESOURCE_DATA_VERSION ${RESOURCE_DATA_VERSION} 与 ${resources.length} 条资源一致`);
