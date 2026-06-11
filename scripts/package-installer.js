import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const script = path.join(__dirname, "package-installer.ps1");
const powershell = process.platform === "win32" ? "powershell.exe" : "pwsh";

function runPnpmBuild() {
  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "pnpm run build"], {
      stdio: "inherit",
      cwd: projectRoot,
    });
    return;
  }

  execFileSync("pnpm", ["run", "build"], {
    stdio: "inherit",
    cwd: projectRoot,
  });
}

try {
  runPnpmBuild();

  execFileSync(powershell, ["-ExecutionPolicy", "Bypass", "-File", script], {
    stdio: "inherit",
    cwd: projectRoot,
  });
} catch (error) {
  console.error("Packaging failed:", error);
  process.exit(error.status || 1);
}
