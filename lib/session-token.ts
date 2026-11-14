const SESSION_VERSION = 1;
const MIN_SECRET_LENGTH = 32;
const encoder = new TextEncoder();

export const TEACHER_SESSION_COOKIE = "teacher_session";

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function importKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  if (secret.length < MIN_SECRET_LENGTH) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage,
  );
}

export async function createTeacherSessionToken(
  secret: string,
  expiresAt: number,
): Promise<string> {
  const payload = encodeBase64Url(
    encoder.encode(JSON.stringify({ version: SESSION_VERSION, expiresAt })),
  );
  const key = await importKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyTeacherSessionToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): Promise<boolean> {
  if (!token || !secret || secret.length < MIN_SECRET_LENGTH) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return false;

  let decodedPayload: { version?: unknown; expiresAt?: unknown };
  let decodedSignature: Uint8Array<ArrayBuffer>;
  try {
    decodedPayload = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    decodedSignature = decodeBase64Url(signature);
  } catch {
    return false;
  }

  if (
    !decodedPayload ||
    typeof decodedPayload !== "object" ||
    decodedPayload.version !== SESSION_VERSION ||
    typeof decodedPayload.expiresAt !== "number" ||
    !Number.isSafeInteger(decodedPayload.expiresAt) ||
    decodedPayload.expiresAt <= now
  ) {
    return false;
  }

  const key = await importKey(secret, ["verify"]);
  return crypto.subtle.verify("HMAC", key, decodedSignature, encoder.encode(payload));
}
