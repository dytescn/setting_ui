import { setting_tpl } from "./view/app.ts";
import { info_init } from "./route/info.ts";
import type { Tpl } from "@funxdata/pages/tplstype";

const TplToHtml = (globalThis as any)["TplToHtml"] as Tpl;

const app_node = document.getElementById("app") as HTMLElement;
app_node.innerHTML = await TplToHtml.renderString(setting_tpl, {});

await info_init();
