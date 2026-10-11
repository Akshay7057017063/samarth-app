// =====================================================
// DEVICE-BOUND KEY (Trusted Device Verification)
// =====================================================
//
// A non-extractable ECDSA P-256 key pair is created once per
// browser and stored in IndexedDB. The private key can never be
// read or copied by JavaScript; it can only SIGN. The server
// stores the public key and verifies a fresh signature at every
// login, so copying a "device id" from one phone to another does
// not work.
//
// Clearing browser data or using another browser creates a new
// key => the server treats it as a NEW device (admin approval).
// =====================================================

const DB_NAME = "samarth-device";
const STORE = "keys";
const KEY_ID = "device-key-v1";

const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idbGet = async (key) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
};

const idbSet = async (key, value) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getOrCreateKeyPair = async () => {
  const existing = await idbGet(KEY_ID);
  if (existing?.privateKey && existing?.publicKey) return existing;

  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false, // private key NON-extractable
    ["sign", "verify"]
  );

  await idbSet(KEY_ID, pair);
  return pair;
};

const toBase64 = (buffer) => {
  let binary = "";
  new Uint8Array(buffer).forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const describeDevice = () => {
  const ua = navigator.userAgent || "";
  const android = ua.match(/Android[^;)]*;\s*([^;)]+)/);
  if (android) return `Android ${android[1]}`.trim().slice(0, 100);
  if (/iPhone|iPad/.test(ua)) return "iPhone / iPad";
  return ua.slice(0, 100);
};

/**
 * Create a signed proof for the backend.
 * purpose: "login" | "activate"
 * identifier: exactly the (trimmed) ID string sent in the request.
 * Returns null when this browser cannot create device keys.
 */
export const createDeviceProof = async (purpose, identifier) => {
  try {
    if (
      !window.crypto?.subtle ||
      !window.indexedDB ||
      !window.isSecureContext
    ) {
      return null;
    }

    const { privateKey, publicKey } = await getOrCreateKeyPair();
    const jwk = await crypto.subtle.exportKey("jwk", publicKey);
    const timestamp = Date.now();

    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      new TextEncoder().encode(`${purpose}|${identifier}|${timestamp}`)
    );

    return {
      publicKey: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
      signature: toBase64(signature),
      timestamp,
      deviceLabel: describeDevice(),
    };
  } catch (error) {
    console.error("Device key error:", error);
    return null;
  }
};
