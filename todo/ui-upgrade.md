# setting UI 升级

- [x] SU-01 修正 `@funxdata/toolkit` 映射为 `jsr:@funxdata/toolkit@^0.1.36`。
- [x] SU-02 确认 `info` / `design` 页面使用 Tailwind 类名，已补 `tailwindcss@^4.3.3`。
- [x] SU-03 `pack` task 改为 `pack.ts`，一次生成 `info` / `design` / `base.css` 产物。
- [x] SU-04 验证设置保存、设计设置与初始化脚本。
  - 2026-10-24：info 页面加载正常，`/database` 查询 setting 表返回 200；AppKey/AppToken 显示“未设置”，编辑按钮存在。
  - design 页面渲染正常；点击“检测”请求 `/designsoft` 返回 404 `Plugin Not Found`（缺少 designsoft 插件），前端错误提示正常。
  - 编辑弹窗交互未在自动化中完成（浏览器点击被拒绝），需人工验证。
- [ ] SU-05 design 页面依赖 `designsoft` 服务：在 app 中安装对应插件，或在未安装时隐藏“检测”按钮并给出说明。

## 打包与发布

- `deno task pack`：通过，产物 `assets/project_info_1_0_1.js`、`assets/project_design_1_0_1.js`、`assets/project_base_1_0_1.css`。
- `dytes.json`：`1.0.1`，exports 指向上述产物。
- 已发布：`webs/setting/1.0.1/`（info.js / design.js / setup.ts）；`packages.json` 1.0.0 → 1.0.1。
