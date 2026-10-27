import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
const inside = (root, file) => {
  const path = relative(root, file);
  return !isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`);
};

// Serve only the build output. Never expose source files, local inventory, or
// browser records. This is a local preview server, not an authentication layer.
export async function createPreviewServer({ root = resolve(projectRoot, "dist"), base = "/" } = {}) {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) throw new Error("Base path must start and end with /, for example /benchwork/.");
  root = await realpath(root);
  await stat(resolve(root, "index.html"));
  return createServer(async (request, response) => {
    const respond = (status, body) => {
      response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      response.end(body);
    };
    if (!["GET", "HEAD"].includes(request.method)) {
      response.setHeader("Allow", "GET, HEAD");
      respond(405, "Method not allowed");
      return;
    }
    try {
      const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      if (base !== "/" && path === base.slice(0, -1)) {
        response.writeHead(308, { Location: base });
        response.end();
        return;
      }
      if (!path.startsWith(base) || path.includes("\\") || path.includes("\0")) return respond(404, "Not found");
      const parts = path.slice(base.length).split("/");
      if (parts.some((part) => part.startsWith("."))) return respond(404, "Not found");
      const file = await realpath(resolve(root, ...parts, ...(path.endsWith("/") ? ["index.html"] : [])));
      if (!inside(root, file) || !(await stat(file)).isFile()) return respond(404, "Not found");
      const body = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Content-Length": body.length,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      respond(error instanceof URIError ? 400 : 404, error instanceof URIError ? "Invalid URL" : "Not found");
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
    const port = Number(option("--port", process.env.PORT || "4173"));
    const host = option("--host", "127.0.0.1");
    const base = option("--base", "/");
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Port must be an integer from 0 to 65535.");
    const server = await createPreviewServer({ base });
    server.on("error", (error) => {
      console.error(`Preview server failed: ${error.message}`);
      process.exitCode = 1;
    });
    server.listen(port, host, () => console.log(`Benchwork preview: http://${host}:${server.address().port}${base}`));
  } catch (error) {
    console.error(`Cannot start Benchwork: ${error.message}. Run npm run build first.`);
    process.exitCode = 1;
  }
}
