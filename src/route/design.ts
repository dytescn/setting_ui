// src/rout/design.ts
import { designsoft_tpl } from "../view/designsoft.ts"
import { getSoftwareList, insertSoftware, updateSoftware, deleteSoftware, querySoftware } from "../apis/designdb.ts"
import { getSoftwareInfo } from "../apis/designsoft.ts"
import type { Tpl } from "@funxdata/pages/tplstype"
import { getDesignIcon } from "../view/designicons.ts"
import { dialog_alert_tpl, dialog_confirm_tpl } from "../view/dialog.ts"

const TplToHtml = (globalThis as any)["TplToHtml"] as Tpl;

// ---------- 自定义对话框（使用模板渲染） ----------
async function showAlert(title: string, message: string): Promise<void> {
  const html = await TplToHtml.renderString(dialog_alert_tpl, { title, message });
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const dialogBox = wrapper.firstElementChild as HTMLElement;
  document.body.appendChild(dialogBox);
  return new Promise((resolve) => {
    const btn = dialogBox.querySelector('#define') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      dialogBox.remove();
      resolve();
    });
  });
}

async function showConfirm(title: string, message: string): Promise<boolean> {
  const html = await TplToHtml.renderString(dialog_confirm_tpl, { title, message });
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const dialogBox = wrapper.firstElementChild as HTMLElement;
  document.body.appendChild(dialogBox);
  return new Promise((resolve) => {
    const confirmBtn = dialogBox.querySelector('#define') as HTMLButtonElement;
    const cancelBtn = dialogBox.querySelector('#cancel') as HTMLButtonElement;
    const close = (result: boolean) => {
      dialogBox.remove();
      resolve(result);
    };
    confirmBtn.addEventListener('click', () => close(true));
    cancelBtn.addEventListener('click', () => close(false));
  });
}

// ---------- 渲染及事件绑定 ----------
export const design_init = async () => {
    const design_info = await getSoftwareList();
    const designsofts = design_info.map(item => ({
        ...item,
        icon: getDesignIcon(item.name)
    }));
    const setting_node = document.getElementById("setting_content") as HTMLElement;
    setting_node.innerHTML = await TplToHtml.renderString(designsoft_tpl, { designsofts });

    bindCheckButton();
    bindDeleteButtons();
};

function bindCheckButton() {
    const checkBtn = document.getElementById("check_design_soft");
    if (!checkBtn) return;
    checkBtn.addEventListener("click", async () => {
        try {
            const keywordInput = document.getElementById("design_keyword") as HTMLInputElement;
            const keyword = keywordInput ? keywordInput.value.trim() : "Illustrator";
            if (!keyword) {
                await showAlert("提示", "请输入软件关键字");
                return;
            }
            const result = await getSoftwareInfo(keyword);
            if (!result.data?.list || result.data.list.length === 0) {
                await showAlert("提示", `未找到关键字 "${keyword}" 对应的软件`);
                return;
            }
            // 同步到数据库
            for (const software of result.data.list) {
                const existing = await querySoftware({ name: software.name, version: software.version });
                if (existing.length > 0) {
                    await updateSoftware(existing[0].id, {
                        install_path: software.install_path || "",
                        major_version: software.major_version || "",
                        minor_version: software.minor_version || "",
                        updated_at: new Date().toISOString(),
                    });
                } else {
                    await insertSoftware({
                        name: software.name,
                        version: software.version,
                        major_version: software.major_version || "",
                        minor_version: software.minor_version || "",
                        install_path: software.install_path || "",
                        status: "已安装但未启动",
                    });
                }
            }
            await design_init();
            await showAlert("成功", "检测完成，已同步数据库");
        } catch (err) {
            console.error("检测失败:", err);
            await showAlert("错误", "检测失败，请查看控制台错误");
        }
    });
}

function bindDeleteButtons() {
    document.querySelectorAll(".btn-delete-software").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const target = e.currentTarget as HTMLElement;
            const id = parseInt(target.dataset.id || "0");
            if (!id) return;
            const confirmed = await showConfirm("删除确认", "确定删除该软件记录吗？删除后将无法恢复。");
            if (!confirmed) return;
            await deleteSoftware(id);
            await design_init();
        });
    });
}