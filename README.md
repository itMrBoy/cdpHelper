# cdpHelper

[English](README.md) | [简体中文](README.zh-CN.md)

cdpHelper distributes a browser automation plugin and its separate browser extension. The plugin provides skills and a local MCP runtime for operating Snow Browser through Playwright. Implementation source is maintained in [ModCDP](https://github.com/itMrBoy/ModCDP).

## Requirements

- Node.js 22 or later, available to the host application's local executor.
- Snow Browser with browser extensions and `chrome.debugger` permitted.
- A host that supports the supplied plugin and marketplace manifests and can run local MCP processes.

Plugin users do not run npm or pnpm install, build source, or download a Playwright browser. The plugin includes compiled JavaScript and production dependencies in `runtime.pack.gz`. Its pure-Node launcher verifies the package and prepares the runtime offline in the user's cache; it does not install npm packages or download missing dependencies. Node.js and Snow Browser are installed separately. No unpacked `node_modules` directory is committed to this repository.

## Install the plugin

Use [itMrBoy/cdpHelper](https://github.com/itMrBoy/cdpHelper) on branch `main` as the plugin marketplace and install `cdphelper@cdphelper-plugins` in your host. The marketplace entries resolve to `plugins/cdphelper`. This distribution repository does not contain a source submodule. ModCDP instead references this repository through its root `cdpHelper/` submodule.

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

The plugin and the browser extension are separate installations. Installing the plugin does not install, download, cache, or copy the browser extension, and the plugin does not accept an extension installation directory.

Plugin and extension versions must match the compatibility metadata. Version **0.1.1** uses extension **0.1.1** and bridge protocol **2**. Check the installed plugin's `artifact.json` and the matching Release notes and manifest for build provenance and compatible extension downloads. Only use attachments that are actually listed on the matching Release; do not infer Release availability from the marketplace version.

The plugin installs without a source checkout or submodule initialization. Maintainers can also validate a local marketplace checkout using isolated host configuration directories. Host installation and runtime compatibility are separate checks and are not established by artifact hashes.

## Connect a browser

1. Start the plugin and list the available browser instances with `browser_status`.
2. Choose an existing instance with `browser_select`, or request a new isolated Snow Browser instance subject to the ownership checks below. The skill presents both choices before page operations. Real Snow isolated launching has not passed acceptance.
3. If the target browser has no compatible extension, download the matching extension ZIP from [cdpHelper Releases](https://github.com/itMrBoy/cdpHelper/releases). Read the installation instructions inside the ZIP. In the **target browser and profile**, open `chrome://extensions`, enable Developer mode, and load the extracted **`extension/` directory containing `manifest.json`**, rather than the ZIP root. A profile may already receive the extension through Snow Browser provisioning; enable that copy if compatible.
4. List instances again. Match the unique short number displayed by the extension to the instance reported by the plugin, then select the intended instance and bind the tab you want to operate.

The extension uses the local entry point `ws://127.0.0.1:29393/bridge` to register running instances. Open its options page to see its name, unique short number, and connection state. Multiple existing Snow Browser profiles can connect concurrently; users do not configure a different port for each profile. An extension ID shared across profiles is not a browser instance ID. Each connection gets a fresh UUID `instance_id`, with its first eight hexadecimal characters as `short_id`. On disconnect, old connection and tab references become invalid; list and select the connected instance again.

If the extension is missing, the MCP service can still start and report setup guidance. It never starts a browser or selects an existing one without the user's choice. Explicitly choosing an isolated instance attempts a launch and returns `pending_isolation`. Its `launch_process_running` flag reports whether a matching profile process is verified. State `waiting_for_extension` means to install or enable the extension in that window and keep its initialization tab open. State `launch_exited_unverified` means that the launcher may have exited or merged into an existing browser: isolation has not been established, and the plugin does not select another browser as a fallback. Installing the extension in a different browser or profile does not connect the intended target.

An isolated browser is associated through a one-time local URL opened at startup, rather than by the order in which extensions connect. Its stable ownership ID (`owned_instance_id`) identifies the created profile and is distinct from the live connection UUID. The extension must be available in that isolated profile as well. Existing browser profiles and their login state are not copied into isolated profiles.

The one-time URL alone does not prove isolation: Snow may forward it into an existing window. On Windows, accepting an isolated connection requires the plugin's ownership marker and a running process matching the intended executable and exact `--user-data-dir` profile; the PID may change. The plugin repeats this check before each page operation on an owned instance. If ownership cannot be verified, it detaches and sends no page operation. Non-Windows systems and failed process probes remain unverified. An open window or a connected extension is insufficient to establish isolation.

Release download URLs, extracted directories, and plugin installation directories are not MCP configuration inputs. Follow the ZIP instructions to install in the target browser. Close or clean an isolated profile only after an explicit user choice; existing browser windows and tabs are preserved.

## Browser extension downloads

The extension is distributed only as a separate ZIP attached to a [cdpHelper Release](https://github.com/itMrBoy/cdpHelper/releases). Choose the matching version tag and download its `cdphelper-extension-v<version>.zip` attachment. The ZIP contains English and Chinese installation instructions and an `extension/` directory containing `manifest.json`, compiled extension files, and `cdphelper-bridge.json` build information. It does not contain per-instance tokens or connection configuration.

Use the extension version compatible with the plugin version, as specified by its build metadata and release notes. The plugin does not silently download an extension or switch to another browser when setup fails.

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

The marketplace manifests and plugin files form one versioned distribution: 15 marketplace files, including 13 plugin files (12 inventoried files plus `artifact.json`). The gzip runtime package contains 1,930 files, including production dependencies and their licenses. `artifact.json` records external artifact hashes as well as runtime file hashes and modes; the launcher verifies paths and content before preparing the runtime. The Git tree contains no unpacked `runtime/` or `node_modules/` directory. Build metadata records the source commit; this repository does not point back to ModCDP through a gitlink. The plugin contains no browser extension, extension ZIP, automatic extension downloader, or legacy source-checkout runner. Git attributes preserve the exact bytes of the marketplace and plugin artifacts.

The runtime stores its unpacked files, logs, and isolated profiles in `~/.cdphelper`. Dependency licenses remain inside the package and beside dependencies in that local cache. Previous `~/.snow-browser` data is retained for rollback; browser instances and profiles are not automatically migrated or cleaned.

## Maintenance and validation

ModCDP owns all plugin release inputs, the implementation, split plugin/extension builds, and delivery tooling. The skill source is `plugin/skills/cdphelper` in ModCDP. This repository's two marketplace manifests and `plugins/cdphelper` are generated outputs: change their inputs in ModCDP and regenerate them rather than editing the distribution files by hand. cdpHelper maintains its bilingual user documentation and verifies candidate consistency. Preserve the version, protocol, source commit, and file-digest metadata when importing a candidate.

Run `pnpm build:plugin` in ModCDP to build the plugin independently from source; this build does not require or update the distribution submodule. Run `pnpm deliver:plugin` in ModCDP to deliver from clean source into an already initialized, clean `cdpHelper/` submodule. Delivery runs only from source to distribution and updates only `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, and the complete `plugins/cdphelper` directory. It does not commit or push changes automatically. Review and validate the delivered files before making a separate distribution commit.

The plugin includes its compiled runtime and production dependencies in `runtime.pack.gz`, which the launcher verifies and unpacks offline into the user's cache. Users do not install npm packages. The browser extension remains a separate Release ZIP and is not delivered into the plugin.

The repository dependency runs in one direction: ModCDP has a root `cdpHelper/` submodule with URL `https://github.com/itMrBoy/cdpHelper.git`, pinned to a distribution commit. Maintainers obtain implementation source from ModCDP, while plugin users install this distribution repository directly. Source and distribution commits must be available from their respective remotes before public distribution.

The release sequence is source commit A, a clean-source build recording A, distribution commit B containing that candidate, and then ModCDP commit C pinning B. The parent gitlink and documentation bookkeeping in C do not require rewriting the candidate's `source_commit` from A to C; this avoids a circular build provenance dependency.

Build and validate from clean source, deliver into a clean initialized distribution submodule, and submit the generated files and documentation through a candidate branch and PR to this repository's `main`. After merging, pin the actual merged distribution commit B in ModCDP. Building and delivering do not publish a Release automatically.

Release automation is maintained in ModCDP; this distribution repository has no workflow of its own. Once deployed and configured, it handles `pull_request_target` events of type `closed` only for merged PRs targeting ModCDP `main`. It verifies that source A is an ancestor of source `main` and distribution B is already merged into distribution `main`. A fixed concurrency group with `queue: max` serializes the entire pipeline. The `v<version>` tag pins B from the parent gitlink. CI reads A from B's `artifact.json` `source_commit`, checks out A to build the separate extension ZIP, and records B's actual plugin hashes and runtime digest in the final release manifest. It does not commit a replacement plugin.

Release notes are generated in Chinese and include the version, source provenance, plugin installation instructions, and separate extension installation instructions. The first release summarizes its initial source; later releases compare source commits against the previous stable release manifest, excluding prereleases from baseline selection. An already published same-version release is skipped only after validating its original manifest and tag against the original distribution B; a later README-only distribution commit does not move that tag. A published prerelease occupying the same tag is rejected rather than overwritten. New releases are prepared as drafts, receive the extension ZIP, `release-manifest.json`, and `SHA256SUMS`, and are published only after all three attachments are present.

Release prerequisites: source A and distribution B must be available and merged into their respective remote `main` branches, and ModCDP must have the `CDPHELPER_RELEASE_TOKEN` secret configured. Restrict the token to the cdpHelper repository with Contents read/write permission. Check the workflow result and the matching Release page to establish whether publication succeeded; local preparation and stubbed command simulations alone do not establish a published release.

The distribution `main` starts with a clean initial commit whose reachable history has no unpacked `node_modules` paths. Earlier local history containing those files is preserved under a local backup reference, outside the ancestry of the distribution `main`. Keep that backup local; do not push backup refs or use `git push --all` or `git push --mirror` when publishing this repository.

Artifact verification and automated tests do not establish host installation or real Snow Browser compatibility. Record host discovery/MCP startup and browser page-operation results separately, including multiple existing profiles and isolated instances.

Build provenance: clean source A `dd5cb1468a986a9442053d07b0376d6f64d1556a` (`source_dirty: false`), artifact SHA-256 `5aa3f052cd1205bbbfa05c07b00cb8074bdc6069dd7e01951ba52336b747e1be`. All 15 imported marketplace files match the delivered build byte for byte. Packed runtime hashes, modes, provenance, licenses, and the separate extension ZIP have been verified; `node plugins/cdphelper/launch.mjs --check` passed.

Validation for this build: all 61 local tests passed with zero skips using matched Chromium 148, including 37 release-publishing simulations, four Chinese-release-note tests, browser registration/reload and ownership checks, and offline packed-runtime tests. The browser fixture explicitly enables Developer mode before reloading its unpacked extension. These local results do not assert that the final remote CI pipeline is green. Browserbase live tests require separate credentials and are not covered by this acceptance. Cross-checkout line-ending settings may affect artifact bytes; byte-reproducible builds are not claimed.

On 2026-10-29, serial host acceptance in completely new `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, and `USERPROFILE` directories passed against this build in ModCDP's distribution submodule. No runtime was prewarmed and no timeout was changed. Codex enabled `cdphelper:cdphelper` and loaded all 15 MCP tools with no tool error or host stderr. Claude showed one skill and one MCP server and Connected within its default 30 seconds; the complete health command took 8,228 ms, not a separate materialization measurement. Both caches contained 13 files and matched the artifact SHA-256 above, with no extension, ZIP, unpacked dependencies, source checkout, or legacy runner. Git traces showed no submodule initialization/update. Claude marketplace validation passed with installation-line advice. Earlier cold-start failures and retries in reused configurations are excluded from this result. These checks do not establish real Snow page-operation acceptance.

**Real Snow isolation has not passed acceptance and independent isolated launching is not guaranteed.** Launched profile processes may exit or merge into existing browser processes, so a window or extension registration does not establish ownership. The guards reject operations when isolation cannot be verified. Multiple-existing-instance reuse remains available by design; the automated and host checks above do not establish real Snow page-operation acceptance for either mode.