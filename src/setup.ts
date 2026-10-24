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
