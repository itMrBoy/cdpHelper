# 安装 Snow Browser 插件

## 用户安装入口

唯一插件市场分发入口为 **cdpHelper 仓库的 main 分支**。该仓库根目录提供两端 marketplace，`plugins/cdphelper/` 提供生成的可运行插件。ModCDP 在根目录通过 `cdpHelper/` 子模块引入分发仓库；cdpHelper 不反向引入源码。技能、清单生成逻辑和运行时的唯一编辑位置均在 ModCDP，分发目录中的生成文件不手工修改。不能把 ModCDP 源码根目录当作已安装插件。

用户需准备 **Node ≥22**、已安装的雪诺浏览器，以及加载 MV3 扩展和使用 `chrome.debugger` 的权限。插件包含编译后的 JavaScript 和固定生产依赖；用户不执行 npm/pnpm install、不本地构建、不下载 Playwright Chromium。启动器校验当前 Node 和产物完整性，不切换 Node、不修改 PATH，不通过下载缓存复制修补缺失产物。

运行时及依赖随 `runtime.pack.gz` 交付，启动器将校验通过的内容离线展开到用户的 `~/.cdphelper/runtimes/`。仓库和插件安装目录不保存展开的 node_modules；产物损坏时重新安装完整的同版本插件，不让 Agent 在线安装缺失依赖。

Codex：

```sh
codex plugin marketplace add itMrBoy/cdpHelper --ref main
codex plugin add cdphelper@cdphelper-plugins
```

Claude Code：

```text
/plugin marketplace add itMrBoy/cdpHelper
/plugin install cdphelper@cdphelper-plugins
```

上述命令用于 cdpHelper 发布完成后的安装；当前远端分支与 Release 尚未发布，不能作为已经可用的安装承诺。安装后打开新会话，确认插件技能和 `cdphelper` MCP 服务已加载；仅复制技能不会安装服务。Codex 可能以 `cdphelper:cdphelper` 返回插件技能名。移除旧的独立同名技能可避免规则混用。

## 扩展单独安装

计划在 **cdpHelper Release** 的 `v0.1.1` tag 提供 `cdphelper-extension-v0.1.1.zip`（当前尚未发布）。发布后获取与插件版本匹配的独立扩展 ZIP，用户自行解压到稳定目录。在要控制的雪诺 profile 中打开扩展管理页（通常为 `chrome://extensions`），开启开发者模式，点击“加载已解压的扩展”，选择 **解压结果内含 `manifest.json` 的 `extension/` 子目录**，不要选择 ZIP 根目录。已有扩展更新时，由用户替换 Release 文件并手动重载。

多个普通 profile 可加载同一份扩展文件；身份和连接配置由每个 profile 的扩展 storage 保存。插件不会接收本机扩展目录、下载扩展、从缓存复制扩展或向公共扩展目录写入连接凭据，也没有 `configure_extension` 工具。

Computer Use 可启动雪诺，但不用于安装扩展或后续网页操作。浏览器/管理员禁止扩展或 `chrome.debugger` 时，插件不绕过该限制。

## 选择与连接

每个会话首次使用必须先调用 `browser_status`，展示已有实例的名称、短编号与状态，再在同一个问题中提供“选择已有实例”及“启动新的隔离实例”选项。不能先泛问模式再读取 inventory。读取清单不等于已选择或连接浏览器。

所有 profile 使用统一的本机入口 **`127.0.0.1:29393/bridge`** 登记实例，不能用不同目录的扩展副本充当实例识别。

- **复用**：inventory 以短编号展示多个已登记普通 profile；用户选定后，技能映射为 UUID，调用 `browser_select`，参数为 `{mode:"reuse", instance_id:"<UUID>"}`。没有登记实例时检查目标 profile 是否安装并启用了 Release 扩展，不自动选择别的浏览器。
- **隔离**：调用 `browser_select`，参数为 `{mode:"isolated"}`，可选实际雪诺 `executable`。运行时启动独立 profile，通过一次性启动关联 URL 识别对应扩展；用户仍须在该 profile 手动加载扩展。不会复制现有 cookies、网站存储或已有 profile，不保证雪诺原生账号或系统级状态隔离。启动 URL 只是关联提示，雪诺可能退出新进程或把 URL 合并到原有窗口；不能仅凭 URL、扩展接入或成功 spawn 宣称真实隔离。

