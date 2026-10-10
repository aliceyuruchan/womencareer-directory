import { chromium } from "playwright-core";

// 浏览器端到端测试：在本地 Pages 环境（npm run dev:pages）里输入查询并按回车，核对字面结果立即出现、语义结果随后合并进列表。
// 用法：npx tsx scripts/search-e2e.ts [--base http://localhost:8788] [--query 实习]

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const base = option("--base") ?? "http://localhost:8788";
const queries = (option("--query") ?? "实习,智能应用,奖学金,Figma,zzzzqqq").split(",");

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const apiCalls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/search")) apiCalls.push(request.url());
  });
  page.on("pageerror", (error) => {
    throw new Error(`页面脚本错误：${error.message}`);
  });

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const input = page.getByRole("textbox", { name: "搜索资源" });

  for (const query of queries) {
    await input.fill("");
    await input.fill(query);
    const semanticResponse = page.waitForResponse((response) => response.url().includes("/api/search") && response.status() === 200, { timeout: 20000 });
    await input.press("Enter");
    await page.waitForTimeout(150);
    const immediateTitles = await page.locator("main h3").allInnerTexts();
    await semanticResponse;
    await page.waitForTimeout(300);
    const mergedTitles = await page.locator("main h3").allInnerTexts();
    const countText = await page.locator("main h2 + p").first().innerText();
    console.log(`【${query}】字面 ${immediateTitles.length} 条 → 合并后 ${mergedTitles.length} 条（页面计数：${countText}）`);
    console.log(`  ${mergedTitles.join(" | ")}`);
  }

  await input.fill("");
  const categoryCards = await page.locator("main h3, main [class*=CardTitle], main a[href*='/category/']").count();
  console.log(`清空后回到分类视图：分类卡片 ${categoryCards} 个，/api/search 调用 ${apiCalls.length} 次`);
  await browser.close();
}

main();
