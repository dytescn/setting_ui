// src/route/info.ts
import { info_tpl } from "../view/info.ts";
import {
  getCategories,
  getSettingsByCategory,
  getSettingItem,
  setSetting,
} from "../apis/setting.ts";
import {
  dialog_alert_tpl,
  dialog_confirm_tpl,
  dialog_input_tpl,
} from "../view/dialog.ts";
import type { Tpl } from "@funxdata/pages/tplstype";

const TplToHtml = (globalThis as any)["TplToHtml"] as Tpl;

// ============ 通用对话框 ============

async function showAlert(title: string, message: string): Promise<void> {
  const html = await TplToHtml.renderString(dialog_alert_tpl, {
    title,
    message,
  });
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const dialogBox = wrapper.firstElementChild as HTMLElement;
  document.body.appendChild(dialogBox);
  return new Promise((resolve) => {
    const btn = dialogBox.querySelector("#define") as HTMLButtonElement;
    btn.addEventListener("click", () => {
      dialogBox.remove();
      resolve();
    });
  });
}

async function showConfirm(title: string, message: string): Promise<boolean> {
  const html = await TplToHtml.renderString(dialog_confirm_tpl, {
    title,
    message,
  });
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const dialogBox = wrapper.firstElementChild as HTMLElement;
  document.body.appendChild(dialogBox);
  return new Promise((resolve) => {
    const confirmBtn = dialogBox.querySelector("#define") as HTMLButtonElement;
    const cancelBtn = dialogBox.querySelector("#cancel") as HTMLButtonElement;
    const close = (result: boolean) => {
      dialogBox.remove();
      resolve(result);
    };
    confirmBtn.addEventListener("click", () => close(true));
    cancelBtn.addEventListener("click", () => close(false));
  });
}

async function showInputDialog(params: {
  title: string;
  inputs: Array<{ id: string; label: string; value: string }>;
}): Promise<Record<string, string> | null> {
  const html = await TplToHtml.renderString(dialog_input_tpl, params);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const dialogBox = wrapper.firstElementChild as HTMLElement;
  document.body.appendChild(dialogBox);

  const inputs = params.inputs.map((input) => {
    const el = dialogBox.querySelector(`#${input.id}`) as HTMLInputElement;
    if (el) {
      el.removeAttribute("disabled");
      el.removeAttribute("readonly");
      el.style.pointerEvents = "auto";
    }
    return { id: input.id, element: el };
  });

  const confirmBtn = dialogBox.querySelector("#define") as HTMLButtonElement;
  const cancelBtn = dialogBox.querySelector("#cancel") as HTMLButtonElement;

  return new Promise((resolve) => {
    const close = (result: Record<string, string> | null) => {
      dialogBox.remove();
      resolve(result);
    };

    confirmBtn.addEventListener("click", () => {
      const values: Record<string, string> = {};
      inputs.forEach(({ id, element }) => {
        values[id] = element ? element.value : "";
      });
      close(values);
    });
    cancelBtn.addEventListener("click", () => close(null));
  });
}

// ============ URL 工具 ============

function getCategoryFromUrl(): string | null {
  const params = new URLSearchParams(location.search);
  return params.get("categories");
}

function setCategoryToUrl(category: string, replace = false) {
  const url = new URL(location.href);
  url.searchParams.set("categories", category);
  const method = replace ? "replaceState" : "pushState";
  history[method]({ categories: category }, "", url.toString());
}

// ============ 状态 ============

let currentCategory = "";

// ============ 渲染分类 tab ============

async function renderCategoryTabs() {
  const tabEl = document.getElementById("setting_tab") as HTMLElement;
  if (!tabEl) {
    console.warn("[info] 找不到 #setting_tab");
    return [];
  }

  const categories = await getCategories();
  console.log("[info] 分类列表:", categories);

  if (categories.length === 0) {
    tabEl.innerHTML = "";
    return categories;
  }

  const urlCat = getCategoryFromUrl();
  const validKeys = categories.map((c) => c.key);

  if (urlCat && validKeys.includes(urlCat)) {
    currentCategory = urlCat;
  } else if (!validKeys.includes(currentCategory)) {
    currentCategory = categories[0].key;
    setCategoryToUrl(currentCategory, true);
  }

  tabEl.innerHTML = categories
    .map(
      (c) => `
      <li class="vg-tabs-li ${c.key === currentCategory ? "select" : ""}"
          id="setting_tab_${c.key}"
          data-category="${c.key}">
        <a href="?categories=${c.key}">${c.title}</a>
      </li>`,
    )
    .join("");

  tabEl.onclick = async (e) => {
    const li = (e.target as HTMLElement).closest(
      "li[data-category]",
    ) as HTMLElement | null;
    if (!li) return;

    if ((e.target as HTMLElement).closest("a")) {
      e.preventDefault();
    }

    const cat = li.dataset.category!;
    if (cat === currentCategory) return;

    currentCategory = cat;
    setCategoryToUrl(cat);

    tabEl.querySelectorAll("li[data-category]").forEach((el) => {
      el.classList.toggle(
        "select",
        (el as HTMLElement).dataset.category === cat,
      );
    });

    await renderCategoryContent(cat);
  };

  return categories;
}

// ============ 渲染分类内容 ============

async function renderCategoryContent(category: string) {
  const container = document.getElementById("setting_content") as HTMLElement;
  if (!container) {
    console.warn("[info] 找不到 #setting_content");
    return;
  }

  if (!category) {
    container.innerHTML = "";
    return;
  }

  const result = await getSettingsByCategory(category, 1, 100);
  console.log(`[info] 分类 ${category} 配置:`, result);

  container.innerHTML = await TplToHtml.renderString(info_tpl, {
    list: result.list,
  });

  bindEditButtons();
}

// ============ 编辑按钮 ============

function bindEditButtons() {
  const container = document.getElementById("setting_content") as HTMLElement;
  if (!container) return;

  container.onclick = async (e) => {
    const btn = (e.target as HTMLElement).closest(
      'button[data-role="edit-btn"]',
    ) as HTMLButtonElement | null;
    if (!btn) return;

    const key = btn.dataset.key!;
    const item = await getSettingItem(key);
    if (!item) {
      await showAlert("错误", "配置项不存在");
      return;
    }

    const result = await showInputDialog({
      title: `编辑 ${item.title || item.key}`,
      inputs: [
        { id: "value", label: item.title || item.key, value: item.value ?? "" },
      ],
    });

    if (!result) return;

    await setSetting(key, result.value, {
      title: item.title,
      value_type: item.value_type,
      category: item.category,
      description: item.description,
    });

    await renderCategoryContent(currentCategory);
  };
}

// ============ 浏览器前进/后退 ============

window.addEventListener("popstate", async () => {
  const urlCat = getCategoryFromUrl();
  if (!urlCat || urlCat === currentCategory) return;

  const categories = await getCategories();
  if (!categories.some((c) => c.key === urlCat)) return;

  currentCategory = urlCat;

  const tabEl = document.getElementById("setting_tab");
  tabEl?.querySelectorAll("li[data-category]").forEach((el) => {
    el.classList.toggle(
      "select",
      (el as HTMLElement).dataset.category === urlCat,
    );
  });

  await renderCategoryContent(urlCat);
});

// ============ 页面入口 ============

export const info_init = async () => {
  const categories = await renderCategoryTabs();
  if (categories && categories.length > 0) {
    await renderCategoryContent(currentCategory);
  }
};