接入带隔离 nonce 的扩展及每次自有实例页面操作前，Broker 校验存活进程的真实 executable 与精确 profile 参数，并复用目录和 owner marker 检查；失败会 detach，不发送页面操作。当前进程核验只在 Windows 实现，其他平台返回不可验证并拒绝隔离操作，复用模式不受影响。真实雪诺隔离验收尚未通过。

pending 的 `launch_process_running` 为 true 且状态为 `waiting_for_extension` 时，按指引加载扩展；`launch_exited_unverified` 表示启动进程已退出、可能合并或无法证明归属，先询问保留还是清理这次尝试，不自动改用原有实例。

隔离所有权记录 ID 在保留及清理期间稳定；每次扩展重连都会产生新的连接 UUID。`browser_select` 使用当前 inventory 的连接 UUID，`browser_cleanup_retained` 使用 retained 记录的 `instance_id`，不能互换。

端口监听、profile 登记、实例连接和页面可操作分别验证。profile 重连不能使旧 tab 引用恢复有效：断连后重新显示 inventory，由用户明确选择并重新绑定，不自动 rebind 或重放有副作用的操作。

## 升级、结束与故障

插件按整体产物升级，扩展 ZIP 独立更新并由用户重载。升级后的新会话或重新加载使用新版本；活动旧会话不强制中断。插件校验失败时重新安装完整同一版本，不在线安装缺失依赖或静默换版本。服务文件、记录和日志位于用户自己的 `~/.cdphelper/`，不修改用户项目。

隔离结束前询问是否关闭并清理。用户拒绝、未答复或异常断开时保留窗口和 profile；后续状态显示保留记录，再明确确认后清理。只清理插件创建并核验归属的实例。复用浏览器和标签页始终保留。最后一个客户端退出后后台空闲回收，不自动关闭用户浏览器。

端口被其他程序占用时报告占用，不结束未知进程。扩展未登记时核对安装 profile、启用状态和版本；实例失联时重新选择。MCP 日志写标准错误或用户日志，不能混入 stdio 协议输出。Node 缺失或低于22时由用户处理，不自动切换全局环境。

## 源码开发与兼容入口

源码开发者在 ModCDP 仓库使用：

```sh
pnpm install --frozen-lockfile
pnpm run build:plugin
pnpm run test:plugin
```

`build:plugin` 独立于子模块生成完整的 `dist/plugin-marketplace/`；独立扩展 ZIP 用于 cdpHelper Release。技能源码位于 `plugin/skills/cdphelper/`，清单由主仓构建器生成。源码、测试和开发依赖不下发到插件运行目录。

维护者提交干净源码并确认 `cdpHelper/` 子模块已初始化、工作区干净后，可运行 `pnpm run deliver:plugin`：构建并校验正式候选，仅更新子仓的 `.agents/plugins/marketplace.json`、`.claude-plugin/marketplace.json` 和 `plugins/cdphelper/`，不覆盖子仓 README 或 Git 数据。命令不自动提交或推送。随后核验并提交分发仓库，最后更新父仓指针；产物记录实际源码构建提交，不为追平指针提交而反复重建。不发布自有 npm 包。

独立 checkout 的 `pnpm run proxy-existing` 与 `node plugin/skills/cdphelper/scripts/run.mjs --repo <源码目录>` 保留兼容；该 runner 仅供源码开发，不随插件交付。它使用固定客户端端口9223、扩展端口29292，同一代理只允许一个 CDP 客户端顺序接入；该入口不提供插件的29393多 profile 登记、会话选择和隔离管理。

ModCDP 上游尚未提供明确许可证；插件格式和测试通过不代表取得分发授权，不为上游代码虚构许可证。对外分发授权及第三方许可证义务需要另行核对。
