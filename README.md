# cdpHelper

[English](README.md) | [简体中文](README.zh-CN.md)

cdpHelper distributes a browser automation plugin and its separate browser extension. The plugin provides skills and a local MCP runtime for operating Snow Browser through Playwright. Implementation source is maintained in [ModCDP](https://github.com/itMrBoy/ModCDP).

## Requirements

- Node.js 22 or later, available to the host application's local executor.
- Snow Browser with browser extensions and `chrome.debugger` permitted.
- A host that supports the supplied plugin and marketplace manifests and can run local MCP processes.

Plugin users do not run npm or pnpm install, build source, or download a Playwright browser. The plugin includes compiled JavaScript and production dependencies in `runtime.pack.gz`. Its pure-Node launcher verifies the package and prepares the runtime offline in the user's cache; it does not install npm packages or download missing dependencies. Node.js and Snow Browser are installed separately. No unpacked `node_modules` directory is committed to this repository.

## Install the plugin

Use this repository's `main` branch as the plugin marketplace and select `cdphelper` in your host. The marketplace entries resolve to `plugins/cdphelper`. This distribution repository does not contain a source submodule. ModCDP instead references this repository through its root `cdpHelper/` submodule.

The plugin and the browser extension are separate installations. Installing the plugin does not install, download, cache, or copy the browser extension, and the plugin does not accept an extension installation directory.

The current local candidate is **0.1.1**, with extension **0.1.1** and bridge protocol **2**, built from clean ModCDP source commit A, `8fe202edac3f53574d8c1040273608db8654d70a` (`source_dirty: false`). It has not been published: the remote marketplace has no `main` branch or Release yet, and the source changes have not been pushed. GitHub installation and Release downloads become available only after a separately authorized publication.

For local host validation, use this repository as the marketplace. It contains the complete plugin without requiring a source checkout or submodule initialization. Use isolated host configuration directories; no global plugin replacement is required. Host installation and runtime compatibility are separate checks and are not established by the artifact hashes.

## Connect a browser

1. Start the plugin and list the available browser instances with `browser_status`.
2. Choose an existing instance with `browser_select`, or request a new isolated Snow Browser instance subject to the ownership checks below. The skill presents both choices before page operations. Real Snow isolated launching has not passed acceptance.
3. If the target browser has no compatible extension, download the matching extension ZIP from [cdpHelper Releases](https://github.com/itMrBoy/cdpHelper/releases), once published. Read the installation instructions inside the ZIP. In the **target browser and profile**, open `chrome://extensions`, enable Developer mode, and load the extracted **`extension/` directory containing `manifest.json`**, rather than the ZIP root. A profile may already receive the extension through Snow Browser provisioning; enable that copy if compatible.
4. List instances again. Match the unique short number displayed by the extension to the instance reported by the plugin, then select the intended instance and bind the tab you want to operate.

The extension uses the local entry point `ws://127.0.0.1:29393/bridge` to register running instances. Open its options page to see its name, unique short number, and connection state. Multiple existing Snow Browser profiles can connect concurrently; users do not configure a different port for each profile. An extension ID shared across profiles is not a browser instance ID. Each connection gets a fresh UUID `instance_id`, with its first eight hexadecimal characters as `short_id`. On disconnect, old connection and tab references become invalid; list and select the connected instance again.

If the extension is missing, the MCP service can still start and report setup guidance. It never starts a browser or selects an existing one without the user's choice. Explicitly choosing an isolated instance attempts a launch and returns `pending_isolation`. Its `launch_process_running` flag reports whether a matching profile process is verified. State `waiting_for_extension` means to install or enable the extension in that window and keep its initialization tab open. State `launch_exited_unverified` means that the launcher may have exited or merged into an existing browser: isolation has not been established, and the plugin does not select another browser as a fallback. Installing the extension in a different browser or profile does not connect the intended target.

An isolated browser is associated through a one-time local URL opened at startup, rather than by the order in which extensions connect. Its stable ownership ID (`owned_instance_id`) identifies the created profile and is distinct from the live connection UUID. The extension must be available in that isolated profile as well. Existing browser profiles and their login state are not copied into isolated profiles.

The one-time URL alone does not prove isolation: Snow may forward it into an existing window. On Windows, accepting an isolated connection requires the plugin's ownership marker and a running process matching the intended executable and exact `--user-data-dir` profile; the PID may change. The plugin repeats this check before each page operation on an owned instance. If ownership cannot be verified, it detaches and sends no page operation. Non-Windows systems and failed process probes remain unverified. An open window or a connected extension is insufficient to establish isolation.

Release download URLs, extracted directories, and plugin installation directories are not MCP configuration inputs. Follow the ZIP instructions to install in the target browser. Close or clean an isolated profile only after an explicit user choice; existing browser windows and tabs are preserved.

## Browser extension downloads

The extension is distributed only as a separate ZIP attached to a [cdpHelper Release](https://github.com/itMrBoy/cdpHelper/releases). For this candidate, the planned attachment is `cdphelper-extension-v0.1.1.zip` under tag `v0.1.1`. The ZIP contains English and Chinese installation instructions and an `extension/` directory containing `manifest.json`, compiled extension files, and `cdphelper-bridge.json` build information. It does not contain per-instance tokens or connection configuration.

Use the extension version compatible with the plugin candidate or release, as specified by its build metadata and release notes. The plugin does not silently download an extension or switch to another browser when setup fails.

## Repository layout

```text
.agents/plugins/marketplace.json   Marketplace entry
.claude-plugin/marketplace.json   Marketplace entry
plugins/cdphelper/                Complete installable plugin
  skills/                        Browser workflow skills
  runtime.pack.gz                Compiled runtime, dependencies, and licenses
README.md
README.zh-CN.md
```

The marketplace manifests and plugin files belong to the same fixed candidate: 15 marketplace files, including 13 plugin files (12 inventoried files plus `artifact.json`). The gzip runtime package contains 1,930 files, including production dependencies and their licenses. `artifact.json` records external artifact hashes as well as runtime file hashes and modes; the launcher verifies paths and content before preparing the runtime. The Git tree contains no unpacked `runtime/` or `node_modules/` directory. Build metadata records the source commit; this repository does not point back to ModCDP through a gitlink. The plugin contains no browser extension, extension ZIP, automatic extension downloader, or legacy source-checkout runner. Git attributes preserve the exact bytes of the marketplace and plugin artifacts.

The runtime stores its unpacked files, logs, and isolated profiles in `~/.cdphelper`. Dependency licenses remain inside the package and beside dependencies in that local cache. Previous `~/.snow-browser` data is retained for rollback; browser instances and profiles are not automatically migrated or cleaned.

## Maintenance and validation

ModCDP owns the implementation, split plugin/extension builds, candidate export, and future candidate-branch PR tooling. cdpHelper owns the marketplace layout, user documentation, and candidate consistency checks. Build from a fixed clean source commit and preserve its version, protocol, source commit, and file-digest metadata when importing the candidate.

The repository dependency runs in one direction: ModCDP has a root `cdpHelper/` submodule with URL `https://github.com/itMrBoy/cdpHelper.git`, pinned to a distribution commit. Maintainers obtain implementation source from ModCDP, while plugin users install this distribution repository directly. Source and distribution commits must be available from their respective remotes before public distribution.

The release sequence is source commit A, a clean-source build recording A, distribution commit B containing that candidate, and then ModCDP commit C pinning B. The parent gitlink and documentation bookkeeping in C do not require rewriting the candidate's `source_commit` from A to C; this avoids a circular build provenance dependency.

Import and validate candidates locally before committing them. Distribution updates are intended to arrive through candidate branches and PRs to `main`. Local preparation does not push changes, open a remote PR, create a Release, or change repository visibility.

The distribution `main` starts with a clean initial commit whose reachable history has no unpacked `node_modules` paths. Earlier local history containing those files is preserved under a local backup reference, outside the ancestry of the distribution `main`. Keep that backup local; do not push backup refs or use `git push --all` or `git push --mirror` when publishing this repository.

Artifact verification and automated tests do not establish host installation or real Snow Browser compatibility. Record host discovery/MCP startup and browser page-operation results separately, including multiple existing profiles and isolated instances.

The final packed A candidate passed the full plugin suite 7/7, with no failures or skips, including multi-profile Chromium fixtures, bridge validation, isolated ownership checks, offline shared-daemon startup, packed artifact integrity and tamper/path rejection, and active-session upgrade protection. Import verified its clean-source metadata, all 15 marketplace files, every packed runtime file hash and mode, licenses, runtime digest, and separate extension ZIP. The launcher check also passed: `node plugins/cdphelper/launch.mjs --check`. Existing Chrome 131 protocol-schema warnings did not fail the tests. This is not real Snow acceptance. Existing JS session-close failures were previously reproduced against the unchanged baseline; the full JS suite is not green.

Final host acceptance passed on 2026-10-29 using fresh independent `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, and `USERPROFILE`, without prewarming the runtime or changing MCP timeouts. Codex enabled the user-scoped `cdphelper:cdphelper` skill and loaded all 15 MCP tools with no tool error or host stderr. Claude showed one skill, one MCP server, and Connected within its default 30-second timeout; the complete MCP health command took 5,725 ms, which is not an isolated runtime-preparation measurement. Both installed caches contained 13 files and matched artifact SHA-256 `fd56e33c032c66da4d22b64a7a02cfa53dd6091a94b2e61d1978ddc0da22123f`, with no unpacked `node_modules`, extension, ZIP, source checkout, or legacy runner. Git traces showed no submodule initialization or update. Claude marketplace validation passed with installation-line advice only. Global plugin replacement remains outside this repository-direction migration. These checks do not establish real Snow page-operation acceptance.

An earlier unpacked-runtime candidate installed successfully but exceeded Claude's default 30-second MCP startup timeout during staging. The packed-runtime candidate above replaced it and passed fresh host acceptance. Earlier copy benchmarks are not measurements of the new gzip preparation path.

**Real Snow isolation has not passed acceptance and independent isolated launching is not guaranteed.** In the live test, both launched profile processes exited or merged despite the user not closing them, so the windows and extension registrations could not establish ownership. The two test profiles were subsequently cleaned up with explicit user approval; existing browser roots were preserved. This failure concerns isolated launching, not the multiple-existing-instance reuse design; it does not establish real Snow page-operation acceptance for either mode.
