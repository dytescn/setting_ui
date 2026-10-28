// src/apis/setting.ts
// 设置接口：只调用 info_lib，不再直接访问 database / designdb。

const INFO_URL = "http://127.0.0.1:44944/info_lib";

type InfoError = Error & { code?: number };

async function infoCall<T = unknown>(
  symbol: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(INFO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/libary",
      "FFI-Symbol": symbol,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || payload.code !== 200) {
    const error = new Error(
      payload?.msg ?? `info_lib ${symbol} failed: ${response.status}`,
    ) as InfoError;
    error.code = payload?.code ?? response.status;
    throw error;
  }
  return payload.data as T;
}

const isNotFound = (error: unknown): boolean =>
  (error as InfoError)?.code === 404100;

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
  // deno-lint-ignore no-explicit-any
  note?: any;
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

export const getCurrentLanguage = (): string => {
  const saved = localStorage.getItem("language");
  if (saved) return saved;
  const nav = (navigator.language ?? "").toLowerCase();
  return nav.startsWith("zh") || nav === "" ? "default" : "en";
};

export const ensureSettingTable = async () => {
  // 表由 info_lib 首次调用惰性创建
};

export const ensureNoteTable = async () => {
  // setting_note 由 info_lib 写入 designdb
};

async function saveSetting(
  key: string,
  value: string,
  options?: {
    title?: string;
    value_type?: ValueType;
    category?: string;
    description?: string;
  },
): Promise<SettingItem> {
  const body = {
    key,
    title: options?.title ?? key,
    value,
    value_type: options?.value_type ?? "string",
    category: options?.category ?? "general",
    description: options?.description ?? "",
  };
  try {
    await infoCall("info_get", { key });
    return await infoCall<SettingItem>("info_update", body);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    return await infoCall<SettingItem>("info_post", body);
  }
}

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
  await saveSetting(key, value, options);
};

export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const item = await infoCall<SettingItem>("info_get", { key });
    return item?.value ?? null;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
};

export const getSettingItem = async (
  key: string,
): Promise<SettingItem | null> => {
  try {
    return await infoCall<SettingItem>("info_get", { key });
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
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

// ============ 分类相关 API ============

const listAll = async (): Promise<SettingItem[]> => {
  const result = await infoCall<{ list: SettingItem[] }>("info_list", {
    page: 1,
    page_size: 200,
  });
  return result.list ?? [];
};

export const getCategories = async (
  _language?: string,
): Promise<NoteItem[]> => {
  const rows = await listAll();
  const map = new Map<string, NoteItem>();
  for (const row of rows) {
    const key = row.category ?? "general";
    const existing = map.get(key);
    if (existing) {
      existing.count = (existing.count ?? 0) + 1;
      continue;
    }
    map.set(key, {
      key,
      language: row.note?.language ?? "default",
      title: row.note?.title ?? key,
      description: row.note?.description ?? "",
      count: 1,
    });
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
};

export const setNote = async (item: NoteItem) => {
  const rows = await infoCall<{ list: SettingItem[] }>("info_list", {
    category: item.key,
    page: 1,
    page_size: 1,
  });
  const target = rows.list?.[0];
  if (!target) {
    throw new Error(`分类 ${item.key} 下没有设置项，无法写入分类对象`);
  }
  await infoCall("info_update", {
    key: target.key,
    note: {
      key: item.key,
      language: item.language,
      title: item.title,
      description: item.description ?? "",
    },
  });
};

export const getSettingsByCategory = async (
  category: string,
  page = 1,
  pageSize = 20,
  keyword = "",
): Promise<PagedResult<SettingItem>> => {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const result = await infoCall<{
    list: SettingItem[];
    page: number;
    page_size: number;
    total: number;
  }>("info_list", {
    category: category && category !== "all" ? category : undefined,
    keyword: keyword || undefined,
    page: safePage,
    page_size: safePageSize,
  });
  const total = result.total ?? 0;
  return {
    list: result.list ?? [],
    total,
    page: result.page ?? safePage,
    pageSize: result.page_size ?? safePageSize,
    totalPages: Math.ceil(total / safePageSize) || 1,
  };
};

export const getSettingsGrouped = async (): Promise<
  Record<string, SettingItem[]>
> => {
  const rows = await listAll();
  const grouped: Record<string, SettingItem[]> = {};
  for (const row of rows) {
    const cat = row.category ?? "general";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(row);
  }
  return grouped;
};
