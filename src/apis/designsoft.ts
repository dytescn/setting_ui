// 设计软件发现：调用 designsoft 能力库（不访问 database / designdb）。
const DESIGN_SOFT_URL = "http://127.0.0.1:44944/designsoft";

export interface SoftwareInfo {
  name: string;
  version: string;
  major_version?: string;
  minor_version?: string;
  install_path?: string;
}

export async function getSoftwareInfo(
  keyword: string,
): Promise<{ code: number; data?: { list?: SoftwareInfo[] }; msg?: string }> {
  const response = await fetch(DESIGN_SOFT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/libary",
      "FFI-Symbol": "info",
    },
    body: JSON.stringify({ keyword }),
  });
  if (!response.ok) {
    throw new Error(`designsoft info failed: ${response.status}`);
  }
  return await response.json();
}
