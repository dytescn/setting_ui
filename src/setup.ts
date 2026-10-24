const API_URL = "http://127.0.0.1:44944/database";
const ROUTER_DB = "./router";

// ========== 1. 清理旧设置路由（防止重复插入） ==========
await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/libary", "FFI-Symbol": "db_delete" },
    body: JSON.stringify({
        path: ROUTER_DB,
        sql: "DELETE FROM routers WHERE id IN (500, 501, 502) OR parent_id IN (500, 501, 502)",
    }),
});
console.log("旧设置路由清理完成");

// ========== 2. 插入设置一级菜单（固定 ID 500） ==========
await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/libary", "FFI-Symbol": "db_insert" },
    body: JSON.stringify({
        path: ROUTER_DB,
        sql: `INSERT INTO routers (id, title, icon, hide, path, parent_id, level)
              VALUES (500, '设置', 'ic-sample', 1, '/setting', 0, 1)`,
    }),
});
console.log("设置父路由插入成功");

// ========== 3. 插入设置列表二级菜单（parent_id = 300） ==========
await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/libary", "FFI-Symbol": "db_insert" },
    body: JSON.stringify({
        path: ROUTER_DB,
        sql: `INSERT INTO routers (id, title, icon, hide, path, url, show, parent_id, level)
              VALUES (501, '设置', '', 1, '/setting/info', '/setting/info.js', 1, 500, 2)`,
    }),
});

// 初始化数据
const initRes = await fetch("http://127.0.0.1:44944/database", {
  method: "POST",
  headers: { "Content-Type": "application/libary", "FFI-Symbol": "db_create" },
  body: JSON.stringify({
    path: "./info",
    table: "setting",
    schema: `id INTEGER PRIMARY KEY AUTOINCREMENT,
             key TEXT NOT NULL UNIQUE,
             title TEXT,
             value TEXT,
             value_type TEXT DEFAULT 'string',
             category TEXT DEFAULT 'general',
             description TEXT,
             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  })
});

// 初始化分类表
const noteRes = await fetch("http://127.0.0.1:44944/database", {
  method: "POST",
  headers: { "Content-Type": "application/libary", "FFI-Symbol": "db_create" },
  body: JSON.stringify({
    path: "./info",
    table: "setting_note",
    schema: `id INTEGER PRIMARY KEY AUTOINCREMENT,
             key TEXT NOT NULL,
             language TEXT NOT NULL DEFAULT 'default',
             title TEXT NOT NULL,
             description TEXT,
             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             UNIQUE(key, language)`
  })
});

console.log(await noteRes.json());

console.log(await initRes.json());

// ========== 4. 基础分类与默认设置 ==========
// 旧库可能缺少 title / value_type 列，先做容错迁移（列已存在时忽略错误）
const db = async (symbol: string, sql: string) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/libary", "FFI-Symbol": symbol },
    body: JSON.stringify({ path: "./info", sql }),
  });
  return await res.json().catch(() => null);
};

for (const sql of [
  "ALTER TABLE setting ADD COLUMN title TEXT",
  "ALTER TABLE setting ADD COLUMN value_type TEXT DEFAULT 'string'",
]) {
  await db("db_insert", sql);
}

const q = (value: string) => `'${value.replace(/'/g, "''")}'`;

// 通用分类（旧 general）与基础分类：重复执行时只保留一条
await db("db_delete", "DELETE FROM setting_note WHERE key IN ('general', 'base') AND language = 'default'");
await db(
  "db_insert",
  `INSERT INTO setting_note (key, language, title, description)
   VALUES ('general', 'default', '通用', '通用设置与内部缓存')`,
);
await db(
  "db_insert",
  `INSERT INTO setting_note (key, language, title, description)
   VALUES ('base', 'default', '基础', '系统基础设置')`,
);

// 旧 general 项的显示标题，不改变已有值
await db("db_insert", "UPDATE setting SET title = '设计软件名称' WHERE key = 'designsoft_name' AND (title IS NULL OR title = '')");
await db("db_insert", "UPDATE setting SET title = '设计软件版本' WHERE key = 'designsoft_version' AND (title IS NULL OR title = '')");

// 基础设置默认值；INSERT OR IGNORE 不覆盖用户已修改的值
const baseSettings: Array<[string, string, string, string, string]> = [
  ["ai_supplier", "AI 对话供应商", "siliconflow", "enum", "可选：siliconflow / deepseek / openai"],
  ["language", "界面语言", "zh-CN", "enum", "zh-CN / en"],
  ["auto_update", "自动更新", "true", "boolean", "启动时检查并安装更新"],
  ["log_level", "日志级别", "info", "enum", "error / warn / info / debug"],
  ["timezone", "时区", "Asia/Shanghai", "string", "IANA 时区，例如 Asia/Shanghai"],
];

const baseValues = baseSettings
  .map(([key, title, value, type, description]) =>
    `(${[key, title, value, type, "base", description].map(q).join(", ")})`
  )
  .join(", ");

await db(
  "db_insert",
  `INSERT OR IGNORE INTO setting (key, title, value, value_type, category, description)
   VALUES ${baseValues}`,
);

console.log("基础设置分类与默认值初始化完成");
