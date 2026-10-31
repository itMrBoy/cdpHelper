# cdpHelper

[English](README.md) | [简体中文](README.zh-CN.md)

cdpHelper 分发通用浏览器自动化插件及独立的浏览器扩展。插件提供技能和本机 MCP 运行时，通过 Playwright 操作雪诺浏览器。实现源码维护在 [ModCDP](https://github.com/itMrBoy/ModCDP)。

## 使用前提

- Node.js 22 或更高版本，且宿主应用的本机执行器可以调用。
- 已安装雪诺浏览器，并允许浏览器扩展和 `chrome.debugger`。
- 宿主支持随包提供的插件与市场清单，并能运行本机 MCP 进程。

插件用户无需执行 npm 或 pnpm install、编译源码或下载 Playwright 浏览器。编译后的 JavaScript 和生产依赖随 `runtime.pack.gz` 分发，纯 Node 启动器校验后在用户缓存中离线准备运行时，不安装 npm 包、不下载缺失依赖。Node.js 与雪诺浏览器需单独安装。本仓库不提交展开的 `node_modules` 目录。

## 安装插件

将 [itMrBoy/cdpHelper](https://github.com/itMrBoy/cdpHelper) 的 `main` 分支作为插件市场，在宿主中安装 `cdphelper@cdphelper-plugins`。市场条目指向 `plugins/cdphelper`。本分发仓库不包含源码子模块；由 ModCDP 根目录的 `cdpHelper/` 子模块引用本仓库。

Codex:

```sh
codex plugin marketplace add itMrBoy/cdpHelper --ref main
codex plugin add cdphelper@cdphelper-plugins
```

Claude Code:

```text
/plugin marketplace add itMrBoy/cdpHelper
/plugin install cdphelper@cdphelper-plugins
```

插件和浏览器扩展需要分别安装。安装插件不会安装、下载、缓存或复制浏览器扩展，插件也不接收扩展安装目录。

插件与扩展须按兼容元数据配套使用。版本 **0.2.2** 对应扩展 **0.2.2** 和桥接协议 **2**。[v0.2.2 Release](https://github.com/itMrBoy/cdpHelper/releases/tag/v0.2.2) 已提供配套扩展 ZIP、发布清单和校验和。构建来源和兼容扩展下载以已安装插件的 `artifact.json`、对应 Release 说明及发布清单为准。只使用对应 Release 页面实际列出的附件，不根据市场版本推定 Release 已存在。

完整插件不依赖源码检出或初始化子模块。维护者也可使用本地市场检出和独立宿主配置目录进行验收。宿主安装和运行兼容需要单独验证，不能根据产物摘要认定通过。

## 更新 cdpHelper plugin

cdpHelper plugin 安装在 Codex、Claude Code 中，包含本机后台服务；cdpHelper 浏览器扩展安装在雪诺 profile 中。两者分别更新，并保持相同版本。

Codex（在终端执行）：

```sh
codex plugin marketplace upgrade cdphelper-plugins
codex plugin add cdphelper@cdphelper-plugins
```

Claude Code（在终端执行）：

```sh
claude plugin marketplace update cdphelper-plugins
claude plugin update cdphelper@cdphelper-plugins
```

命令完成后，退出并重新打开对应的 Codex 或 Claude Code，以加载新的 cdpHelper plugin；仅重连 MCP 可能继续使用旧启动路径。两端都安装了 plugin 时，分别执行各自的更新命令。无需重启雪诺。后台交接可能中断旧页面控制和诊断采集，已发出的操作可能继续产生效果；恢复后重新选择实例和页面，不自动重放操作。

## 更新 cdpHelper 浏览器扩展

1. 下载与 cdpHelper plugin 相同版本的 Release 扩展 ZIP，先解压到临时目录。
2. 用新包中 `extension/` 的完整内容替换原加载目录的扩展文件，保持原加载路径，不卸载扩展。
3. 在每个目标雪诺 profile 打开 `chrome://extensions`，找到 cdpHelper 浏览器扩展并点击“重新加载”。确认显示的版本与本次 Release 一致。
4. 在扩展选项页核对连接状态，保留原有本机服务地址和实例名称。再让 Agent 调用 `browser_status`，核对 plugin 后台与浏览器扩展版本，并按新的编号重新选择实例和页面。

更新 plugin 不会更新浏览器扩展，更新扩展也不会更新宿主中的 plugin。插件不会下载、缓存、复制或安装本扩展。网页操作使用 Playwright；Computer Use 仅可用于启动雪诺。关闭和清理 AI 创建的隔离 profile 前会征求用户确认。

如果旧 plugin 后台提示 `upgrade_blocked`，它可能仍关联旧版启动、未脱离后台进程生命周期的隔离雪诺窗口。按状态提示处理后再继续；不要通过强制结束后台绕过保护。profile 不自动删除，普通用户自行启动的雪诺窗口无需关闭。

## 连接浏览器

1. 启动插件，通过 `browser_status` 列出现有浏览器实例。
2. 通过 `browser_select` 选择现有实例，或申请启动新的隔离雪诺实例，后者须满足下文归属校验。页面操作前，技能会呈现这两种选择。真实雪诺的隔离启动尚未通过验收。
3. 如果目标浏览器没有兼容扩展，从 [cdpHelper Releases](https://github.com/itMrBoy/cdpHelper/releases) 下载配套扩展 ZIP。阅读 ZIP 内的安装说明。在**目标浏览器及其 profile** 中打开 `chrome://extensions`，开启开发者模式，加载解压结果内包含 `manifest.json` 的 **`extension/` 子目录**，不要选择 ZIP 根目录。雪诺可能已随 profile 下发扩展，启用兼容的已有副本也可以接入。
4. 重新列出实例，将扩展显示的唯一短编号与插件返回的实例对应，选定目标实例后，再绑定需要操作的标签页。

扩展通过本机入口 `ws://127.0.0.1:29393/bridge` 登记运行实例，在扩展选项页可以查看名称、唯一短编号及连接状态。多个已有雪诺 profile 可以同时接入，用户无需为每个 profile 配置不同端口。多个 profile 共用的扩展 ID 不是浏览器实例 ID。每次连接生成新的 UUID `instance_id`，前八位十六进制字符为 `short_id`。断连后旧连接及标签页引用失效，需要重新列出并选择已连接实例。

缺少扩展时，MCP 服务仍可启动并返回安装提示，未经用户选择不会启动浏览器或选中已有实例。用户明确选择隔离实例后，尝试启动并返回 `pending_isolation`。其中 `launch_process_running` 表示是否已核验存在匹配 profile 的进程。状态为 `waiting_for_extension` 时，在该窗口安装或启用扩展，并保留初始化标签页；状态为 `launch_exited_unverified` 时，表示启动器可能已退出或合并到已有浏览器，隔离尚未成立，插件不会回退选择其他浏览器。将扩展安装到其他浏览器或 profile，不会让目标实例接入。

隔离浏览器通过启动时打开的一次性本机 URL 关联，不按扩展连接先后认领。稳定的所属记录 ID（`owned_instance_id`）标识创建的 profile，与当前连接 UUID 不同。该隔离 profile 也需要通过浏览器下发或用户安装取得扩展。隔离 profile 不复制已有浏览器 profile 及其登录状态。

一次性 URL 本身不能证明隔离：雪诺可能将其转发到已有窗口。Windows 下，接纳隔离连接须同时核验插件所属标记，以及当前运行进程的可执行文件和精确 `--user-data-dir` profile，允许 PID 变化。对所属隔离实例的每次页面操作前都要重新核验；归属无法确认时解除连接，不发送页面操作。非 Windows 平台或进程探测失败时保持未验证。看到窗口或扩展已连接，都不足以认定隔离成立。

Release 下载链接、解压目录和插件安装目录都不是需要交给 MCP 的配置参数。按 ZIP 说明在目标浏览器安装扩展即可。关闭或清理隔离 profile 前须由用户明确选择；已有浏览器窗口和标签页保留。

## 下载浏览器扩展

扩展仅通过 [cdpHelper Release](https://github.com/itMrBoy/cdpHelper/releases) 的独立 ZIP 附件分发。选择匹配的版本 tag，下载其中的 `cdphelper-extension-v<version>.zip`。ZIP 包含中英文安装说明，以及存放 `manifest.json`、编译后扩展文件和 `cdphelper-bridge.json` 构建信息的 `extension/` 目录，不包含实例 token 或连接配置。

按构建元数据及发布说明选用与插件版本兼容的扩展。安装未完成时，插件不会静默下载扩展，也不会切换到其他浏览器。

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

市场清单和插件文件组成同一版本的分发产物：市场共 15 个文件，其中插件实际 13 个文件（外部清单记录 12 个文件，加上 `artifact.json` 本身）。gzip 运行包内有 1,930 个文件，包括生产依赖及其许可证。`artifact.json` 记录外部产物摘要及包内文件摘要、权限，启动器核验路径和内容后再准备运行时。Git 树中不包含展开的 `runtime/` 或 `node_modules/` 目录。构建元数据记录来源源码提交，本仓库不通过 gitlink 反向引用 ModCDP。插件不包含浏览器扩展、扩展 ZIP、自动下载扩展的逻辑或旧版源码 checkout runner。Git 属性保留市场及插件产物的原始字节。

运行时将展开后的文件、日志和隔离 profile 存放在 `~/.cdphelper`。依赖许可证保留在运行包内及本地缓存的依赖目录旁。原 `~/.snow-browser` 数据保留供回退，不自动迁移浏览器实例或清理 profile。

## 维护与校验

ModCDP 负责全部插件发布输入、实现、插件与扩展的拆分构建和交付工具。技能源码统一位于 ModCDP 的 `plugin/skills/cdphelper`。本仓库的两份市场清单和 `plugins/cdphelper` 均为生成文件：应修改 ModCDP 中的输入并重新生成，不手工修改分发产物。cdpHelper 维护双语用户文档并核验候选一致性。引入候选时须保留版本、协议、来源源码提交和文件摘要元数据。

在 ModCDP 中运行 `pnpm build:plugin`，可独立从源码构建插件，不依赖或更新分发子模块。在 ModCDP 中运行 `pnpm deliver:plugin`，则要求源码干净，且 `cdpHelper/` 分发子模块已初始化、工作区干净。交付仅从源码单向流向分发仓库，只更新 `.agents/plugins/marketplace.json`、`.claude-plugin/marketplace.json` 和完整的 `plugins/cdphelper` 目录，不自动提交或推送。交付后须审核并验证产物，再单独创建分发提交。

插件通过 `runtime.pack.gz` 携带编译后的运行时和生产依赖，启动器校验后在用户缓存中离线展开，用户无需安装 npm 包。浏览器扩展仍通过独立的 Release ZIP 分发，不交付到插件内。

仓库依赖方向为单向：ModCDP 根目录以 `cdpHelper/` 子模块固定本分发仓库的提交，URL 为 `https://github.com/itMrBoy/cdpHelper.git`。维护者从 ModCDP 获取实现源码，插件用户直接安装本分发仓库。正式对外分发前，源码提交和分发提交都必须能从各自远端获取。

发布候选按源码提交 A、记录 A 的干净构建、包含该候选的分发提交 B、ModCDP 固定 B 的父仓提交 C 顺序形成。C 中的子模块指针和文档记账不要求把候选的 `source_commit` 从 A 倒写成 C，避免构建来源自引用。

从干净源码构建并校验，交付到已初始化且干净的分发子模块，再通过候选分支和 PR 向本仓库 `main` 提交生成文件及文档。合并后，在 ModCDP 固定实际合并后的分发提交 B。构建和交付本身不会自动发布 Release。

发布自动化维护在 ModCDP，本分发仓库没有独立 workflow。部署并配置后，workflow 只处理 `pull_request_target` 的 `closed` 事件中已合并到 ModCDP `main` 的 PR，先证明源码 A 是源码 `main` 的祖先，且分发 B 已合入分发 `main`。全流水线使用固定 concurrency group 与 `queue: max` 串行执行。`v<version>` tag 锁定父仓 gitlink 引用的 B；CI 从 B 的 `artifact.json` 读取 `source_commit` 得到 A，检出 A 构建独立扩展 ZIP，最终发布清单记录 B 已分发插件的真实摘要和运行时 digest，不提交替代插件。

Release 说明自动生成中文，包含版本、来源、插件安装说明及独立扩展安装说明。首次发布汇总初始源码；后续以上一版稳定 Release 清单中的源码提交为基线生成差异说明，选择基线时排除 prerelease。同版本已正式发布时，仅在原发布清单和 tag 仍准确对应原分发 B 后跳过；后续仅更新 README 的分发提交不会使 tag 追平。相同 tag 已被公开 prerelease 占用时拒绝覆盖。新版本先创建 draft，上传扩展 ZIP、`release-manifest.json` 和 `SHA256SUMS` 三个附件，确认完整后再正式发布。

发布前提：源码 A 和分发 B 必须可从各自远端获取并合入各自 `main`，ModCDP 必须配置 `CDPHELPER_RELEASE_TOKEN` secret。该 token 仅授权 cdpHelper 仓库的 Contents 读写权限。发布是否成功，以 workflow 结果和对应 Release 页面为准；本地准备或使用 stub 的命令模拟不能证明已正式发布。

分发 `main` 从干净初始提交开始，其全部可达历史均不含展开的 `node_modules` 路径。包含这些文件的旧本地历史保留在本地备份引用中，不作为分发 `main` 的祖先。备份引用仅在本地保留；发布时不得推送备份引用，也不要使用 `git push --all` 或 `git push --mirror`。

产物校验与自动化测试不能证明宿主安装或真实雪诺兼容。宿主技能发现和 MCP 启动、浏览器页面操作需分别记录验收结果，并覆盖多个已有 profile 及隔离实例。

## 0.2.2 版本与验收边界

插件与浏览器扩展均为 **0.2.2**，桥接协议保持 **2**。本版在选定实例后台创建标签页，使用页面级焦点模拟，并从受控页面捕获当前视口，不请求激活标签页或窗口。扩展不再申请 activeTab。用户点击“停止控制”后暂停 Agent 操作并保留会话预约，点击“交还控制权”后重新授权，继续操作前必须读取新快照。点击其他标签页不会自动转移控制权。

同时修复控制器安装期间停止、后台建页时无关页面关闭，以及 Windows 默认扩展 ZIP 路径解析问题。干净源码 A：`bd823548f398540cd94df492e74d227b814266d8`（`source_dirty: false`）；运行时 digest：`b3e3443aa8b7aa2c4812a1c45e2ba8119364a6630c978da65362f8f72255929f`。本地插件回归 110/110、SDK 测试 92/92，以及类型检查、格式、lint 和正常提交钩子均通过。此前真实雪诺后台验收覆盖受控本地 fixture；不将任意站点、原生弹窗或双宿主用户级新安装计为已完成验收。

## 历史 0.2.1 验收记录

cdpHelper plugin 与浏览器扩展均为 **0.2.1**，桥接协议保持 **2**。本版修复 plugin 后台升级交接、组件版本提示、Windows 隔离实例生命周期保护，以及接管栏遮挡 Playwright 点击目标的问题。接管栏由 plugin 注入，浏览器扩展负责桥接通信。

干净源码 A：`1980d40311009562e2ebb7aaea1bdfda8efabf86`（`source_dirty: false`）；运行时 digest：`f9ed6a9b2bff6cc4321b32508736fb0c10990d367ccc5dfbf05ff4249360115e`。正式产物通过插件回归 105/105（并发 2）、启动校验及工具发现检查。自动化浏览器回归覆盖接管栏避让、滚动后定位、被动区域点击穿透与可信停止；这不代表原失败页面的真实雪诺复验已完成。双宿主真实验收和 Windows 雪诺 GUI 在升级后的窗口保留仍须按实际测试结果分别确认。

## 历史 0.2.0 验收记录

以下记录仅对应 0.2.0，不作为 0.2.1 的重新验收结果。

0.2.0 构建来源：干净源码 A `ecfa662924e32f09d634fff1744c0bc6bb84f231`（`source_dirty: false`），产物 SHA-256 为 `7de4f4975beebfdd6d3949b9bfbf83f80592f297f74f6b8de5ca0921a1654cbf`，运行时 digest 为 `415c67dc22120a144424df398defa82cc37b94209bc9547b7dbba196466726b3`。全部 15 个市场文件与交付构建一致，运行包文件摘要、权限、来源和许可证已核验，`node plugins/cdphelper/launch.mjs --check` 通过。公开扩展 ZIP 与发布清单均通过 `SHA256SUMS` 校验，ZIP 中的 logo 保留原图字节，扩展身份未改变。

自动验收：[Linux CI](https://github.com/itMrBoy/ModCDP/actions/runs/40909778518) 的本地 SDK 90/90、插件 82/82 和串行示例运行通过，lint 与[正式发布流水线](https://github.com/itMrBoy/ModCDP/actions/runs/40911083086) 通过。浏览器 fixture 在重载已解压扩展前显式开启开发者模式。Browserbase 云端集成因缺少密钥未运行，CI 已明确提示；Windows 本机 SDK 测试遇到 unzip 缺失等环境失败，不计为全量通过。不同平台归档字节不保证相同。

候选宿主验收已通过 Codex 与 Claude Code 的新增诊断工具真实调用。该结果与替换已有用户的全局安装分别记录，不将最终发布产物描述为已重新完成用户级安装验收。

真实雪诺已覆盖两个隔离测试 profile 的明确实例选择与路由、编号/颜色对应、页面停止与恢复，以及用户确认可导入 DevTools 的 Trace。用户确认 logo 生效，并选择保留两个窗口和 profile。测试窗口曾手动恢复，因此不能将本次结果描述为新建隔离实例首次启动的完整验收。此前一次截图超时尚未定位，第二个 profile 的一次点击超时也未计为成功点击。无法核验进程/profile 归属时，守卫仍拒绝操作。
