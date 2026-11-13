/* =====================================================================
   Local preview server — run:  node dev-server.mjs   → http://localhost:8080
   Serves the website AND a practice message wall (messages are kept in
   memory only, so they disappear when you stop the server). Online on
   Netlify, the real function in netlify/functions/messages.mjs is used.
   No npm install needed for this preview.
   ===================================================================== */

import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".mp4": "video/mp4", ".webm": "video/webm", ".enc": "application/octet-stream", ".txt": "text/plain" };

// In-memory store with the same methods as Netlify Blobs
const mem = new Map();
const memoryStore = {
  async get(key) { return mem.has(key) ? JSON.parse(mem.get(key)) : null; },
  async setJSON(key, v) { mem.set(key, JSON.stringify(v)); },
  async list({ prefix = "" } = {}) { return { blobs: [...mem.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
  async delete(key) { mem.delete(key); }
};

// Load the real function code, but with the memory store (the @netlify/blobs import is stubbed if not installed)
let handler;
try {
  const mod = await import("./netlify/functions/messages.mjs");
  handler = mod.createHandler(() => memoryStore, { GUESTBOOK_ADMIN_KEY: process.env.GUESTBOOK_ADMIN_KEY || "local-admin" });
} catch {
  const src = (await readFile(join(ROOT, "netlify/functions/messages.mjs"), "utf8"))
    .replace(/import \{ getStore \} from "@netlify\/blobs";/, "const getStore = () => { throw new Error('offline'); };");
  const mod = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  handler = mod.createHandler(() => memoryStore, { GUESTBOOK_ADMIN_KEY: process.env.GUESTBOOK_ADMIN_KEY || "local-admin" });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname === "/api/messages") {
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks);
      const r = await handler(new Request(url, { method: req.method, headers: req.headers, body }), { ip: req.socket.remoteAddress });
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (path.endsWith("/")) path += "index.html";
    const file = join(ROOT, path);
    if (!file.startsWith(ROOT) || !(await stat(file)).isFile()) throw new Error("404");
    const data = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }); res.end("Not found");
  }
}).listen(PORT, () => console.log(`\n  ❤  Open http://localhost:${PORT}  (Ctrl+C to stop)\n`));
