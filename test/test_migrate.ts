// test/test_migrate.ts
// 给 setting 表补列 + 写入测试数据

const API_URL = "http://127.0.0.1:44944/database";
const DB_PATH = "./info";

// deno-lint-ignore no-explicit-any
async function db(symbol: string, body: any) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/libary", "FFI-Symbol": symbol },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  console.log(`[${symbol}]`, JSON.stringify(json).slice(0, 200));
  return json;
}

const esc = (v: unknown) =>
  v === null || v === undefined
    ? "NULL"
    : `'${String(v).replace(/'/g, "''")}'`;

// ========== 1. 给 setting 表补列 ==========
// SQLite 的 ALTER TABLE ADD COLUMN 不支持 IF NOT EXISTS
// 已存在的列会报错，忽略即可
const alterCols = [
  `ALTER TABLE setting ADD COLUMN title TEXT`,
  `ALTER TABLE setting ADD COLUMN value_type TEXT DEFAULT 'string'`,
  `ALTER TABLE setting ADD COLUMN category TEXT DEFAULT 'general'`,
  `ALTER TABLE setting ADD COLUMN description TEXT`,
];

console.log("=== 1. 补列 ===");
for (const sql of alterCols) {
  try {
    await db("db_insert", { path: DB_PATH, sql });
    console.log(`✅ ${sql}`);
  } catch (e) {
    console.log(`⚠️ 跳过（可能已存在）: ${sql}`);
  }
}

// ========== 2. 写入 setting 测试数据 ==========
console.log("\n=== 2. 写入 setting 数据 ===");
const settings = [
  // base
  ["app_name", "应用名称", "MyApp", "string", "base", "应用的显示名称"],
  ["app_version", "应用版本", "1.0.0", "string", "base", "当前应用版本号"],
  ["app_language", "默认语言", "zh-CN", "enum", "base", "默认语言"],
  ["app_theme", "主题", "light", "enum", "base", "界面主题"],
  ["app_debug", "调试模式", "false", "boolean", "base", "是否开启调试"],
  // silicon_info
  ["silicon_app_key", "应用 Key", "sk-xxxxxxxxxxxxxxxx", "secret", "silicon_info", "硅基流动 API 应用 Key"],
  ["silicon_app_secret", "应用 Secret", "sec-xxxxxxxxxxxxxxxx", "secret", "silicon_info", "硅基流动 API 应用 Secret"],
  ["silicon_app_topk", "TopK", "40", "number", "silicon_info", "采样时保留概率最高的 K 个 token"],
  ["silicon_app_model", "默认模型", "Qwen/Qwen2.5-7B-Instruct", "string", "silicon_info", "默认调用的模型名称"],
  ["silicon_app_base_url", "API 地址", "https://api.siliconflow.cn/v1", "url", "silicon_info", "硅基流动 API 基础地址"],
];

for (const [key, title, value, vt, cat, desc] of settings) {
  await db("db_insert", {
    path: DB_PATH,
    sql: `INSERT OR IGNORE INTO setting
            (key, title, value, value_type, category, description)
          VALUES (
            ${esc(key)}, ${esc(title)}, ${esc(value)},
            ${esc(vt)}, ${esc(cat)}, ${esc(desc)}
          )`,
  });
}
console.log(`✅ 插入 ${settings.length} 条 setting`);

// ========== 3. 校验 ==========
console.log("\n=== 3. 校验 ===");
const check = await db("db_query", {
  path: DB_PATH,
  sql: `SELECT key, title, category FROM setting ORDER BY category, key`,
});
console.log(JSON.stringify(check, null, 2));


