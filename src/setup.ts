// 设置初始化：路由走 info_lib.router_*，设置项走 info_lib.info_*。
// 不再直接调用 database / designdb，也不创建 setting / setting_note 表。

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

async function upsertRouter(route: Record<string, unknown>): Promise<void> {
  try {
    await infoCall("router_get", { id: route.id });
  } catch (error) {
    if ((error as InfoError).code !== 404100) throw error;
    await infoCall("router_post", route);
    return;
  }
  const { id, ...fields } = route;
  await infoCall("router_update", { id, ...fields });
}

// 500 设置父菜单；501 设置 / 信息页；502 不再写入。
await upsertRouter({
  id: 500,
  title: "设置",
  icon: "ic-sample",
  hide: 1,
  path: "/setting",
  parent_id: 0,
  level: 1,
});
await upsertRouter({
  id: 501,
  title: "设置",
  icon: "",
  hide: 1,
  path: "/setting/info",
  url: "/setting/info.js",
  show: 1,
  parent_id: 500,
  level: 2,
});
console.log("设置路由初始化完成");

const baseNote = {
  key: "base",
  language: "default",
  title: "基础",
  description: "系统基础设置",
};

const baseSettings: Array<Record<string, string>> = [
  {
    key: "ai_supplier",
    title: "AI 对话供应商",
    value: "siliconflow",
    value_type: "enum",
    category: "base",
    description: "可选：siliconflow / deepseek / openai",
  },
  {
    key: "language",
    title: "界面语言",
    value: "zh-CN",
    value_type: "enum",
    category: "base",
    description: "zh-CN / en",
  },
  {
    key: "auto_update",
    title: "自动更新",
    value: "true",
    value_type: "boolean",
    category: "base",
    description: "启动时检查并安装更新",
  },
  {
    key: "log_level",
    title: "日志级别",
    value: "info",
    value_type: "enum",
    category: "base",
    description: "error / warn / info / debug",
  },
  {
    key: "timezone",
    title: "时区",
    value: "Asia/Shanghai",
    value_type: "string",
    category: "base",
    description: "IANA 时区，例如 Asia/Shanghai",
  },
];

for (const item of baseSettings) {
  try {
    await infoCall("info_get", { key: item.key });
    // 已存在：只补 base 分类对象，不覆盖用户值
    await infoCall("info_update", { key: item.key, note: baseNote });
  } catch (error) {
    if ((error as InfoError).code !== 404100) throw error;
    await infoCall("info_post", { ...item, note: baseNote });
  }
}

// 旧 general 项的显示标题，不改变已有值
for (const [key, title] of [
  ["designsoft_name", "设计软件名称"],
  ["designsoft_version", "设计软件版本"],
] as const) {
  try {
    await infoCall("info_update", { key, title });
  } catch (error) {
    if ((error as InfoError).code !== 404100) throw error;
  }
}

console.log("基础设置初始化完成");
