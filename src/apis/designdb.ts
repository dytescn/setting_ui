// 设计软件列表：不再直接访问 designdb，改为存为 info_lib 的 info 设置项。
import { getSettingItem, setSetting } from "./setting.ts";

const SETTING_KEY = "designsoft_list";

export interface SoftwareRecord {
  id: number;
  name: string;
  version: string;
  major_version?: string;
  minor_version?: string;
  install_path?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

async function load(): Promise<SoftwareRecord[]> {
  const item = await getSettingItem(SETTING_KEY);
  if (!item?.value) return [];
  try {
    const parsed = JSON.parse(item.value);
    return Array.isArray(parsed) ? parsed as SoftwareRecord[] : [];
  } catch {
    return [];
  }
}

async function save(list: SoftwareRecord[]): Promise<void> {
  await setSetting(SETTING_KEY, JSON.stringify(list), {
    title: "设计软件列表",
    value_type: "json",
    category: "designsoft",
    description: "本机检测到的设计软件记录",
  });
}

export async function getSoftwareList(): Promise<SoftwareRecord[]> {
  return await load();
}

export async function insertSoftware(
  record: Omit<SoftwareRecord, "id">,
): Promise<void> {
  const list = await load();
  const id = list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  list.push({ ...record, id });
  await save(list);
}

export async function updateSoftware(
  id: number,
  patch: Partial<SoftwareRecord>,
): Promise<void> {
  const list = await load();
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return;
  list[index] = { ...list[index], ...patch, id };
  await save(list);
}

export async function deleteSoftware(id: number): Promise<void> {
  const list = await load();
  await save(list.filter((item) => item.id !== id));
}

export async function querySoftware(
  filter: { name?: string; version?: string },
): Promise<SoftwareRecord[]> {
  const list = await load();
  return list.filter((item) =>
    (filter.name === undefined || item.name === filter.name) &&
    (filter.version === undefined || item.version === filter.version)
  );
}
