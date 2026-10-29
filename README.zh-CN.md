# cdpHelper

[English](README.md) | [简体中文](README.zh-CN.md)

cdpHelper 分发通用浏览器自动化插件及独立的浏览器扩展。插件提供技能和本机 MCP 运行时，通过 Playwright 操作雪诺浏览器。实现源码维护在 [ModCDP](https://github.com/itMrBoy/ModCDP)。

## 使用前提

- Node.js 22 或更高版本，且宿主应用的本机执行器可以调用。
- 已安装雪诺浏览器，并允许浏览器扩展和 `chrome.debugger`。
- 宿主支持随包提供的插件与市场清单，并能运行本机 MCP 进程。

插件用户无需执行 npm 或 pnpm install、编译源码或下载 Playwright 浏览器。编译后的 JavaScript 和生产依赖随 `runtime.pack.gz` 分发，纯 Node 启动器校验后在用户缓存中离线准备运行时，不安装 npm 包、不下载缺失依赖。Node.js 与雪诺浏览器需单独安装。本仓库不提交展开的 `node_modules` 目录。

## 安装插件

将本仓库的 `main` 分支作为插件市场，在宿主中选择 `cdphelper`。市场条目指向 `plugins/cdphelper`。本分发仓库不包含源码子模块；由 ModCDP 根目录的 `cdpHelper/` 子模块引用本仓库。

插件和浏览器扩展需要分别安装。安装插件不会安装、下载、缓存或复制浏览器扩展，插件也不接收扩展安装目录。

当前本地候选为 **0.1.1**，配套扩展 **0.1.1**、桥接协议 **2**，构建自干净的 ModCDP 源码提交 A：`8fe202edac3f53574d8c1040273608db8654d70a`（`source_dirty: false`）。当前尚未发布：远端市场还没有 `main` 分支或 Release，源码改动也尚未推送。获得另行授权并正式发布后，才能从 GitHub 安装市场或下载 Release。

本地宿主验收使用本仓库作为市场，完整插件不依赖源码检出或初始化子模块，并使用独立的宿主配置目录，无需替换全局插件。宿主安装和运行兼容需要单独验证，不能根据产物摘要认定通过。

## 连接浏览器

1. 启动插件，通过 `browser_status` 列出现有浏览器实例。
2. 通过 `browser_select` 选择现有实例，或申请启动新的隔离雪诺实例，后者须满足下文归属校验。页面操作前，技能会呈现这两种选择。真实雪诺的隔离启动尚未通过验收。
3. 如果目标浏览器没有兼容扩展，待发布后从 [cdpHelper Releases](https://github.com/itMrBoy/cdpHelper/releases) 下载配套扩展 ZIP。阅读 ZIP 内的安装说明。在**目标浏览器及其 profile** 中打开 `chrome://extensions`，开启开发者模式，加载解压结果内包含 `manifest.json` 的 **`extension/` 子目录**，不要选择 ZIP 根目录。雪诺可能已随 profile 下发扩展，启用兼容的已有副本也可以接入。
4. 重新列出实例，将扩展显示的唯一短编号与插件返回的实例对应，选定目标实例后，再绑定需要操作的标签页。

扩展通过本机入口 `ws://127.0.0.1:29393/bridge` 登记运行实例，在扩展选项页可以查看名称、唯一短编号及连接状态。多个已有雪诺 profile 可以同时接入，用户无需为每个 profile 配置不同端口。多个 profile 共用的扩展 ID 不是浏览器实例 ID。每次连接生成新的 UUID `instance_id`，前八位十六进制字符为 `short_id`。断连后旧连接及标签页引用失效，需要重新列出并选择已连接实例。

缺少扩展时，MCP 服务仍可启动并返回安装提示，未经用户选择不会启动浏览器或选中已有实例。用户明确选择隔离实例后，尝试启动并返回 `pending_isolation`。其中 `launch_process_running` 表示是否已核验存在匹配 profile 的进程。状态为 `waiting_for_extension` 时，在该窗口安装或启用扩展，并保留初始化标签页；状态为 `launch_exited_unverified` 时，表示启动器可能已退出或合并到已有浏览器，隔离尚未成立，插件不会回退选择其他浏览器。将扩展安装到其他浏览器或 profile，不会让目标实例接入。

隔离浏览器通过启动时打开的一次性本机 URL 关联，不按扩展连接先后认领。稳定的所属记录 ID（`owned_instance_id`）标识创建的 profile，与当前连接 UUID 不同。该隔离 profile 也需要通过浏览器下发或用户安装取得扩展。隔离 profile 不复制已有浏览器 profile 及其登录状态。

一次性 URL 本身不能证明隔离：雪诺可能将其转发到已有窗口。Windows 下，接纳隔离连接须同时核验插件所属标记，以及当前运行进程的可执行文件和精确 `--user-data-dir` profile，允许 PID 变化。对所属隔离实例的每次页面操作前都要重新核验；归属无法确认时解除连接，不发送页面操作。非 Windows 平台或进程探测失败时保持未验证。看到窗口或扩展已连接，都不足以认定隔离成立。

Release 下载链接、解压目录和插件安装目录都不是需要交给 MCP 的配置参数。按 ZIP 说明在目标浏览器安装扩展即可。关闭或清理隔离 profile 前须由用户明确选择；已有浏览器窗口和标签页保留。

## 下载浏览器扩展

扩展仅通过 [cdpHelper Release](https://github.com/itMrBoy/cdpHelper/releases) 的独立 ZIP 附件分发。本候选计划在 `v0.1.1` tag 下提供 `cdphelper-extension-v0.1.1.zip`。ZIP 包含中英文安装说明，以及存放 `manifest.json`、编译后扩展文件和 `cdphelper-bridge.json` 构建信息的 `extension/` 目录，不包含实例 token 或连接配置。

按构建元数据及发布说明选用与插件候选或正式版本兼容的扩展。安装未完成时，插件不会静默下载扩展，也不会切换到其他浏览器。

## 仓库布局

```text
.agents/plugins/marketplace.json   插件市场入口
.claude-plugin/marketplace.json   插件市场入口
plugins/cdphelper/                完整可安装插件
  skills/                        浏览器工作流技能
  runtime.pack.gz                编译后运行时、生产依赖及许可证
README.md
README.zh-CN.md
```

市场清单和插件文件对应同一固定候选：市场共 15 个文件，其中插件实际 13 个文件（外部清单记录 12 个文件，加上 `artifact.json` 本身）。gzip 运行包内有 1,930 个文件，包括生产依赖及其许可证。`artifact.json` 记录外部产物摘要及包内文件摘要、权限，启动器核验路径和内容后再准备运行时。Git 树中不包含展开的 `runtime/` 或 `node_modules/` 目录。构建元数据记录来源源码提交，本仓库不通过 gitlink 反向引用 ModCDP。插件不包含浏览器扩展、扩展 ZIP、自动下载扩展的逻辑或旧版源码 checkout runner。Git 属性保留市场及插件产物的原始字节。

运行时将展开后的文件、日志和隔离 profile 存放在 `~/.cdphelper`。依赖许可证保留在运行包内及本地缓存的依赖目录旁。原 `~/.snow-browser` 数据保留供回退，不自动迁移浏览器实例或清理 profile。

## 维护与校验

ModCDP 负责实现、插件与扩展的拆分构建、候选导出及后续候选分支 PR 工具。cdpHelper 负责市场布局、用户文档和候选一致性核验。候选须从固定且干净的源码提交构建，引入时保留版本、协议、来源源码提交和文件摘要元数据。

仓库依赖方向为单向：ModCDP 根目录以 `cdpHelper/` 子模块固定本分发仓库的提交，URL 为 `https://github.com/itMrBoy/cdpHelper.git`。维护者从 ModCDP 获取实现源码，插件用户直接安装本分发仓库。正式对外分发前，源码提交和分发提交都必须能从各自远端获取。

发布候选按源码提交 A、记录 A 的干净构建、包含该候选的分发提交 B、ModCDP 固定 B 的父仓提交 C 顺序形成。C 中的子模块指针和文档记账不要求把候选的 `source_commit` 从 A 倒写成 C，避免构建来源自引用。

候选先在本地引入、校验并提交，分发更新计划通过候选分支向 `main` 提交 PR。本地准备不包含推送、创建远端 PR、创建 Release 或更改仓库可见性。

分发 `main` 从干净初始提交开始，其全部可达历史均不含展开的 `node_modules` 路径。包含这些文件的旧本地历史保留在本地备份引用中，不作为分发 `main` 的祖先。备份引用仅在本地保留；发布时不得推送备份引用，也不要使用 `git push --all` 或 `git push --mirror`。

产物校验与自动化测试不能证明宿主安装或真实雪诺兼容。宿主技能发现和 MCP 启动、浏览器页面操作需分别记录验收结果，并覆盖多个已有 profile 及隔离实例。

最终压缩包 A 候选的完整插件测试 7/7 通过，无失败或跳过，覆盖多 profile Chromium 测试、桥接校验、隔离归属守卫、离线共享后台启动、压缩产物完整性与篡改和路径越界拒绝、活动会话升级保护。引入时已核验干净源码元数据、全部 15 个市场文件、包内每个运行文件的摘要和权限、许可证、运行时摘要及独立扩展 ZIP；启动器检查 `node plugins/cdphelper/launch.mjs --check` 也已通过。既有 Chrome 131 协议 schema 告警未导致测试失败，这不是真实雪诺验收。旧 JS 会话关闭场景失败此前已在未修改的基线复现，不能宣称 JS 全部通过。

2026-10-29 的最终宿主验收已通过，使用全新的独立 `CODEX_HOME`、`CLAUDE_CONFIG_DIR` 和 `USERPROFILE`，未预热运行时，也未修改 MCP 超时。Codex 已启用用户级 `cdphelper:cdphelper` 技能，加载全部 15 个 MCP 工具，无工具错误或宿主 stderr。Claude 显示一个技能、一个 MCP 服务，并在默认 30 秒内 Connected；完整 MCP 健康检查命令耗时 5,725 ms，这不是单独的运行时准备耗时。两份安装缓存各有 13 个文件，产物 SHA-256 均为 `fd56e33c032c66da4d22b64a7a02cfa53dd6091a94b2e61d1978ddc0da22123f`，不含展开的 `node_modules`、扩展、ZIP、源码检出或旧 runner。Git trace 没有子模块初始化或更新命令。Claude 市场校验通过，仅有安装命令行 advice。全局插件替换不属于本次仓库方向迁移。这些检查不能证明真实雪诺页面操作通过。

早期展开运行时候选虽安装成功，但在暂存复制阶段超过 Claude 默认 30 秒 MCP 启动时限，现已由上述压缩运行包候选替代，并通过全新宿主验收。早期文件复制基准不是新 gzip 准备流程的耗时数据。

**真实雪诺隔离未通过验收，不保证支持独立隔离启动。** 实测中用户未关闭窗口，但两个启动的 profile 进程仍自行退出或合并，窗口及扩展登记不足以证明归属。两个测试 profile 后续已获用户明确批准并清理，已有浏览器主进程保留。此失败涉及隔离启动，不改变多个已有实例的复用设计；也不能据此认定任一模式的真实雪诺页面操作已通过验收。
