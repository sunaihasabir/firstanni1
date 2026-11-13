/* =====================================================================
   💌  MESSAGE WALL — Netlify Function  (served at /api/messages)
   ---------------------------------------------------------------------
   GET    /api/messages          → latest messages (everyone can read)
   POST   /api/messages          → { name, message } add a message
   DELETE /api/messages?id=...   → remove one (needs header x-admin-key)

   Messages are saved in Netlify Blobs (free, built into Netlify).
   To be able to delete unwanted messages, add an environment variable
   in Netlify: Site configuration → Environment variables →
   GUESTBOOK_ADMIN_KEY = (any secret word). Then open the website with
   ?admin=YOUR_SECRET at the end of the link to see 🗑 buttons.
   ===================================================================== */

import { getStore } from "@netlify/blobs";
import { createHash, randomBytes } from "node:crypto";

const MAX_NAME = 40;
const MAX_MESSAGE = 500;
const MAX_RETURNED = 150;
const COOLDOWN_MS = 20 * 1000; // one message per person every 20 seconds

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });

const clean = (v, max) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);

/** Build the handler around any store with get / setJSON / list / delete (Netlify Blobs API). */
export function createHandler(openStore, env = process.env) {
  return async (req, context = {}) => {
    const store = openStore();
    const url = new URL(req.url);

    if (req.method === "GET") {
      const { blobs } = await store.list({ prefix: "m/" });
      const keys = blobs.map((b) => b.key).sort().reverse().slice(0, MAX_RETURNED);
      const items = (await Promise.all(keys.map((k) => store.get(k, { type: "json" })))).filter(Boolean);
      return json({ messages: items });
    }

    if (req.method === "POST") {
      let body;
      try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
      if (body.website) return json({ ok: true }); // honeypot field filled → a bot; pretend success
      const name = clean(body.name, MAX_NAME) || "Someone special";
      const message = clean(body.message, MAX_MESSAGE);
      if (message.length < 2) return json({ error: "Please write a little message 💌" }, 400);

      const ip = context.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
      const ipKey = "rl/" + createHash("sha256").update("lanterns:" + ip).digest("hex").slice(0, 24);
      const last = await store.get(ipKey, { type: "json" });
      if (last && Date.now() - last.t < COOLDOWN_MS) return json({ error: "Thank you! Please wait a few seconds before sending another one 🙂" }, 429);
      await store.setJSON(ipKey, { t: Date.now() });

      const createdAt = new Date().toISOString();
      const id = createdAt.replace(/[^0-9]/g, "") + "-" + randomBytes(4).toString("hex");
      const item = { id, name, message, createdAt };
      await store.setJSON("m/" + id, item);
      return json({ ok: true, message: item }, 201);
    }

    if (req.method === "DELETE") {
      const admin = env.GUESTBOOK_ADMIN_KEY;
      if (!admin || req.headers.get("x-admin-key") !== admin) return json({ error: "Not allowed" }, 403);
      const id = clean(url.searchParams.get("id"), 80);
      if (!/^[0-9]+-[0-9a-f]{8}$/.test(id)) return json({ error: "Bad id" }, 400);
      await store.delete("m/" + id);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  };
}

export default createHandler(() => getStore({ name: "lantern-messages", consistency: "strong" }));

export const config = { path: "/api/messages" };
