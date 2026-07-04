# AGENTS.md

## 项目定位

这是一个《剑网三》百战异闻录小工具，用来维护多个账号、多个角色的技能收集情况，并统计每个角色当前拥有的技能、技能等级、背包技能书、精耐、传功与本周进度。

当前已实现的业务以代码为准：角色管理、截图 OCR 导入技能/仓库、统计表格、按首领查看收集进度、导入导出、更新检查。`docs/## 需求简介.md` 是早期规划材料，里面的“精耐规划器/最优提升路径”目前不要当作现有功能或实现依据。

## 技术栈

- Vue 3 + TypeScript + Vite。
- UI 使用 Naive UI，图标主要通过 `unplugin-icons` 自动组件化。
- 样式使用 Tailwind CSS v4 + Less，公共 Less mixin 在 `src/assets/style/common.less`。
- 状态管理使用 Pinia，并通过 `src/store/plugins/storage.ts` 自动持久化到 `localStorage`。
- 桌面端使用 Tauri 2，配置在 `src-tauri/`。
- OCR 使用 `paddleocr` + `onnxruntime-web`，模型资产在 `src/assets/onnx/`，worker 入口是 `src/utils/ocr.worker.ts`。

## 常用命令

- 安装依赖：`npm install`
- Web 开发：`npm run dev`
- 类型检查并构建：`npm run build`
- 预览构建产物：`npm run preview`
- Tauri 开发/构建：`npm run tauri dev` / `npm run tauri build`

当前没有正式的 lint/test 脚本。改 TypeScript、Vue、OCR 或构建配置后，至少跑 `npm run build`。

## 目录边界

- `src/main.ts`：创建 Vue app、router、Pinia，并注册 localStorage 持久化插件。
- `src/App.vue`：应用壳，注册 Naive UI provider，启动时拉取技能和 Boss 数据。
- `src/router/index.ts`：页面路由。`/stat/boss/:roleId?` 会在缺少角色时引导创建角色。
- `src/store/game.ts`：线上游戏数据、Boss 列表、技能/技能书映射、OCR 结果转业务数据。
- `src/store/role.ts`：用户角色数据、账号排序、技能/背包映射、精耐与传功计算。
- `src/store/setting.ts`：用户设置，主要是主题、角色页展示偏好、统计表格配置、Boss 统计配置。
- `src/assets/data/game.ts`：百战规则常量，例如 Boss 系数、等级标签、精耐系数、排除技能、附带技能映射、通本消耗。
- `src/components/role/`：角色详情、创建/编辑、技能列表、技能 OCR、仓库 OCR、手动编辑。
- `src/components/stat/` 和 `src/views/Stat.vue`：统计表格、列配置、拖拽排序、选择/编辑模式。
- `src/utils/use/ocr.ts`：OCR worker 单例、初始化队列、识别请求分发。
- `src/services/`：接口请求封装。`src/services/fetch.ts` 会在 Tauri 下使用 plugin-http，在 Web 下使用 `window.fetch`。
- `types/`：全局业务类型和 auto-import 生成类型。

## 开发约定

- 先判断再编码。遇到真实权衡时先简短列方案、优缺点、适用场景和建议；需求冲突或错误成本高时先确认；低风险小歧义说明假设后继续。
- Less is More。只做当前任务需要的最小改动，不主动加抽象、兼容层或顺手重构。
- 手术式修改。只碰相关文件，匹配现有风格；只清理本次改动产生的废弃代码。
- 保持内聚。单处使用且内联更清晰时不要强拆；提取函数应服务语义边界、复用、测试或维护。
- 修 bug 先理解复现路径、输入条件和失败原因；能验证就优先验证。
- 注释只解释原因、业务约束或非显然边界，不复述代码；已有中文注释风格可以沿用。

## Vue / Naive UI 约定

- 默认使用 Composition API 和 `<script setup lang="ts">`。
- SFC 顺序按现有风格保持为 `<template>`、`<script setup>`、`<style scoped>`，不要为了格式洁癖大面积重排旧文件。
- 组件通信优先 props down / events up；只有弹窗 `open()` 这类现有命令式 API 才用 `defineExpose` + template ref。
- 派生数据优先 `computed`，watch 只用于副作用，例如文件变化后触发 OCR、路由 query 触发弹窗。
- Naive UI 组件通过 `unplugin-vue-components` 自动引入，`useMessage/useNotification/useDialog/useLoadingBar` 等通过 `unplugin-auto-import` 自动引入。读代码时不要把未显式 import 直接判成错误。
- 表格列、弹窗、Popover、Switch、Input 等优先沿用现有 Naive UI 写法，不引入新的 UI 框架。

## 业务注意事项

- 用户数据只保存在 `localStorage`，导入导出是跨设备迁移的主要方式。改 store shape 时要考虑旧数据 `$patch` 进来的兼容性。
- `game` store 是可刷新缓存：技能和技能书来自接口，Boss 列表优先读取 JX3BOX 文章内嵌数据，失败才用 `src/assets/data/game.ts` 的本地列表。
- 精耐计算入口是 `useRoleStore().calcSpiritAndEndurance(role)`；改百战规则前先确认是常量变化、接口数据变化，还是算法变化。
- 技能识别和仓库识别都走同一个 OCR worker，但白名单和后处理不同：技能走 `getSkillNameCharWhiteList()` / `getSkillsFromOcrResult()`，仓库走 `getBooksCharWhiteList()` / `getBooksFromOcrResult()`。
- 性别、附带技能、不计精耐技能、不计三本同等级技能等边界都在 `src/assets/data/game.ts`，不要在页面里散落硬编码。
- 统计表格有较多用户配置状态，改列 key、默认列或 custom value 时要同步考虑 `defaultStatColumns`、`useSettingStore().stat.columns` 和已有角色的 `customValue`。

## OCR / 构建注意事项

- `src/assets/onnx/*.onnx` 通过 Vite URL import 进入 worker，`vite.config.ts` 里有 `assetsInclude: ["**/*.onnx"]`，不要随意挪模型路径。
- `onnxruntime-web` 在 `optimizeDeps.exclude` 中，改 OCR 依赖或 worker 打包前必须跑 `npm run build`。
- 当前 TypeScript 组合是 `typescript ~5.6.3` + `vue-tsc ^2.2.12`，不要写 `Uint8Array<ArrayBuffer>` 这类泛型形式。
- OCR worker 和 debug preview 使用 `ImageBitmap`、`OffscreenCanvas`、worker message 传输；改动后最好同时验证普通识别、失败提示和调试预览。

## Tauri 注意事项

- Tauri 窗口名和版本在 `src-tauri/tauri.conf.json`；前端版本在 `package.json`。发布相关改动要确认两边版本是否需要同步。
- 外链打开统一走 `src/utils/actions.ts` 的 `openUrl()`，Web 用 `window.open`，Tauri 用 `@tauri-apps/plugin-opener`。
- 网络请求统一走 `src/services/fetch.ts`，避免在需要桌面端兼容的链路里直接写死 `window.fetch`。

## 验证建议

- 纯文案或样式小改：说明未跑构建即可。
- 改 Vue/TS/Pinia/OCR/Vite：跑 `npm run build`。
- 改 Tauri 配置或 Rust 侧插件：跑 `npm run tauri dev` 做启动验证；必要时再跑 `npm run tauri build`。
- 改 OCR：用 `demo/` 里的截图或用户提供截图验证技能识别、仓库识别和调试模式。
- 改精耐/统计规则：至少构造一个已有角色数据路径，核对角色详情、`/stat`、`/stat/boss/:roleId` 三处展示是否一致。
