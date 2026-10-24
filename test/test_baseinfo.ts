const API_URL = "http://127.0.0.1:44944/database";
const ROUTER_DB = "./info";

// ============ 1. 插入 setting 配置数据 ============
const settings = [
  // ===== base 基础信息 =====
  {
    key: 'app_name',
    title: '应用名称',
    value: 'MyApp',
    value_type: 'string',
    category: 'base',
    description: '应用的显示名称',
  },
  {
    key: 'app_version',
    title: '应用版本',
    value: '1.0.0',
    value_type: 'string',
    category: 'base',
    description: '当前应用版本号',
  },
  {
    key: 'app_language',
    title: '默认语言',
    value: 'zh-CN',
    value_type: 'enum',
    category: 'base',
    description: '默认语言：zh-CN / en-US',
  },
  {
    key: 'app_theme',
    title: '主题',
    value: 'light',
    value_type: 'enum',
    category: 'base',
    description: '界面主题：light / dark',
  },
  {
    key: 'app_debug',
    title: '调试模式',
    value: 'false',
    value_type: 'boolean',
    category: 'base',
    description: '是否开启调试模式',
  },

  // ===== silicon_info 硅基应用配置 =====
  {
    key: 'silicon_app_key',
    title: '应用 Key',
    value: 'sk-xxxxxxxxxxxxxxxx',
    value_type: 'secret',
    category: 'silicon_info',
    description: '硅基流动 API 应用 Key',
  },
  {
    key: 'silicon_app_secret',
    title: '应用 Secret',
    value: 'sec-xxxxxxxxxxxxxxxx',
    value_type: 'secret',
    category: 'silicon_info',
    description: '硅基流动 API 应用 Secret',
  },
  {
    key: 'silicon_app_topk',
    title: 'TopK',
    value: '40',
    value_type: 'number',
    category: 'silicon_info',
    description: '采样时保留概率最高的 K 个 token',
  },
  {
    key: 'silicon_app_model',
    title: '默认模型',
    value: 'Qwen/Qwen2.5-7B-Instruct',
    value_type: 'string',
    category: 'silicon_info',
    description: '默认调用的模型名称',
  },
  {
    key: 'silicon_app_base_url',
    title: 'API 地址',
    value: 'https://api.siliconflow.cn/v1',
    value_type: 'url',
    category: 'silicon_info',
    description: '硅基流动 API 基础地址',
  },
];

// 逐条插入 setting
for (const s of settings) {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/libary", "FFI-Symbol": "db_insert" },
    body: JSON.stringify({
      path: ROUTER_DB,
      sql: `INSERT INTO setting (key, title, value, value_type, category, description)
            VALUES ('${s.key}', '${s.title}', '${s.value}', '${s.value_type}', '${s.category}', '${s.description}')`,
    }),
  });
}

// ============ 2. 插入 setting_note 分类数据 ============
const notes = [
  // ===== base =====
  {
    key: 'base',
    language: 'default',
    title: '基础设置',
    description: '应用基础信息配置',
  },
  {
    key: 'base',
    language: 'en',
    title: 'Base',
    description: 'Application basic settings',
  },

  // ===== silicon_info =====
  {
    key: 'silicon_info',
    language: 'default',
    title: '硅基配置',
    description: '硅基流动 API 相关配置',
  },
  {
    key: 'silicon_info',
    language: 'en',
    title: 'Silicon Info',
    description: 'SiliconFlow API settings',
  },

  // ===== general =====
  {
    key: 'general',
    language: 'default',
    title: '通用',
    description: '通用配置项',
  },
  {
    key: 'general',
    language: 'en',
    title: 'General',
    description: 'General settings',
  },
];

// 逐条插入 setting_note
for (const n of notes) {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/libary", "FFI-Symbol": "db_insert" },
    body: JSON.stringify({
      path: ROUTER_DB,
      sql: `INSERT INTO setting_note (key, language, title, description)
            VALUES ('${n.key}', '${n.language}', '${n.title}', '${n.description}')`,
    }),
  });
}


