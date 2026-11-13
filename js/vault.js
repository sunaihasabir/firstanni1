/* =====================================================================
   🔒  VAULT — real encryption for the private romantic folder
   ---------------------------------------------------------------------
   • Photos are packed into ONE file and encrypted with AES-256-GCM.
   • The key comes from YOUR password (PBKDF2-SHA256, 250,000 rounds).
   • The password is never stored anywhere — not in the website, not in
     the file. Without it, vault.enc is just random-looking bytes.
   • Used by the website (to unlock) and by tools/lock-photos.html
     (to lock).
   File layout:  "SVLT" | version(1) | salt(16) | iv(12) | ciphertext
   Plaintext:    manifestLength(4, big-endian) | manifest JSON | file bytes
   ===================================================================== */

(function () {
  const MAGIC = [83, 86, 76, 84]; // "SVLT"
  const VERSION = 1;
  const ITERATIONS = 250000;
  const enc = new TextEncoder(), dec = new TextDecoder();

  function hasCrypto() { return !!(window.crypto && crypto.subtle); }

  async function deriveKey(password, salt) {
    const base = await crypto.subtle.importKey("raw", enc.encode(password.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  }

  /** items: [{ type: "image"|"video", mime, caption, bytes: Uint8Array }] → Uint8Array (vault.enc) */
  async function lock(items, password) {
    if (!hasCrypto()) throw new Error("This browser cannot encrypt here. Open the page with a local server or online (https).");
    let offset = 0;
    const manifest = { v: VERSION, created: new Date().toISOString(), items: items.map((it) => {
      const m = { type: it.type, mime: it.mime, caption: it.caption || "", offset, length: it.bytes.length };
      offset += it.bytes.length; return m;
    }) };
    const mBytes = enc.encode(JSON.stringify(manifest));
    const plain = new Uint8Array(4 + mBytes.length + offset);
    new DataView(plain.buffer).setUint32(0, mBytes.length);
    plain.set(mBytes, 4);
    let p = 4 + mBytes.length;
    items.forEach((it) => { plain.set(it.bytes, p); p += it.bytes.length; });

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));

    const out = new Uint8Array(5 + 16 + 12 + cipher.length);
    out.set(MAGIC, 0); out[4] = VERSION; out.set(salt, 5); out.set(iv, 21); out.set(cipher, 33);
    return out;
  }

  /** buffer: ArrayBuffer of vault.enc → [{ type, caption, url }]. Throws "WRONG_PASSWORD" or "BAD_FILE". */
  async function unlock(buffer, password) {
    if (!hasCrypto()) throw new Error("NO_CRYPTO");
    const b = new Uint8Array(buffer);
    if (b.length < 40 || MAGIC.some((v, i) => b[i] !== v) || b[4] !== VERSION) throw new Error("BAD_FILE");
    const salt = b.slice(5, 21), iv = b.slice(21, 33), cipher = b.slice(33);
    const key = await deriveKey(password, salt);
    let plain;
    try { plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher)); }
    catch (e) { throw new Error("WRONG_PASSWORD"); }
    const mLen = new DataView(plain.buffer).getUint32(0);
    const manifest = JSON.parse(dec.decode(plain.subarray(4, 4 + mLen)));
    const base = 4 + mLen;
    return manifest.items.map((it) => ({
      type: it.type, caption: it.caption,
      url: URL.createObjectURL(new Blob([plain.subarray(base + it.offset, base + it.offset + it.length)], { type: it.mime }))
    }));
  }

  window.Vault = { lock, unlock, hasCrypto };
})();
