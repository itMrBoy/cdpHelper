// No application dependencies are imported before the Node compatibility check.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir, rename, stat } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

function inside(root, relative) {
  const file = path.resolve(root, relative);
  if (
    !relative ||
    path.isAbsolute(relative) ||
    relative.includes("\\") ||
    !file.startsWith(`${path.resolve(root)}${path.sep}`)
  ) {
    throw new Error("Invalid artifact path");
  }
  return file;
}

async function verify(root, inventory) {
  for (const [relative, expected] of Object.entries(inventory)) {
    const file = inside(root, relative);
    const actual = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
    if (actual !== expected) throw new Error(`Plugin artifact checksum mismatch: ${relative}. Reinstall the plugin.`);
  }
}
async function main() {
  if (Number(process.versions.node.split(".")[0]) < 22) {
    throw new Error(
      `Node >=22 is required; current ${process.version} (${process.execPath}). Select a compatible Node yourself. This plugin does not switch Node or change PATH.`,
    );
  }
  const root = path.dirname(fileURLToPath(import.meta.url));
  const inventory = JSON.parse(await readFile(path.join(root, "artifact.json"), "utf8"));
  const homeIndex = process.argv.indexOf("--home");
  const home = path.resolve(homeIndex >= 0 ? process.argv[homeIndex + 1] : path.join(homedir(), ".cdphelper"));
  await verify(root, inventory.files);
  if (process.argv.includes("--check")) {
    process.stdout.write(
      JSON.stringify({ version: inventory.version, valid: true, node: process.version, executable: process.execPath }) +
        "\n",
    );
    return;
  }
  const versions = path.join(home, "runtimes");
  const runtimeFiles = inventory.runtime_files;
  if (!runtimeFiles || !Object.keys(runtimeFiles).length)
    throw new Error("Missing runtime inventory. Reinstall the plugin.");
  for (const relative of Object.keys(runtimeFiles)) inside(versions, relative);
  await mkdir(versions, { recursive: true, mode: 0o700 });
  const installed = path.join(versions, `${inventory.version}-${inventory.digest.slice(0, 16)}`);
  try {
    await stat(installed);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const staging = path.join(versions, `.staging-${randomUUID()}`);
    const payload = JSON.parse(
      gunzipSync(await readFile(path.join(root, "runtime.pack.gz")), { maxOutputLength: 256 * 1024 * 1024 }).toString(
        "utf8",
      ),
    );
    const files = Object.keys(runtimeFiles);
    if (Object.keys(payload).length !== files.length) throw new Error("Packed runtime inventory mismatch.");
    const directories = [...new Set(files.map((file) => path.dirname(path.join(staging, file))))];
    await Promise.all(directories.map((directory) => mkdir(directory, { recursive: true })));
    // Materialize verified files locally; the plugin Git tree contains no node_modules directory.
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(16, files.length) }, async () => {
        while (next < files.length) {
          const file = files[next++];
          if (typeof payload[file] !== "string") throw new Error(`Packed runtime is missing ${file}`);
          const bytes = Buffer.from(payload[file], "base64");
          if (createHash("sha256").update(bytes).digest("hex") !== runtimeFiles[file]) {
            throw new Error(`Packed runtime checksum mismatch: ${file}`);
          }
          const mode = inventory.runtime_modes?.[file];
          if (!Number.isInteger(mode) || mode < 0 || mode > 0o777)
            throw new Error(`Invalid runtime file mode: ${file}`);
          await writeFile(inside(staging, file), bytes, { mode });
        }
      }),
    );
    try {
      await rename(staging, installed);
    } catch (renameError) {
      if (!["EEXIST", "ENOTEMPTY", "EPERM"].includes(renameError.code)) throw renameError;
      await stat(installed);
    }
  }
  await verify(installed, runtimeFiles);
  await import(pathToFileURL(path.join(installed, "cli.mjs")).href);
}
main().catch((error) => {
  console.error(`cdpHelper: ${error.message}`);
  process.exitCode = 1;
});
