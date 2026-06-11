import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

const staticPath =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function resolveStaticFile(urlPath = "/") {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0] || "/");
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = normalizedPath === "/" ? "/index.html" : normalizedPath;
  const fullPath = path.resolve(staticPath, `.${requestedPath}`);

  if (!fullPath.startsWith(staticPath)) {
    return null;
  }

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }

  return path.join(staticPath, "index.html");
}

function openBrowser(url: string) {
  if (process.env.SPACE_PLANNER_NO_BROWSER === "1") return;

  const command =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  import("node:child_process").then(({ exec }) => {
    exec(command);
  });
}

function startServer(port: number) {
  const server = createServer((req, res) => {
    if (req.url?.startsWith("/api/")) {
      res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Cloud APIs are not available in local installer mode." }));
      return;
    }

    const filePath = resolveStaticFile(req.url);
    if (!filePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500);
        res.end("Failed to read application file.");
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": contentTypes[extension] || "application/octet-stream",
        "Cache-Control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=31536000, immutable",
      });
      res.end(content);
    });
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE" && port < DEFAULT_PORT + 20) {
      startServer(port + 1);
      return;
    }

    console.error("Failed to start Space Planner Studio:", error.message);
    process.exit(1);
  });

  server.listen(port, HOST, () => {
    const url = `http://${HOST}:${port}/`;
    console.log(`Space Planner Studio running at ${url}`);
    openBrowser(url);
  });
}

if (!fs.existsSync(path.join(staticPath, "index.html"))) {
  console.error(`Built application files were not found at ${staticPath}`);
  process.exit(1);
}

startServer(DEFAULT_PORT);
