// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createTeacherSessionToken, verifyTeacherSessionToken } from "./session-token";

const secret = "test-session-secret-with-at-least-32-characters";

describe("teacher session token", () => {
  it("verifies a token until its expiry", async () => {
    const expiresAt = 2_000_000_000_000;
    const token = await createTeacherSessionToken(secret, expiresAt);

    await expect(verifyTeacherSessionToken(token, secret, expiresAt - 1)).resolves.toBe(true);
    await expect(verifyTeacherSessionToken(token, secret, expiresAt)).resolves.toBe(false);
  });

  it("rejects missing secrets, malformed tokens, and tampering", async () => {
    const token = await createTeacherSessionToken(secret, Date.now() + 60_000);
    const [payload, signature] = token.split(".");
    const lastPayloadChar = payload!.at(-1);
    const tamperedPayload = `${payload!.slice(0, -1)}${lastPayloadChar === "a" ? "b" : "a"}`;

    await expect(verifyTeacherSessionToken(undefined, secret)).resolves.toBe(false);
    await expect(verifyTeacherSessionToken(token, undefined)).resolves.toBe(false);
    await expect(verifyTeacherSessionToken("not-a-token", secret)).resolves.toBe(false);
    await expect(verifyTeacherSessionToken(`${tamperedPayload}.${signature}`, secret)).resolves.toBe(
      false,
    );
  });

  it("rejects short secrets when creating a session", async () => {
    await expect(createTeacherSessionToken("too-short", Date.now() + 60_000)).rejects.toThrow(
      "SESSION_SECRET must be at least 32 characters.",
    );
  });
});
