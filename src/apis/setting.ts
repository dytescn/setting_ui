// src/apis/setting.ts
// Setting 配置表数据库操作封装（使用 SQL 直接操作）

const BASE_URL = "http://127.0.0.1:44944";
const DB_PATH = "./info";

// ============ 底层数据库请求 ============
// deno-lint-ignore no-explicit-any
const databaseRequest = async (symbol: string, body: any) => {
  const url = `${BASE_URL}/database`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/libary",
      "FFI-Symbol": symbol,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Database API error (${response.status}): ${errorText}`);
  }

  return response.json();
};

// ============ SQL 转义 ============
const esc = (val: unknown): string => {
  if (val === null || val === undefined) return "NULL";
  return `'${String(val).replace(/'/g, "''")}'`;
};

// ============ 建表标志（跨模块实例共享） ============
const G = globalThis as any;

export const ensureSettingTable = async () => {
  if (G.__settingTableInitialized) return;
  try {
    await databaseRequest("db_create", {
      path: DB_PATH,
      table: "setting",
      schema: `id INTEGER PRIMARY KEY AUTOINCREMENT,
               key TEXT NOT NULL UNIQUE,
               title TEXT,
               value TEXT,
               value_type TEXT DEFAULT 'string',
               category TEXT DEFAULT 'general',
               description TEXT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    });
  } catch (_) {
    // 表已存在时忽略
  }
  G.__settingTableInitialized = true;
};

export const ensureNoteTable = async () => {
  if (G.__noteTableInitialized) return;
  try {
    await databaseRequest("db_create", {
      path: DB_PATH,
      table: "setting_note",
      schema: `id INTEGER PRIMARY KEY AUTOINCREMENT,
               key TEXT NOT NULL,
               language TEXT NOT NULL DEFAULT 'default',
               title TEXT NOT NULL,
               description TEXT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               UNIQUE(key, language)`,
    });
  } catch (_) {
    // 表已存在时忽略
  }
  G.__noteTableInitialized = true;
};

// ============ 类型定义 ============
export type ValueType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "array"
  | "date"
  | "enum"
  | "path"
  | "url"
  | "color"
  | "secret";

export interface SettingItem {
  id?: number;
  key: string;
  title?: string;
  value: string;
  value_type?: ValueType;
  category?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoteItem {
  id?: number;
  key: string;
  language: string;
  title: string;
  description?: string;
  count?: number;
}

export interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============ 当前语言 ============
export const getCurrentLanguage = (): string => {
  const saved = localStorage.getItem("language");
  if (saved) return saved;
  const nav = (navigator.language ?? "").toLowerCase();
  return nav.startsWith("zh") || nav === "" ? "default" : "en";
};

// ============ 查询结果解析 ============
/**
 * 从后端返回结果中提取数组，兼容多种结构：
 *   { code, data: [...] }
 *   { code, data: { list: [...] } }
 *   { code, data: { rows: [...] } }
 *   { list: [...] }
 *   [...]
 */
// deno-lint-ignore no-explicit-any
const extractRows = (result: any): any[] => {
  if (Array.isArray(result)) return result;
  if (!result || typeof result !== "object") return [];

  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.data?.list)) return result.data.list;
  if (Array.isArray(result.data?.rows)) return result.data.rows;
  if (Array.isArray(result.list)) return result.list;
  if (Array.isArray(result.rows)) return result.rows;
  if (Array.isArray(result.result)) return result.result;

  return [];
};

const querySql = async <T = SettingItem>(sql: string): Promise<T[]> => {
  const result = await databaseRequest("db_query", { path: DB_PATH, sql });
  const rows = extractRows(result);

  // 只在“有数据但没解析出来”时警告，空数组不算
  const hasContent =
    result &&
    typeof result === "object" &&
    (result.data !== undefined ||
      result.list !== undefined ||
      result.rows !== undefined);
  const dataIsEmptyArray =
    Array.isArray(result?.data) && result.data.length === 0;

  if (rows.length === 0 && hasContent && !dataIsEmptyArray) {
    console.warn("[querySql] 未解析出数组，原始返回:", result);
  }
  return rows as T[];
};

const queryScalar = async (sql: string): Promise<number> => {
  const rows = await querySql<Record<string, unknown>>(sql);
  if (rows.length === 0) return 0;
  const first = rows[0];
  const firstKey = Object.keys(first)[0];
  return Number(first[firstKey] ?? 0) || 0;
};

const execSql = async (sql: string) => {
  return databaseRequest("db_insert", { path: DB_PATH, sql });
};

// ============ 基础 CRUD ============

export const setSetting = async (
  key: string,
  value: string,
  options?: {
    title?: string;
    value_type?: ValueType;
    category?: string;
    description?: string;
  },
) => {
  await ensureSettingTable();
  const { title, value_type, category, description } = options ?? {};
  await execSql(
    `INSERT OR REPLACE INTO setting
       (key, title, value, value_type, category, description, updated_at)
     VALUES (
       ${esc(key)},
       ${esc(title ?? key)},
       ${esc(value)},
       ${esc(value_type ?? "string")},
       ${esc(category ?? "general")},
       ${esc(description ?? "")},
       CURRENT_TIMESTAMP
     )`,
  );
};

export const getSetting = async (key: string): Promise<string | null> => {
  await ensureSettingTable();
  const rows = await querySql<SettingItem>(
    `SELECT value FROM setting WHERE key = ${esc(key)}`,
  );
  return rows.length > 0 ? rows[0].value : null;
};

export const getSettingItem = async (
  key: string,
): Promise<SettingItem | null> => {
  await ensureSettingTable();
  const rows = await querySql<SettingItem>(
    `SELECT * FROM setting WHERE key = ${esc(key)}`,
  );
  return rows.length > 0 ? rows[0] : null;
};

export const deleteSetting = async (key: string) => {
  await ensureSettingTable();
  await execSql(`DELETE FROM setting WHERE key = ${esc(key)}`);
};

export const setSettings = async (
  settings: Array<Partial<SettingItem> & { key: string; value: string }>,
) => {
  for (const s of settings) {
    await setSetting(s.key, s.value, {
      title: s.title,
      value_type: s.value_type,
      category: s.category,
      description: s.description,
    });
  }
};

export const deleteSettings = async (keys: string[]) => {
  for (const key of keys) {
    await deleteSetting(key);
  }
};

// ============ 分类相关 API ============

/**
 * 获取分类列表（当前语言），带每个分类下 setting 数量
 */
export const getCategories = async (
  language?: string,
): Promise<NoteItem[]> => {
  await ensureNoteTable();
  await ensureSettingTable();
  const lang = language ?? getCurrentLanguage();

  const rows = await querySql<NoteItem>(
    `SELECT n.id, n.key, n.language, n.title, n.description,
            (SELECT COUNT(*) FROM setting s WHERE s.category = n.key) AS count
     FROM setting_note n
     WHERE n.language = ${esc(lang)}
     ORDER BY n.key ASC`,
  );

  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    language: r.language,
    title: r.title,
    description: r.description,
    count: Number(r.count) || 0,
  }));
};

export const setNote = async (item: NoteItem) => {
  await ensureNoteTable();
  await execSql(
    `INSERT OR REPLACE INTO setting_note
       (key, language, title, description, updated_at)
     VALUES (
       ${esc(item.key)},
       ${esc(item.language)},
       ${esc(item.title)},
       ${esc(item.description ?? "")},
       CURRENT_TIMESTAMP
     )`,
  );
};

export const deleteNote = async (key: string, language: string) => {
  await ensureNoteTable();
  await execSql(
    `DELETE FROM setting_note
     WHERE key = ${esc(key)} AND language = ${esc(language)}`,
  );
};

// ============ 分页查询 ============

export const getSettingsByCategory = async (
  category: string,
  page = 1,
  pageSize = 20,
  keyword = "",
): Promise<PagedResult<SettingItem>> => {
  await ensureSettingTable();

  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const offset = (safePage - 1) * safePageSize;

  const conditions: string[] = [];
  if (category && category !== "all") {
    conditions.push(`category = ${esc(category)}`);
  }
  if (keyword) {
    const kw = esc(`%${keyword}%`);
    conditions.push(`(key LIKE ${kw} OR title LIKE ${kw})`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = await queryScalar(
    `SELECT COUNT(*) as total FROM setting ${where}`,
  );

  const list = await querySql<SettingItem>(
    `SELECT id, key, title, value, value_type, category, description,
            created_at, updated_at
     FROM setting
     ${where}
     ORDER BY category ASC, key ASC
     LIMIT ${safePageSize} OFFSET ${offset}`,
  );

  return {
    list,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize) || 1,
  };
};

export const getSettingsGrouped = async (): Promise<
  Record<string, SettingItem[]>
> => {
  await ensureSettingTable();
  const rows = await querySql<SettingItem>(
    `SELECT id, key, title, value, value_type, category, description,
            created_at, updated_at
     FROM setting
     ORDER BY category ASC, key ASC`,
  );
  const grouped: Record<string, SettingItem[]> = {};
  for (const row of rows) {
    const cat = row.category ?? "general";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(row);
  }
  return grouped;
};
