import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extension = process.platform === "win32" ? ".exe" : "";
const localGo = join(root, ".tools", "go", "bin", `go${extension}`);
const go = existsSync(localGo) ? localGo : "go";
const options = {
  cwd: join(root, "backend"),
  stdio: "inherit",
  env: {
    ...process.env,
    GOCACHE: process.env.GOCACHE || join(root, ".cache", "go-build"),
    GOMODCACHE: process.env.GOMODCACHE || join(root, ".cache", "go-mod"),
  },
};
let args = process.argv.slice(2);
let executable = go;
if (args[0] === "fmt-check") {
  const gofmt = existsSync(localGo) ? join(dirname(localGo), `gofmt${extension}`) : "gofmt";
  const result = spawnSync(gofmt, ["-l", "cmd", "internal"], { ...options, stdio: "pipe", encoding: "utf8" });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0 || result.stdout.trim()) {
    console.error(result.stderr || `Run gofmt on:\n${result.stdout}`);
    process.exit(1);
  }
  process.exit(0);
}
if (args[0] === "build-app") {
  mkdirSync(join(root, "artifacts"), { recursive: true });
  args = ["build", "-o", join(root, "artifacts", `orchestrator${extension}`), "./cmd/orchestrator"];
}
if (args[0] === "start") {
  executable = join(root, "artifacts", `orchestrator${extension}`);
  args = [];
}
const result = spawnSync(executable, args, options);
if (result.error) {
  console.error(`Could not start ${executable}: ${result.error.message}`);
  console.error("Install Go 1.26+ (or extract it to .tools/go). For production, run npm run build first.");
}
process.exit(result.status ?? 1);
