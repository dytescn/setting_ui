// src/debug_check.ts
// 检查数据库表结构 + 数据

const API_URL = "http://127.0.0.1:44944/database";
const DB_PATH = "./info";

// deno-lint-ignore no-explicit-any
async function db(symbol: string, body: any) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/libary",
      "FFI-Symbol": symbol,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json;
}

// 1. 查 setting 表结构
console.log("=== setting 表结构 ===");
const settingSchema = await db("db_query", {
  path: DB_PATH,
  sql: `PRAGMA table_info(setting)`,
});
console.log(JSON.stringify(settingSchema, null, 2));

// 2. 查 setting_note 表结构
console.log("\n=== setting_note 表结构 ===");
const noteSchema = await db("db_query", {
  path: DB_PATH,
  sql: `PRAGMA table_info(setting_note)`,
});
console.log(JSON.stringify(noteSchema, null, 2));

// 3. 查 setting 表所有数据
console.log("\n=== setting 表数据 ===");
const settingRows = await db("db_query", {
  path: DB_PATH,
  sql: `SELECT * FROM setting LIMIT 20`,
});
console.log(JSON.stringify(settingRows, null, 2));

// 4. 查 setting_note 表所有数据
console.log("\n=== setting_note 表数据 ===");
const noteRows = await db("db_query", {
  path: DB_PATH,
  sql: `SELECT * FROM setting_note LIMIT 20`,
});
console.log(JSON.stringify(noteRows, null, 2));


